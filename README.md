# BizTrackr - Enterprise Business Management System

**Tagline**: *"Complete Business Intelligence - Cloud SaaS"*

---

## 📖 Product Overview

BizTrackr is a comprehensive business management solution designed for small to medium businesses. It provides complete control over:

- **Inventory Management** - Track products, stock levels, and valuations
- **Sales Operations** - Point-of-sale, invoicing, and receipts
- **User Management** - Role-based permissions (Admin, Manager, Cashier)
- **Notifications** - Real-time system alerts

The system operates as a **Cloud SaaS Web Application**, accessible from anywhere.

---

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose installed.

### Deployment
To deploy the entire application stack (Frontend, Backend, and Database), simply run:

```bash
docker-compose up --build
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: PostgreSQL on port 5432

---

## 🔑 Demo Credentials

**SaaS Web App**: http://localhost:3000

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@test.com | password123 |
| **Manager** | manager@test.com | password123 |
| **Cashier** | cashier@test.com | password123 |

---

## 🛠 Technology Stack

### SaaS Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Location**: `./backend`

### SaaS Frontend
- **Framework**: Next.js 12 (React)
- **Styling**: Tailwind CSS
- **Location**: `./frontend`

---

## 📸 Screenshots

Please refer to the **GRAND_PROOF.pdf** file for a comprehensive collection of screenshots and proofs of work.

---

## 📄 Documentation

For detailed development logs, challenges faced, and phase completion reports, please refer to **DEVELOPMENT_LOGS.md**.
