# ❤️ Heart Disease Model Web

An AI-powered web application for predicting heart disease risk using a champion machine learning model trained with scikit-learn. The pipeline includes data imputation, feature scaling, and a trained classification model for accurate predictions.

---

## 📁 Project Structure

```
heart-disease-model-web/
├── backend/
│   ├── main.py                  # FastAPI application entry point
│   ├── requirements.txt         # Python dependencies
│   ├── champion_model.pkl       # Best performing trained model
│   ├── imputer.pkl              # Fitted data imputer (missing values)
│   └── scaler.pkl               # Fitted feature scaler
└── frontend/
    ├── src/                     # React source files
    ├── public/                  # Static assets
    ├── package.json
    └── tailwind.config.js
```

---

## 🧠 Model Details

- **Framework:** scikit-learn
- **Pipeline:** Imputation → Scaling → Classification
- **Model:** Champion model selected from multiple training versions (V1–V5)
- **Task:** Binary classification — heart disease risk prediction

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Python |
| ML Framework | scikit-learn |
| API | REST |

---

## 🚀 Getting Started

### Backend Setup

```bash
cd heart-disease-model-web/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8001
```

Backend will be available at: `http://localhost:8001`
API docs available at: `http://localhost:8001/docs`

---

### Frontend Setup

```bash
cd heart-disease-model-web/frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at: `http://localhost:3000`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/predict` | Submit patient data and get heart disease risk prediction |

---

## 🔄 Prediction Pipeline

When a request hits the `/predict` endpoint:

1. Raw patient data is received
2. Missing values are handled by the fitted **imputer**
3. Features are normalized using the fitted **scaler**
4. The **champion model** makes the final prediction
5. Risk result is returned to the frontend

---

## 👤 Author

**Dulanjan Kavindu**
[GitHub](https://github.com/DulanjanKavi)

---

## 📄 License

MIT License
