# 🫀 Cardiac Model Web

An AI-powered web application for predicting cardiac arrest risk using an ensemble of deep learning models built with PyTorch. The system uses k-fold cross-validation trained models combined into an ensemble for improved accuracy and reliability.

---

## 📁 Project Structure

```
cardiac-model-web/
├── backend/
│   ├── main.py                  # FastAPI application entry point
│   ├── requirements.txt         # Python dependencies
│   ├── ensemble_model.pt        # Ensemble model weights
│   ├── fold_0.pt                # Fold 0 model weights
│   ├── fold_1.pt                # Fold 1 model weights
│   ├── fold_2.pt                # Fold 2 model weights
│   ├── fold_3.pt                # Fold 3 model weights
│   └── fold_4.pt                # Fold 4 model weights
└── frontend/
    ├── src/                     # React source files
    ├── public/                  # Static assets
    ├── package.json
    └── tailwind.config.js
```

---

## 🧠 Model Details

- **Architecture:** Deep Neural Network (PyTorch)
- **Training Strategy:** 5-Fold Cross-Validation
- **Inference:** Ensemble of 5 fold models + final ensemble model
- **Task:** Binary classification — cardiac arrest risk prediction

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Python |
| ML Framework | PyTorch |
| API | REST |

---

## 🚀 Getting Started

### Backend Setup

```bash
cd cardiac-model-web/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env            # Edit with your config

# Run the server
uvicorn main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs available at: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd cardiac-model-web/frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at: `http://localhost:3000`

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# Example .env
PORT=8000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/predict` | Submit patient data and get cardiac risk prediction |

---

## 👤 Author

**Dulanjan Kavindu**
[GitHub](https://github.com/DulanjanKavi)

---

## 📄 License

MIT License
