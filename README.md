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

Documentation is available in the `docs/` directory:

### 1. [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md)
An overview of the system's service-oriented design, async database handling, and concurrency model.

### 2. [Feature Specification](./docs/FEATURES.md)
A catalog of functional capabilities including CRM ledgers, Inventory tracking, and PDF invoicing.

### 3. [Real Talk Review](./docs/REAL_TALK_REVIEW.md)
**Recommended Read**: An unfiltered, honest assessment of the codebase's strengths (Architecture, Speed) and weaknesses (Automation gaps, Hardcoded values).

### 4. [Deployment Manual](./docs/DEPLOYMENT_GUIDE.md)
Standard operating procedures for setting up the environment locally (Docker) or deploying to production infrastructure.

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

---
**INQ**
