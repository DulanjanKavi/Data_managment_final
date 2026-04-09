# =============================================================================
# main.py — FastAPI backend for Cardiac X-Ray Detection
# =============================================================================
# Install: pip install fastapi uvicorn python-multipart torchxrayvision
#          pillow torch torchvision numpy matplotlib
# Run:     uvicorn main:app --reload --port 8000
# =============================================================================

import os, io, base64, math, random
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.cm as mpl_cm

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

try:
    import torchxrayvision as xrv
except ImportError:
    raise ImportError("Run: pip install torchxrayvision")

# =============================================================================
# CONFIG
# =============================================================================
ENSEMBLE_CKPT = "ensemble_model.pt"
DEVICE        = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Device: {DEVICE}")

# =============================================================================
# PREPROCESSING — identical to training
# =============================================================================
def apply_clahe(img_pil, clip_limit=2.0, grid_size=8):
    arr  = np.array(img_pil.convert("L")).astype(np.float32)
    h, w = arr.shape
    th, tw = h // grid_size, w // grid_size
    out  = np.zeros_like(arr)
    for i in range(grid_size):
        for j in range(grid_size):
            y0, y1 = i*th, min(i*th+th, h)
            x0, x1 = j*tw, min(j*tw+tw, w)
            tile = arr[y0:y1, x0:x1]
            hist, bins = np.histogram(tile.flatten(), bins=256, range=(0,255))
            clip_val = clip_limit * tile.size / 256
            excess   = np.sum(np.maximum(hist - clip_val, 0))
            hist     = np.minimum(hist, clip_val) + excess / 256
            cdf      = hist.cumsum()
            cdf      = (cdf - cdf.min()) / (cdf.max() - cdf.min() + 1e-8) * 255
            out[y0:y1, x0:x1] = np.interp(
                tile.flatten(), bins[:-1], cdf).reshape(tile.shape)
    return Image.fromarray(out.clip(0,255).astype(np.uint8)).convert("RGB")

EVAL_TF = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.Grayscale(num_output_channels=1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5]),
])

TTA_TFS = [
    transforms.Compose([transforms.Resize((256,256)), transforms.CenterCrop(224),
                        transforms.Grayscale(1), transforms.ToTensor(),
                        transforms.Normalize([0.5],[0.5])]),
    transforms.Compose([transforms.Resize((256,256)), transforms.RandomCrop(224),
                        transforms.Grayscale(1), transforms.ToTensor(),
                        transforms.Normalize([0.5],[0.5])]),
    transforms.Compose([transforms.Resize((256,256)), transforms.RandomCrop(224),
                        transforms.RandomHorizontalFlip(p=1.0),
                        transforms.Grayscale(1), transforms.ToTensor(),
                        transforms.Normalize([0.5],[0.5])]),
    transforms.Compose([transforms.Resize((240,240)), transforms.CenterCrop(224),
                        transforms.Grayscale(1), transforms.ToTensor(),
                        transforms.Normalize([0.5],[0.5])]),
    transforms.Compose([transforms.Resize((256,256)), transforms.RandomCrop(224),
                        transforms.RandomRotation(5),
                        transforms.Grayscale(1), transforms.ToTensor(),
                        transforms.Normalize([0.5],[0.5])]),
]

# =============================================================================
# MODEL
# =============================================================================
class CheXNetModel(nn.Module):
    def __init__(self, dropout=0.4):
        super().__init__()
        base = xrv.models.DenseNet(weights="densenet121-res224-nih")
        self.features = base.features
        self.pool     = nn.AdaptiveAvgPool2d(1)
        self.head     = nn.Sequential(
            nn.Dropout(dropout), nn.Linear(1024, 256),
            nn.BatchNorm1d(256), nn.ReLU(),
            nn.Dropout(dropout/2), nn.Linear(256, 64),
            nn.BatchNorm1d(64), nn.ReLU(),
            nn.Linear(64, 1),
        )
    def forward(self, x):
        return self.head(torch.flatten(
            self.pool(F.relu(self.features(x), inplace=True)), 1))

# =============================================================================
# GRAD-CAM
# =============================================================================
class GradCAM:
    def __init__(self, model):
        self.model  = model
        self._acts  = self._grads = None
        target      = model.features.denseblock4
        self._h1    = target.register_forward_hook(
            lambda _,__,o: setattr(self, "_acts", o))
        self._h2    = target.register_full_backward_hook(
            lambda _,__,gi: setattr(self, "_grads", gi[0]))

    def remove(self): self._h1.remove(); self._h2.remove()

    def generate(self, img_tensor, class_idx=1):
        self.model.eval()
        x   = img_tensor.unsqueeze(0).to(DEVICE)
        out = self.model(x)
        self.model.zero_grad()
        (out[0,0] if class_idx == 1 else -out[0,0]).backward()
        w   = self._grads.mean(dim=(2,3), keepdim=True)
        cam = F.relu((w * self._acts).sum(dim=1)).squeeze()
        cam = cam.detach().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam

def dominant_region(cam):
    h, w = cam.shape
    q = {
        "upper-left":  cam[:h//2, :w//2].mean(),
        "upper-right": cam[:h//2, w//2:].mean(),
        "lower-left":  cam[h//2:, :w//2].mean(),
        "lower-right": cam[h//2:, w//2:].mean(),
    }
    return max(q, key=q.get)

def cam_to_base64(img_tensor, cam):
    gray  = img_tensor.squeeze(0).cpu().numpy()
    disp  = np.stack([(gray * 0.5 + 0.5).clip(0,1)] * 3, axis=2)
    h_up  = np.array(Image.fromarray(
        (cam * 255).astype(np.uint8)).resize((224,224), Image.BILINEAR)) / 255.0
    blend = 0.55 * disp + 0.45 * mpl_cm.jet(h_up)[:,:,:3]
    fig, ax = plt.subplots(figsize=(4,4))
    ax.imshow(blend); ax.axis("off")
    plt.tight_layout(pad=0)
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig); buf.seek(0)
    return base64.b64encode(buf.read()).decode()

# =============================================================================
# LOAD MODELS AT STARTUP
# =============================================================================
MODELS:    list[CheXNetModel] = []
THRESHOLD: float               = 0.5

def load_models():
    global MODELS, THRESHOLD
    if not os.path.exists(ENSEMBLE_CKPT):
        print(f"[WARNING] {ENSEMBLE_CKPT} not found — predictions disabled.")
        return

    meta       = torch.load(ENSEMBLE_CKPT, map_location=DEVICE, weights_only=False)
    fold_ckpts = meta["fold_ckpts"]
    THRESHOLD  = float(meta.get("threshold", 0.5))

    for ckpt_path in fold_ckpts:
        local = os.path.basename(ckpt_path)
        if not os.path.exists(local):
            raise FileNotFoundError(
                f"Fold checkpoint not found: {local}\n"
                "Copy all fold_N.pt files next to main.py")
        m    = CheXNetModel().to(DEVICE)
        ckpt = torch.load(local, map_location=DEVICE, weights_only=False)
        m.load_state_dict(ckpt["state_dict"])
        m.eval()
        MODELS.append(m)

    print(f"Loaded {len(MODELS)}-model ensemble  (threshold={THRESHOLD:.3f})")

load_models()

# =============================================================================
# PREDICTION HELPERS
# =============================================================================
def tta_single(model, img_pil):
    probs = []
    with torch.no_grad():
        for tf in TTA_TFS:
            t = tf(img_pil).unsqueeze(0).to(DEVICE)
            probs.append(torch.sigmoid(model(t)).item())
    return float(np.mean(probs))

def predict_ensemble(img_pil):
    img_clahe = apply_clahe(img_pil)
    probs     = [tta_single(m, img_clahe) for m in MODELS]
    conf      = float(np.mean(probs))
    img_t     = EVAL_TF(img_clahe)

    gcam      = GradCAM(MODELS[0])
    pred_idx  = 1 if conf >= THRESHOLD else 0
    cam       = gcam.generate(img_t, class_idx=pred_idx)
    gcam.remove()

    return {
        "confidence":  conf,
        "prediction":  "Positive" if conf >= THRESHOLD else "Negative",
        "focus_region": dominant_region(cam),
        "gradcam_b64": cam_to_base64(img_t, cam),
        "fold_probs":  [round(p, 4) for p in probs],
    }

# =============================================================================
# FASTAPI APP
# =============================================================================
app = FastAPI(title="Cardiac X-Ray API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":    "ok",
        "device":    str(DEVICE),
        "n_models":  len(MODELS),
        "threshold": round(THRESHOLD, 3),
        "tta_views": len(TTA_TFS),
        "votes":     len(MODELS) * len(TTA_TFS),
    }

# ── Predict ───────────────────────────────────────────────────────────────────
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    ALLOWED = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"}
    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in ALLOWED:
        raise HTTPException(400, f"Unsupported format: {ext}")
    if not MODELS:
        raise HTTPException(503, "Models not loaded. Check checkpoint files.")

    try:
        data    = await file.read()
        img_pil = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Cannot read image: {e}")

    result = predict_ensemble(img_pil)
    conf   = result["confidence"]
    pred   = result["prediction"]

    # Clinical interpretation (no disclaimers)
    region = result["focus_region"]
    if pred == "Positive":
        interpretation = (
            f"Features consistent with an enlarged cardiac silhouette were detected. "
            f"The model's attention was concentrated in the {region} region, "
            f"which may correspond to the cardiothoracic ratio border or cardiac "
            f"shadow. This pattern is associated with cardiomegaly."
        )
    else:
        interpretation = (
            f"No significant evidence of cardiomegaly was identified. "
            f"Model attention was distributed across the {region} region. "
            f"The cardiac silhouette and cardiothoracic ratio appear within "
            f"normal limits based on the learned feature representation."
        )

    return {
        "prediction":      pred,
        "confidence_pct":  round(conf * 100, 1),
        "confidence_raw":  round(conf, 4),
        "threshold":       round(THRESHOLD, 3),
        "focus_region":    region,
        "interpretation":  interpretation,
        "gradcam_b64":     result["gradcam_b64"],
        "fold_probs":      result["fold_probs"],
        "model_info": {
            "architecture":  "CheXNet DenseNet121",
            "pretrained_on": "NIH ChestX-ray14",
            "ensemble_size": len(MODELS),
            "tta_views":     len(TTA_TFS),
            "total_votes":   len(MODELS) * len(TTA_TFS),
            "preprocessing": "CLAHE + Grayscale",
        },
    }

# ── Update threshold ──────────────────────────────────────────────────────────
class ThresholdBody(BaseModel):
    threshold: float

@app.post("/threshold")
def set_threshold(body: ThresholdBody):
    global THRESHOLD
    if not 0.0 <= body.threshold <= 1.0:
        raise HTTPException(400, "Threshold must be 0.0 – 1.0")
    THRESHOLD = body.threshold
    return {"threshold": round(THRESHOLD, 3)}
