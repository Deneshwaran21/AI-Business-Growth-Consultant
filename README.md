🚀 AI Business Growth Consultant

A full‑stack AI platform that predicts customer churn and revenue, explains predictions, and generates actionable retention strategies.

📌 Features

- **Upload CSV** – Drag & drop customer data.
- **Auto‑ML Training** – Trains LogisticRegression, RandomForest, XGBoost and picks the best.
- **Predict Churn** – Get probability and binary outcome.
- **Predict Revenue** – Forecast monthly revenue per customer.
- **SHAP Explainability** – See which features drive each prediction.
- **Strategy Generator** – Get human‑readable retention advice.
- **Dashboard Insights** – Aggregated KPIs at a glance.
- **PDF Report** – One‑click export of a professional report.

🧰 Tech Stack

Python 3.12 | React 18 |
FastAPI | Vite | Git |
Scikit‑learn | Tailwind CSS |
XGBoost | Chart.js |
SHAP | jsPDF | |
Pandas / NumPy | Axios |
Joblib

---

🚀 Quick Start

Prerequisites
- Python 3.12+
- Node.js 18+

1. Clone
```bash
git clone https://github.com/Deneshwaran21/AI-Business-Growth-Consultant.git
cd AI-Business-Growth-Consultant
```

2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
→ API: `http://localhost:8000`  
→ Swagger: `http://localhost:8000/docs`

3. Frontend
```bash
cd frontend
npm install
npm run dev
```
→ Dashboard: `http://localhost:3000`

---

📖 How to Use

1. Upload a CSV (sample included).
2. Train a model (choose `churn` or `monthly_revenue`).
3. Predict using the sample customer data or your own.
4. Click *Explain (SHAP)* to understand the prediction.
5. Click *Generate Strategy* for actionable advice.
6. Click *Get Insights* to see aggregated KPIs.
7. Download a PDF report from the navbar.

---

## 📁 Project Structure (Simplified)

```
ai-business-growth/
├── backend/
│   ├── app/          # FastAPI code
│   ├── models/       # Saved .pkl files
│   └── uploads/      # Uploaded CSVs
├── frontend/
│   ├── src/          # React components
│   └── public/
└── README.md
```
