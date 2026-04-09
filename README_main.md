# 🏥 Data Management Final Project — Medical AI Platform

A monorepo containing two AI-powered disease prediction web applications and a hospital management platform, built as part of a data management final project.

---

## 📁 Repository Structure

```
Data_managment_final/
├── cardiac-Model-Training/          # Cardiac arrest prediction model notebooks
├── cardiac-model-web/               # Cardiac prediction web application
│   ├── frontend/                    # React frontend
│   └── backend/                     # FastAPI backend + PyTorch models
├── Hart-Disease-Model-Training/     # Heart disease prediction model notebooks
├── heart-disease-model-web/         # Heart disease prediction web application
│   ├── frontend/                    # React frontend
│   └── backend/                     # FastAPI backend + scikit-learn models
└── hospital-platform/               # Hospital management platform
    ├── frontend/                    # React frontend
    └── backend/                     # FastAPI backend
```

---

## 🚀 Projects Overview

### 1. 🫀 Cardiac Model Web
An AI-powered web application that predicts cardiac arrest risk using an ensemble of PyTorch deep learning models trained with k-fold cross-validation.

**Tech Stack:** React · FastAPI · PyTorch · Tailwind CSS

→ [View Project README](./cardiac-model-web/README.md)

---

### 2. ❤️ Heart Disease Model Web
A web application that predicts heart disease risk using a champion machine learning model trained with scikit-learn, including preprocessing with imputation and scaling.

**Tech Stack:** React · FastAPI · scikit-learn · Tailwind CSS

→ [View Project README](./heart-disease-model-web/README.md)

---

### 3. 🏥 Hospital Platform
A full-stack hospital management platform for managing patients, doctors, and medical records.

**Tech Stack:** React · FastAPI · Tailwind CSS

→ [View Project README](./hospital-platform/README.md)

---

## 🧠 Model Training Notebooks

| Folder | Description |
|--------|-------------|
| `cardiac-Model-Training/` | Jupyter notebooks for training cardiac arrest prediction models (Model2V1, Model2V2) |
| `Hart-Disease-Model-Training/` | Jupyter notebooks for training heart disease models (Model1V1 through Model1V5) |

---

## ⚙️ Prerequisites

- Python 3.10+
- Node.js 18+
- pip
- npm or yarn

---

## 🛠️ Quick Start

### Clone the repository
```bash
git clone https://github.com/DulanjanKavi/Data_managment_final.git
cd Data_managment_final
```

### Set up each project

```bash
# Backend setup (repeat for each web project)
cd <project>/backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup (repeat for each web project)
cd <project>/frontend
npm install
```

---

## 🔐 Environment Variables

Each web project requires a `.env` file in its backend folder. Copy the `.env.example` if provided:

```bash
cp .env.example .env
```

---

## 👤 Author

**Dulanjan Kavindu**
[GitHub](https://github.com/DulanjanKavi)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
