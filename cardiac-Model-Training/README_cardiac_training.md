# 🫀 Cardiac Model Training

This folder contains all Jupyter notebooks used for training the cardiac arrest risk prediction model. The model is **image-based**, trained on **chest X-ray images** using **transfer learning** — a pre-trained convolutional neural network (CNN) is loaded and fine-tuned on cardiac X-ray data. The final model is deployed in the **cardiac-model-web** application.

---

## 📁 Folder Structure

```
cardiac-Model-Training/
├── Model2V1.ipynb                 # Version 1 — initial fine-tuning experiment
└── Model2V2_used_in_web.ipynb     # ✅ Version 2 — FINAL MODEL (used in production)
```

> ✅ **Model2V2** is the final fine-tuned model deployed in the web application.

---

## 📊 Data Source

**Dataset:** Chest X-Ray Image Dataset

| Property | Details |
|----------|---------|
| Type | Medical chest X-ray images |
| Format | Image files (JPEG / PNG) |
| Task | Binary image classification — cardiac risk prediction from X-ray |
| Input | Chest X-ray image |
| Output | Cardiac arrest risk (high / low) |

> The model takes a **chest X-ray image as input** and predicts the cardiac risk level — unlike tabular models that use patient measurements, this model learns directly from visual patterns in X-ray scans.

---

## 🧠 Model Strategy — Transfer Learning (Fine-Tuning a Pre-Trained CNN)

Instead of training a deep convolutional neural network from scratch (which requires millions of images), this project uses **transfer learning**: a CNN pre-trained on a large image dataset is loaded and its weights are adapted (fine-tuned) specifically for cardiac X-ray classification.

### Why Transfer Learning on X-Rays?

| Benefit | Explanation |
|---------|-------------|
| **Powerful visual features** | Pre-trained CNNs already detect edges, shapes, textures — useful for X-rays |
| **Less data needed** | Fine-tuning works well even with a smaller X-ray dataset |
| **Faster convergence** | Starts from strong visual representations instead of random weights |
| **Better accuracy** | Transfer learning consistently outperforms training from scratch on medical images |

---

### Transfer Learning Pipeline

```
Pre-Trained CNN (trained on large image dataset)
        │
        ▼
  Freeze convolutional layers     ← Keep low-level visual feature detectors
        │
        ▼
  Replace classification head     ← New output layer for cardiac binary classification
        │
        ▼
  Fine-tune on chest X-ray data   ← Adapt to cardiac-specific visual patterns
        │
        ▼
  K-Fold Cross-Validation         ← Train 5 separate fine-tuned models
        │
        ▼
  Ensemble all folds              ← Combine for final robust prediction
        │
        ▼
  Export .pt model files          ← Used in web backend
```

---

### Fine-Tuning Details

1. **Load Pre-Trained CNN**
   - A CNN pre-trained on a large image dataset is loaded with its original weights
   - The convolutional backbone already knows how to extract meaningful visual features

2. **Freeze Convolutional Layers**
   - Early and mid-level convolutional layers are frozen
   - These layers detect general image features (edges, textures, shapes) useful for any image task

3. **Replace Classification Head**
   - The original output layer is removed
   - A new classification layer is added for binary cardiac risk prediction (high / low)

4. **Fine-Tune on Chest X-Ray Data**
   - The unfrozen layers + new head are trained on cardiac X-ray images
   - A low learning rate is used to preserve pre-trained visual knowledge

5. **K-Fold Cross-Validation**
   - Fine-tuning is repeated across 5 data folds
   - Each fold produces its own fine-tuned model (`fold_0.pt` → `fold_4.pt`)
   - All 5 models are combined into a final ensemble (`ensemble_model.pt`)

---

## 🔄 Model Versioning

| Version | Notebook | Key Changes | Status |
|---------|----------|-------------|--------|
| V1 | `Model2V1.ipynb` | Initial fine-tuning — basic layer replacement and training | Archived |
| V2 | `Model2V2_used_in_web.ipynb` | Improved fine-tuning strategy + k-fold ensemble | ✅ **Production** |

---

## 📦 Exported Artifacts

The following `.pt` files are exported from `Model2V2_used_in_web.ipynb` and used in the web backend:

| File | Description | Location |
|------|-------------|----------|
| `fold_0.pt` | Fine-tuned CNN — Fold 0 | `cardiac-model-web/backend/` |
| `fold_1.pt` | Fine-tuned CNN — Fold 1 | `cardiac-model-web/backend/` |
| `fold_2.pt` | Fine-tuned CNN — Fold 2 | `cardiac-model-web/backend/` |
| `fold_3.pt` | Fine-tuned CNN — Fold 3 | `cardiac-model-web/backend/` |
| `fold_4.pt` | Fine-tuned CNN — Fold 4 | `cardiac-model-web/backend/` |
| `ensemble_model.pt` | Final ensemble of all 5 fine-tuned folds | `cardiac-model-web/backend/` |

---

## 🚀 How to Run

### Prerequisites
```bash
pip install jupyter torch torchvision pandas numpy scikit-learn matplotlib seaborn Pillow
```

### Run notebooks in order
```bash
jupyter notebook
```

Recommended order:
1. `Model2V1.ipynb` — understand the baseline fine-tuning approach
2. `Model2V2_used_in_web.ipynb` — full fine-tuning + k-fold ensemble export

---

## 📈 Evaluation Metrics

| Metric | Why It Matters |
|--------|----------------|
| **Accuracy** | Overall correctness across X-ray classifications |
| **Precision** | Avoids false cardiac risk alarms |
| **Recall** | Catches all true high-risk X-rays — critical in medical imaging |
| **F1-Score** | Balance between precision and recall |
| **AUC-ROC** | Overall model discrimination on image data |
| **Cross-Validation Score** | Mean ± std across 5 folds — measures generalization |

---

## ⚡ Why Fine-Tuning + K-Fold Ensemble on X-Ray Images?

```
Pre-trained CNN vision      +   X-ray fine-tuning    +   K-Fold Ensemble
        ↓                             ↓                        ↓
 Strong visual features      Cardiac-specific patterns    Stable predictions
```

- Pre-trained CNN provides powerful image feature extraction out of the box
- Fine-tuning on X-rays adapts those features to detect cardiac abnormalities
- K-fold ensemble reduces overfitting and variance across different data splits
- Result: a robust, image-based cardiac risk predictor ready for clinical use

---

## 👤 Author

**Dulanjan Kavindu**
[GitHub](https://github.com/DulanjanKavi)

---

## 📄 License

MIT License
