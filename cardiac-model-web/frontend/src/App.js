import { useState, useRef, useCallback, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8001";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconUpload() {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

// ── API Status Pill ───────────────────────────────────────────────────────────
function ApiStatus({ status, info }) {
  const styles = {
    checking: "bg-yellow-100 text-yellow-800 border-yellow-300",
    online:   "bg-green-100 text-green-800 border-green-300",
    offline:  "bg-red-100 text-red-800 border-red-300",
  };
  const dots = {
    checking: "bg-yellow-400",
    online:   "bg-green-500",
    offline:  "bg-red-500",
  };
  const labels = {
    checking: "Checking...",
    online:   `API Online · ${info?.n_models || 0} models`,
    offline:  "API Offline",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium", styles[status])}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[status])} />
      {labels[status]}
    </span>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFile, preview, fileName }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handle = useCallback((f) => {
    if (!f) return;
    const ok = ["image/png", "image/jpeg", "image/bmp", "image/tiff"];
    if (!ok.includes(f.type)) return;
    onFile(f);
  }, [onFile]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
      className={cn(
        "relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
        dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
      )}
    >
      {preview ? (
        <div className="relative">
          <img src={preview} alt="X-ray preview" className="w-full h-64 object-contain bg-black rounded-xl" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
            <p className="text-white text-sm font-medium truncate">{fileName}</p>
            <p className="text-white/60 text-xs">Click to replace</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-slate-400">
          <IconUpload />
          <p className="mt-4 text-sm font-medium text-slate-600">Drop your X-ray here</p>
          <p className="mt-1 text-xs text-slate-400">
            or <span className="text-blue-600 font-medium">browse files</span>
          </p>
          <p className="mt-3 text-xs text-slate-400">PNG · JPEG · BMP · TIFF</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".png,.jpg,.jpeg,.bmp,.tiff,.tif"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}

// ── Threshold Slider ──────────────────────────────────────────────────────────
function ThresholdSlider({ value, onChange }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Decision threshold</span>
        <span className="text-sm font-bold text-slate-900 tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min="0.20"
        max="0.80"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-400">More sensitive</span>
        <span className="text-xs text-slate-400">More specific</span>
      </div>
    </div>
  );
}

// ── Confidence Bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ pct, isPositive }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Disease probability</span>
        <span className="text-sm font-bold text-slate-800 tabular-nums">{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", isPositive ? "bg-red-500" : "bg-green-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Per-fold Bar Chart ────────────────────────────────────────────────────────
function FoldChart({ probs, threshold }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Per-fold predictions</p>
      <div className="flex gap-2 items-end" style={{ height: 64 }}>
        {probs.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full relative bg-slate-100 rounded-sm overflow-hidden" style={{ height: 40 }}>
              <div
                className={cn("absolute bottom-0 w-full rounded-sm transition-all", p >= threshold ? "bg-red-400" : "bg-green-400")}
                style={{ height: `${p * 100}%` }}
              />
              <div className="absolute w-full" style={{ bottom: `${threshold * 100}%`, borderTop: "1.5px dashed #6b7280" }} />
            </div>
            <span className="text-xs text-slate-500">F{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Result Panel ──────────────────────────────────────────────────────────────
function ResultPanel({ result, threshold }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <IconInfo />
        </div>
        <p className="text-sm font-medium">No result yet</p>
        <p className="text-xs mt-1">Upload an X-ray and click Analyse</p>
      </div>
    );
  }

  const isPositive = result.prediction === "Positive";

  return (
    <div className="space-y-5">
      <div className={cn("flex items-center gap-4 p-5 rounded-2xl border-2", isPositive ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", isPositive ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
          {isPositive ? <IconWarning /> : <IconCheck />}
        </div>
        <div>
          <p className={cn("text-2xl font-bold", isPositive ? "text-red-700" : "text-green-700")}>
            {isPositive ? "Cardiomegaly Detected" : "No Cardiomegaly"}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            Confidence {result.confidence_pct}% · Threshold {result.threshold}
          </p>
        </div>
      </div>

      <ConfidenceBar pct={result.confidence_pct} isPositive={isPositive} />

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Grad-CAM attention map</p>
        <img src={`data:image/png;base64,${result.gradcam_b64}`} alt="Grad-CAM heatmap" className="w-full rounded-xl border border-slate-200" />
        <p className="text-xs text-slate-400 mt-1">
          Highest attention: <span className="font-medium text-slate-600">{result.focus_region}</span> region
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Interpretation</p>
        <p className="text-sm text-slate-700 leading-relaxed">{result.interpretation}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Confidence" value={`${result.confidence_pct}%`} />
        <MetricCard label="Threshold" value={result.threshold} sub="90% sensitivity target" />
        <MetricCard label="Attention region" value={result.focus_region} />
        <MetricCard label="Total votes" value={`${result.model_info.total_votes}`} sub={`${result.model_info.ensemble_size} models x ${result.model_info.tta_views} TTA`} />
      </div>

      <FoldChart probs={result.fold_probs} threshold={result.threshold} />

      <div className="flex flex-wrap gap-2">
        {[result.model_info.architecture, result.model_info.pretrained_on, result.model_info.preprocessing].map((tag) => (
          <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================
export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiInfo,   setApiInfo]   = useState(null);
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [threshold, setThreshold] = useState(0.5);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res  = await fetch(`${API}/health`);
        const data = await res.json();
        setApiStatus("online");
        setApiInfo(data);
        setThreshold(data.threshold);
      } catch {
        setApiStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const analyse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      await fetch(`${API}/threshold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });
    } catch {}

    const form = new FormData();
    form.append("file", file);

    try {
      const res  = await fetch(`${API}/predict`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Prediction failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not reach the API. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            C
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Cardiac X-Ray Analysis</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              CheXNet DenseNet121 · 5-Model Ensemble · CLAHE Preprocessing
            </p>
          </div>
          <ApiStatus status={apiStatus} info={apiInfo} />
        </div>
      </header>

      {/* Body */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Banners */}
        <div className="space-y-4 mb-6">

          {/* API offline warning — only shown when offline */}
          {apiStatus === "offline" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
              <IconWarning />
              <div>
                <p className="font-medium text-sm">API not reachable</p>
                <p className="text-xs mt-1 text-red-600">
                  Make sure the FastAPI server is running:
                  <code className="ml-1 bg-red-100 px-1.5 py-0.5 rounded font-mono">
                    uvicorn main:app --port 8001
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* CNH Channeling Center — always visible */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800">CNH Channeling Center</p>
                <p className="text-xs text-blue-600 mt-0.5">Open the hospital appointment system</p>
              </div>
            </div>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Open
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </a>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT — Upload */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Upload X-Ray
              </h2>

              <UploadZone onFile={handleFile} preview={preview} fileName={file?.name} />

              <div className="mt-5">
                <ThresholdSlider value={threshold} onChange={setThreshold} />
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={analyse}
                disabled={!file || loading || apiStatus === "offline"}
                className={cn(
                  "mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all",
                  !file || loading || apiStatus === "offline"
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 active:scale-95"
                )}
              >
                {loading && <IconSpinner />}
                {loading ? "Analysing..." : "Analyse X-Ray"}
              </button>
            </div>

            {/* Model info card */}
            {apiInfo && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Model Info
                </h2>
                <div className="space-y-2">
                  {[
                    ["Models loaded",    apiInfo.n_models],
                    ["TTA views",        apiInfo.tta_views],
                    ["Total votes",      apiInfo.votes],
                    ["Active threshold", apiInfo.threshold],
                    ["Device",           apiInfo.device],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-medium text-slate-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Results */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Result
            </h2>
            <ResultPanel result={result} threshold={threshold} />
          </div>

        </div>
      </main>
    </div>
  );
}