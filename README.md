# BizTrackr PRO: Enterprise Commerce Operating System

**BizTrackr PRO** is a high-performance, multi-tenant SaaS platform engineered for scalable commerce operations. It unifies complex business functions—Inventory Management, Point of Sale (POS), CRM, and Financial Ledgers—into a single, service-oriented architecture.

This repository contains the full source code for the "Enterprise Edition", designed for deployment in high-concurrency environments using **Next.js 14** (Frontend) and **Async FastAPI** (Backend).

---

## 🏗️ System Architecture

The platform is built on a strictly typed, service-oriented foundation designed for reliability and verified correctness.

*   **Frontend**: Next.js 14 (TypeScript) with a reactive UI based on ShadCN/Radix primitives.
*   **Backend**: Python 3.10+ using **FastAPI** for high-throughput async processing.
*   **Database**: PostgreSQL 16 managed via **SQLAlchemy (Async)** and Alembic migrations.
*   **Safety**: Full Role-Based Access Control (RBAC) and strict Tenant Isolation at the database query level.

---

## 📚 Technical Documentation

We maintain rigorous documentation to prove system stability and architectural integrity. Refer to the `docs/` directory for detailed reports:

### 1. [Grand Technical Proof](./docs/GRAND_TECHNICAL_PROOF.md)
A comprehensive deep-dive into the system's internal logic. This document validates the "Double-Entry" ledger accuracy, the concurrency handling of the Inventory module, and the proprietary Licensing Engine. **Recommended for CTOs and Technical Leads.**

### 2. [Final Audit Report](./docs/FINAL_AUDIT_REPORT.md)
An independent assessment of the codebase quality. It details the extensive module coverage (CRM, Sales, Banking), code metrics (~15,000 LOC), and the professional "Production-Grade" rating (9.3/10) assigned by senior auditors.

### 3. [Feature Specification](./docs/FEATURES.md)
A complete catalog of the functional capabilities, including:
*   **Smart CRM**: Partial payment handling and credit/debit running balances.
*   **Advanced Inventory**: Real-time stock alerts, barcode scanning, and bulk CSV imports.
*   **Financial Suite**: Multi-account expense tracking and PDF invoice generation.

### 4. [Deployment Manual](./docs/DEPLOYMENT_GUIDE.md)
Standard operating procedures for setting up the environment locally (Docker) or deploying to production infrastructure (AWS/Render/Vercel).

---

## 🚀 Quick Start (Local Development)

The system is container-ready. You can spin up the entire stack using Docker Compose.

```bash
# Clone the repository
git clone https://github.com/inqgamerz48/biztrackr-grand-enterprise.git
cd biztrackr-grand-enterprise

# Launch Services
docker-compose up --build
```
*   **Frontend Application**: `http://localhost:3000`
*   **API Documentation**: `http://localhost:8000/docs`

### Manual Installation
For atomic control, developers may run services independently:

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Security & Compliance

BizTrackr PRO adheres to modern security standards suitable for enterprise deployment:
*   **Authentication**: OAuth2 flow with HttpOnly JWT cookies.
*   **Data Integrity**: All financial transactions are immutable and audit-logged.
*   **Encryption**: Sensitive data (passwords, API keys) are hashed or encrypted at rest (`AES-256`).

---

## 📝 License & Copyright

**© 2025 BizTrackr Systems.**
This software is licensed under the **MIT License**. You are free to modify, distribute, and use this codebase for commercial applications.

*Maintained by the BizTrackr Engineering Team.*
