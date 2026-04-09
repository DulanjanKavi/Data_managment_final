from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import joblib
import shap
import io
import base64
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# --- FIX FOR MAC ERROR ---
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt
# -------------------------

app = FastAPI()

# 1. CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load Models
print("--- LOADING AI SYSTEM ---")
try:
    model = joblib.load('champion_model.pkl')
    scaler = joblib.load('scaler.pkl')
    imputer = joblib.load('imputer.pkl')
    print("✅ AI Brain Loaded.")
except Exception as e:
    print(f"❌ CRITICAL ERROR: {e}")

# 3. Setup SHAP (Visuals)
explainer = None
try:
    target_estimator = None
    if hasattr(model, "named_estimators_"):
        for name, est in model.named_estimators_.items():
            if any(x in name.lower() for x in ['cat', 'xgb', 'rf', 'forest']):
                target_estimator = est
                break
    if target_estimator:
        explainer = shap.TreeExplainer(target_estimator)
        print("✅ Visual Reasoning Ready.")
except:
    print("⚠️ Visual Reasoning Disabled")

# 4. Input Schema
class PatientData(BaseModel):
    age: float
    sex: int
    cp: int
    trestbps: Optional[float] = None
    chol: Optional[float] = None
    fbs: int
    restecg: int
    thalach: Optional[float] = None
    exang: int
    oldpeak: Optional[float] = None
    slope: int
    ca: Optional[float] = None
    thal: Optional[float] = None

@app.post("/predict")
def predict(data: PatientData):
    try:
        # --- A. PREPARE RAW DATA ---
        input_dict = data.dict()
        df = pd.DataFrame([input_dict])
        df.fillna(value=np.nan, inplace=True)
        
        missing_user_inputs = [col for col in df.columns if df[col].isna().any()]

        # --- B. DEFINE COLUMNS ---
        # 13 Original (For Imputer)
        safe_cols_for_imputer = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
                                 'thalach', 'exang', 'oldpeak', 'slope']
        
        # Columns we might drop if Imputer doesn't know them
        risky_cols = ['ca', 'thal']

        # --- C. SMART IMPUTATION ---
        try:
            imputer_features = imputer.feature_names_in_
        except AttributeError:
            imputer_features = safe_cols_for_imputer

        # Filter and Impute
        df_for_imputer = df.reindex(columns=imputer_features)
        df_imp_array = imputer.transform(df_for_imputer)
        df_imp = pd.DataFrame(df_imp_array, columns=imputer_features)

        # --- D. RESTORE DROPPED COLUMNS ---
        for col in risky_cols:
            if col not in df_imp.columns:
                user_val = df[col].values[0]
                df_imp[col] = user_val if not np.isnan(user_val) else 0.0

        # --- E. FEATURE ENGINEERING ---
        df_imp['age_thalach'] = df_imp['age'] * df_imp['thalach']
        df_imp['bp_chol'] = df_imp['trestbps'] * df_imp['chol']
        df_imp['stress_factor'] = df_imp['oldpeak'] * df_imp['slope']

        # --- F. FINAL PREDICTION SETUP ---
        final_cols = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
                      'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 
                      'age_thalach', 'bp_chol', 'stress_factor']
        
        try:
            model_features = model.feature_names_in_
        except:
            model_features = final_cols

        df_final = df_imp.reindex(columns=model_features, fill_value=0)

        try:
            df_scaled = pd.DataFrame(scaler.transform(df_final), columns=model_features)
        except:
            df_scaled = df_final

        # --- G. PREDICT ---
        prediction = model.predict(df_scaled)[0]
        probability = model.predict_proba(df_scaled)[0][1]
        if np.isnan(probability): probability = 0.0

        # --- H. EXPLANATION ---
        plot_base64 = None
        text_explanation = []

        if explainer:
            print("--- Generating Visual Explanation ---")
            try:
                # 1. Calculate SHAP Values
                shap_values = explainer(df_scaled)
                
                # --- CRITICAL FIX: Handle Multiclass Shape ---
                # If shape is (1, features, 2), pick index 1 (Positive Class)
                if len(shap_values.values.shape) > 1 and shap_values.values.shape[-1] == 2:
                     explanation_to_plot = shap_values[0, :, 1]
                else:
                     explanation_to_plot = shap_values[0]
                
                # 2. GENERATE PLOT
                plt.clf()
                fig = plt.figure(figsize=(8, 5), dpi=100)
                shap.plots.waterfall(explanation_to_plot, max_display=10, show=False)
                
                buf = io.BytesIO()
                plt.savefig(buf, format="png", bbox_inches='tight', transparent=False)
                plt.close(fig)
                plot_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

                # 3. GENERATE TEXT & TERMINAL DATA
                # Use explanation_to_plot values instead of raw shap_values
                vals = explanation_to_plot.values
                base_value = explanation_to_plot.base_values
                
                # Sort by impact
                top_indices = np.argsort(np.abs(vals))[::-1][:5]

                # --- TERMINAL PRINTING ---
                visual_logic_data = []
                for i, col_name in enumerate(df_scaled.columns):
                    visual_logic_data.append({
                        "Feature": col_name,
                        "Patient Value": df_final.iloc[0, i], 
                        "Impact Score": vals[i]
                    })
                visual_logic_data.sort(key=lambda x: abs(x["Impact Score"]), reverse=True)

                print("\n" + "="*60)
                print(f"🔍 VISUAL LOGIC DATA (Base Value: {base_value:.4f})")
                print(f"{'Feature':<20} | {'Val':<10} | {'Impact':<10}")
                print("-" * 60)
                
                current_total = base_value
                for item in visual_logic_data:
                    print(f"{item['Feature']:<20} | {item['Patient Value']:<10.2f} | {item['Impact Score']:+.4f}")
                    current_total += item['Impact Score']
                print("="*60 + "\n")
                # -------------------------

                # 4. FRONTEND TEXT EXPLANATION
                for idx in top_indices:
                    feature_name = df_scaled.columns[idx]
                    impact_score = vals[idx]
                    real_val = df_final.iloc[0, idx]
                    
                    direction = "Increased Risk 🔺" if impact_score > 0 else "Reduced Risk 🛡️"
                    text_explanation.append(f"{feature_name} ({real_val:.1f}) -> {direction}")

            except Exception as e:
                print(f"❌ SHAP ERROR: {str(e)}")
                import traceback
                traceback.print_exc()

        # --- I. CONSTRUCT RESPONSE ---
        response_payload = {
            "prediction": int(prediction),
            "risk_probability": float(probability),
            "status": "High Risk" if prediction == 1 else "Healthy",
            "plot_image": plot_base64,
            "text_explanation": text_explanation,
            "estimations": {col: round(df_imp[col].values[0], 1) for col in missing_user_inputs if col in df_imp.columns}
        }

        # Print Summary
        print("\n📡 SENDING TO FRONTEND:")
        print(f"   > Status: {response_payload['status']}")
        print(f"   > Prob:   {response_payload['risk_probability']:.4f}")
        print(f"   > Drivers: {len(text_explanation)} found")

        return response_payload

    except Exception as e:
        print(f"SERVER ERROR: {e}")
        return {"error": str(e)}
    
if __name__ == "__main__":
    
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)