# 🚀 Deployment & Handover Guide

## 📦 The Handover Package
Ensure you have received the following assets:
1.  **Source Code**: The full `frontend/` and `backend/` directories.
2.  **Database Schema**: Alembic migrations folder (`backend/alembic/`).
3.  **Documentation**: This guide and the `GRAND_TECHNICAL_PROOF.md`.

---

## ⚡ Quick Start (Local Development)

### Prerequisites
*   Node.js 18+
*   Python 3.10+
*   PostgreSQL (Local or Cloud)

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Copy .env.example to .env and fill in DB credentials
cp .env.example .env

# Run Migrations
alembic upgrade head

# Start Server
uvicorn app.main:app --reload
```
*Backend runs on `http://localhost:8000`*

### 2. Frontend Setup (Next.js)
```bash
cd frontend
npm install --force

# Start Server
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## ☁️ Production Deployment

### 1. Database (Neon / AWS RDS)
*   Provision a PostgreSQL database.
*   Get the Connection String (DATABASE_URL).
*   Run the Alembic migrations against this production URL.

### 2. Backend (Render / Railway / AWS App Runner)
*   **Build Command**: `pip install -r requirements.txt`
*   **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app`
*   **Environment Variables**:
    *   `DATABASE_URL`: Your production DB URL.
    *   `SECRET_KEY`: A strong random string.
    *   `ENVIRONMENT`: `production`

### 3. Frontend (Vercel / Netlify)
*   Connect your GitHub repository.
*   **Framework Preset**: Next.js
*   **Build Command**: `next build`
*   **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: The URL of your deployed Backend (e.g., `https://api.yourdomain.com`).

---

## 🔄 Ownership Transfer Checklist
When transferring this asset to a new owner:

1.  **Search & Destroy Secrets**: Run `grep -r "sk_live" .` to ensure no active Stripe/Resend keys are left in the code.
2.  **DNS Transfer**: Hand over the domain via your registrar (GoDaddy/Namecheap).
3.  **Service Handoff**:
    *   **Resend**: Invite the new owner to the team.
    *   **Hosting**: Transfer the Vercel/Render project ownership.
4.  **Database**: Provide a clean `pg_dump` of the schema if they want a fresh start, or transfer the Neon project.

## 🤝 Support
For detailed architectural proofs and audit reports, refer to `GRAND_TECHNICAL_PROOF.md`.

---
**INQ**
