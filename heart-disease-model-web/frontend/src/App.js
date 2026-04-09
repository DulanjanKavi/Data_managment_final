import React, { useState } from 'react';
import axios from 'axios';

function App() {
  // --- 1. STATE ---
  const [formData, setFormData] = useState({
    age: 67, sex: 1, cp: 0, trestbps: 160, chol: 286,
    fbs: 0, restecg: 0, thalach: 108, exang: 1,
    oldpeak: 1.5, slope: 1, ca: 3, thal: 2
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Defines which fields are "Required" (cannot be imputed well) vs "Optional" (AI can guess)
  // Based on your reliability study, 'fbs' and 'restecg' are hard to guess, so we mark them required.
  const fieldConfig = {
    age: { label: "Age", required: true },
    sex: { label: "Sex (1=M, 0=F)", required: true },
    cp: { label: "Chest Pain (0-3)", required: true },
    trestbps: { label: "Resting BP", required: false },
    chol: { label: "Cholesterol", required: false },
    fbs: { label: "Fasting Sugar > 120", required: true },
    restecg: { label: "Resting ECG", required: true },
    thalach: { label: "Max Heart Rate", required: false },
    exang: { label: "Exercise Angina", required: true },
    oldpeak: { label: "ST Depression", required: false },
    slope: { label: "Slope (0-2)", required: false },
    ca: { label: "Major Vessels (0-3)", required: false },
    thal: { label: "Thalassemia (1-3)", required: false },
  };

  // --- 2. HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationError) setValidationError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    
    let missingCount = 0;
    const payload = {};

    for (const key in formData) {
      const val = formData[key];
      if (val === "" || val === null) {
        missingCount++;
        payload[key] = null;
      } else {
        payload[key] = parseFloat(val);
      }
    }

    if (missingCount > 2) {
      setValidationError(`❌ Error: You have ${missingCount} missing fields. Max 2 allowed.`);
      return; 
    }

    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8002/predict', payload);
      if (res.data.error) {
        alert("Backend Error: " + res.data.error);
      } else {
        setResult(res.data);
      }
    } catch (err) {
      console.error(err);
      alert("Connection Error.");
    }
    setLoading(false);
  };

  // --- 3. RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        <div className="bg-blue-800 text-white p-6 rounded-t-xl shadow-lg text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">🫀 AI Cardiologist</h1>
          <p className="opacity-90 text-sm mt-1">Explainable AI Diagnostic System</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4 my-4">
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
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all">
            Open
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </a>
        </div>

        <div className="bg-white p-6 rounded-b-xl shadow-xl border border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: INPUT FORM */}
          <div className="lg:col-span-1 border-r border-gray-100 pr-4">
            <h3 className="font-bold text-lg mb-4 text-gray-700 border-b pb-2">📋 Patient Data</h3>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(formData).map((key) => (
                  <div key={key}>
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{fieldConfig[key].label}</label>
                      {/* INDICATOR: Optional vs Required */}
                      {!fieldConfig[key].required && (
                        <span className="text-[10px] text-blue-500 bg-blue-50 px-1 rounded border border-blue-100">
                          Auto-Fill
                        </span>
                      )}
                    </div>
                    <input 
                      name={key} 
                      type="number" 
                      step="any"
                      value={formData[key]} 
                      onChange={handleChange}
                      placeholder={fieldConfig[key].required ? "Required" : "?"}
                      className={`w-full border rounded p-2 text-sm outline-none transition-all focus:ring-2 ${
                        formData[key] === "" 
                          ? (fieldConfig[key].required ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50") 
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                  </div>
                ))}
              </div>

              {validationError && (
                <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm font-bold">
                  {validationError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow hover:bg-blue-700 transition-all disabled:bg-gray-400 mt-4"
              >
                {loading ? "Running AI Model..." : "Analyze Risk"}
              </button>
            </form>
          </div>

          {/* RIGHT: RESULTS */}
          <div className="lg:col-span-2">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                <span className="text-6xl mb-4">🩺</span>
                <p className="text-xl font-bold">Enter patient vitals to begin.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Score Card */}
                <div className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-xl shadow-md text-white ${
                  result.prediction === 1 ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-green-500 to-emerald-600"
                }`}>
                  <div>
                    <p className="text-xs uppercase font-bold opacity-80">Diagnosis</p>
                    <h2 className="text-4xl font-extrabold">{result.status}</h2>
                  </div>
                  <div className="mt-4 md:mt-0 text-center bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                    <p className="text-xs font-bold uppercase">AI Confidence</p>
                    <p className="text-3xl font-mono font-bold">{(result.risk_probability * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {/* 2. AI Estimations */}
                {result.estimations && Object.keys(result.estimations).length > 0 && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🤖</span>
                      <h4 className="font-bold text-amber-800">Data Imputation Active</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.estimations).map(([k, v]) => (
                        <span key={k} className="px-3 py-1 bg-white border border-amber-200 rounded text-xs font-bold text-amber-600">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 3. Visual Plot */}
                  <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">📊 Visual Reasoning</h4>
                    {result.plot_image ? (
                      <img src={`data:image/png;base64,${result.plot_image}`} className="w-full rounded" alt="SHAP" />
                    ) : <p className="text-sm text-gray-400">Graph not available.</p>}
                  </div>

                  {/* 4. The Math Story (NEW SECTION) */}
                  <div className="space-y-4">
                    
                    {/* Mathematical Explanation Card */}
                    {/* Only show Math Story if shap_details exists */}
{result.shap_details && (
    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
        🧮 The Math Behind the Decision
        </h4>
        <div className="text-sm text-indigo-700 space-y-2">
        <div className="flex justify-between border-b border-indigo-200 pb-1">
            <span>Average Population Risk <strong>(E[f(x)])</strong>:</span>
            <span className="font-mono font-bold">{result.shap_details.base_value}</span>
        </div>
        <div className="flex justify-between pt-1">
            <span>Patient's Final Score <strong>(f(x))</strong>:</span>
            <span className={`font-mono font-bold ${result.shap_details.final_value > 0 ? "text-red-600" : "text-green-600"}`}>
            {result.shap_details.final_value}
            </span>
        </div>
        </div>
    </div>
)}

                    {/* Key Drivers List */}
                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                      <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">📝 Key Drivers</h4>
                      <ul className="space-y-2">
                        {result.text_explanation.map((text, idx) => (
                          <li key={idx} className="text-sm bg-gray-50 p-2 rounded border-l-4 border-blue-400 flex justify-between">
                            <span>{text.split('->')[0]}</span>
                            <span className={text.includes("Increased") ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                              {text.split('->')[1]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;