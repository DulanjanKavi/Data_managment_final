# 🏥 Hospital Platform

A full-stack hospital management platform for managing patients, doctors, appointments, and medical records. Built with React on the frontend and FastAPI on the backend.

---

## 📁 Project Structure

```
hospital-platform/
├── backend/
│   ├── main.py                  # FastAPI application  
    |                               entry point
│   ├── routers/                 # API route handlers
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables
└── frontend/
    ├── src/                     # React source files
    ├── public/                  # Static assets
    └── package.json
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Python |
| API | REST |

---

## 🚀 Getting Started

### Backend Setup

```bash
cd hospital-platform/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env            # Edit with your config

# Run the server
uvicorn main:app --reload --port 8002
```

Backend will be available at: `http://localhost:8002`
API docs available at: `http://localhost:8002/docs`

---

### Frontend Setup

```bash
cd hospital-platform/frontend

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
# Database
DATABASE_URL=your_database_url

# Security
SECRET_KEY=your_secret_key
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/docs` | Interactive API documentation |

---

## 👤 Author

**Dulanjan Kavindu**
[GitHub](https://github.com/DulanjanKavi)

---

## 📄 License

MIT License
