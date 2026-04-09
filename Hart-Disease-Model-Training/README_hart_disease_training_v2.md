# ❤️ Heart Disease Model Training

This folder contains all Jupyter notebooks used for training, evaluating, and selecting the best machine learning model for heart disease risk prediction. Multiple algorithms were trained and compared, and a **champion model was selected using a weighted voting strategy**. The final model is deployed in the **heart-disease-model-web** application.

---

## 📁 Folder Structure

```
Hart-Disease-Model-Training/
├── Missing_values.ipynb           # Data cleaning & missing value analysis
├── Model1V1.ipynb                 # Version 1 — multi-algorithm comparison & baseline
├── Model1V2.ipynb                 # Version 2 — feature engineering improvements
├── Model1V3.ipynb                 # Version 3 — hyperparameter tuning
├── Model1V4_used_in_web.ipynb     # ✅ Version 4 — FINAL CHAMPION MODEL (used in production)
└── Model1V5.ipynb                 # Version 5 — experimental / further research
```

> ✅ **Model1V4** is the champion model deployed in the web application.

---

## 📊 Data Source

**Dataset:** UCI Heart Disease Dataset (Cleveland Heart Disease Database)

| Property | Details |
|----------|---------|
| Source | [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/45/heart+disease) |
| Samples | ~1000 records |
| Features | 13 input features + 1 target variable |
| Task | Binary classification (disease present / not present) |

### Features Used

| Feature | Description |
|---------|-------------|
| `age` | Age of the patient |
| `sex` | Sex (1 = male, 0 = female) |
| `cp` | Chest pain type (0–3) |
| `trestbps` | Resting blood pressure (mm Hg) |
| `chol` | Serum cholesterol (mg/dl) |
| `fbs` | Fasting blood sugar > 120 mg/dl |
| `restecg` | Resting electrocardiographic results |
| `thalach` | Maximum heart rate achieved |
| `exang` | Exercise induced angina |
| `oldpeak` | ST depression induced by exercise |
| `slope` | Slope of peak exercise ST segment |
| `ca` | Number of major vessels colored by fluoroscopy |
| `thal` | Thalassemia type |

---

## 🧠 Model Architecture & Strategy

### Step 1 — Data Cleaning (`Missing_values.ipynb`)
- Full analysis of missing and null values across all features
- Imputation strategy designed and fitted → exported as `imputer.pkl`

### Step 2 — Feature Scaling
- `StandardScaler` fitted on training data → exported as `scaler.pkl`
- Ensures all features contribute equally regardless of scale

### Step 3 — Multi-Algorithm Training & Comparison

**8–9 different classification algorithms** were trained and evaluated side by side:

| # | Algorithm | Description |
|---|-----------|-------------|
| 1 | **Logistic Regression** | Linear baseline classifier |
| 2 | **Decision Tree** | Rule-based tree model |
| 3 | **Random Forest** | Bagging ensemble of decision trees |
| 4 | **Gradient Boosting** | Sequential boosting ensemble |
| 5 | **XGBoost** | Optimized gradient boosting |
| 6 | **Support Vector Machine (SVM)** | Margin-based classifier |
| 7 | **K-Nearest Neighbors (KNN)** | Distance-based classifier |
| 8 | **Naive Bayes** | Probabilistic classifier |
| 9 | **AdaBoost** | Adaptive boosting ensemble |

Each model was trained on the same preprocessed dataset and evaluated using cross-validation.

---

### Step 4 — Champion Model Selection via Weighted Voting

Rather than selecting a single best model, a **weighted voting ensemble** was used to determine the champion:

```
Model 1 (weight w1) ──┐
Model 2 (weight w2) ──┤
Model 3 (weight w3) ──┼──► Weighted Vote ──► Final Prediction
      ...             ┤
Model N (weight wN) ──┘
```

**How weights are assigned:**
- Each model is scored based on its cross-validation performance (AUC-ROC, F1-Score)
- Higher performing models receive higher weights in the final vote
- The weighted average of predicted probabilities is used for the final classification

**Why weighted voting?**
- Combines strengths of multiple algorithms
- Reduces the risk of any single model's weaknesses dominating
- Produces more stable and reliable predictions than any individual model

The final output of this process is the **champion model** — the weighted voting ensemble that outperformed all individual models.

---

## 🔄 Model Versioning

| Version | Notebook | Key Changes | Status |
|---------|----------|-------------|--------|
| V1 | `Model1V1.ipynb` | Baseline — all 8-9 algorithms trained & compared |  |
| V2 | `Model1V2.ipynb` | Feature engineering, added interaction terms | |
| V3 | `Model1V3.ipynb` | Hyperparameter tuning per algorithm |  |
| V4 | `Model1V4_used_in_web.ipynb` | Weighted voting champion model — best performance | ✅ **Production** |
| V5 | `Model1V5.ipynb` | Experimental — further research |  |

---

## 📦 Exported Artifacts

The following files are exported from `Model1V4_used_in_web.ipynb` and used in the web backend:

| File | Description | Location |
|------|-------------|----------|
| `champion_model.pkl` | Final weighted voting ensemble model | `heart-disease-model-web/backend/` |
| `imputer.pkl` | Fitted missing value imputer | `heart-disease-model-web/backend/` |
| `scaler.pkl` | Fitted feature scaler | `heart-disease-model-web/backend/` |

---

## 🚀 How to Run

### Prerequisites
```bash
pip install jupyter pandas numpy scikit-learn xgboost matplotlib seaborn
```

### Run notebooks in order
```bash
jupyter notebook
```

Recommended order:
1. `Missing_values.ipynb` — understand and handle missing data
2. `Model1V1.ipynb` — see all algorithms compared
3. `Model1V2.ipynb` → `Model1V3.ipynb` — iterative improvements
4. `Model1V4_used_in_web.ipynb` — final champion model training and export

---

## 📈 Evaluation Metrics

Each of the 8–9 models and the final champion are evaluated on:

| Metric | Why It Matters |
|--------|----------------|
| **Accuracy** | Overall correctness |
| **Precision** | Avoids false positives |
| **Recall** | Catches all true positives — critical in medical diagnosis |
| **F1-Score** | Balance between precision and recall |
| **AUC-ROC** | Overall discrimination ability |
| **Cross-Validation Score** | Generalization across data splits |

---

## 👤 Author

**Dulanjan Kavindu**
[GitHub](https://github.com/DulanjanKavi)

---

## 📄 License

MIT License
