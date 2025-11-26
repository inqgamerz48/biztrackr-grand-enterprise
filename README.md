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

- **[Deployment Guide](docs/DEPLOYMENT.md)**: Instructions for deploying to Cloud/Docker/Neon.
- **[Hosting Recommendations](docs/HOSTING_RECOMMENDATIONS.md)**: Best platforms for Frontend/Backend.
- **[Development Logs](docs/DEVELOPMENT_LOGS.md)**: Detailed development history and challenges.
- **[Grand Proofs](docs/GRAND_PROOF.pdf)**: Visual evidence of all features.

---

## ⚖️ License

This project is licensed under the **BizTrackr Enterprise License**. See the **[LICENSE.md](LICENSE.md)** file for details.
