# BizTrackr - Enterprise SaaS Solution

![BizTrackr Banner](https://via.placeholder.com/1200x400?text=BizTrackr+Enterprise+Dashboard)

BizTrackr is a comprehensive, enterprise-grade SaaS application designed to streamline business operations. It integrates Inventory Management, Point of Sale (POS), CRM, Analytics, and Subscription Billing into a single, powerful platform. Built with modern technologies, it offers scalability, security, and a premium user experience.

## 🚀 Key Features

### 📊 Core Modules
- **Inventory Management**: Real-time tracking, low stock alerts, and barcode/QR code support.
- **Sales (POS)**: Fast and efficient Point of Sale system with receipt generation.
- **Purchases**: Manage supplier orders, receive goods, and track costs.
- **CRM**: Customer Relationship Management to track interactions and history.
- **Expenses & Billing**: Track business expenses and manage billing.

### 🏢 Enterprise Features
- **Multi-Branch Support**: Manage multiple physical store locations from a central dashboard.
- **Role-Based Access Control (RBAC)**: Granular permissions for Admins, Managers, and Cashiers.
- **Advanced Analytics**: Interactive dashboards with sales trends, top items, and category distribution.
- **Subscription Billing**: Integrated Stripe/Razorpay billing with Free, Pro, and Enterprise tiers.
- **Notifications**: Real-time alerts for low stock and system events.

### 🔐 Security & Compliance
- **Authentication**: Secure JWT & Google OAuth login.
- **Rate Limiting**: API protection against abuse.
- **Audit Logs**: Comprehensive activity tracking for all user actions.
- **Data Export**: Full CSV/PDF export capabilities for data portability.

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM (Prisma schema available for reference)
- **Authentication**: JWT & Google OAuth
- **Payments**: Stripe / Razorpay
- **Documentation**: OpenAPI (Swagger UI)

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI (inspired)
- **UI Components**: Framer Motion, Lucide React
- **Charts**: Recharts

## 📂 Folder Structure

```
biztrackr/
├── backend/
│   ├── app/
│   │   ├── api/            # API Endpoints
│   │   ├── core/           # Config & Security
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── services/       # Business Logic (Stripe, Export, etc.)
│   │   └── main.py         # App Entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Next.js Pages
│   │   ├── lib/            # Utilities (Axios, etc.)
│   │   └── styles/         # Global Styles
│   └── package.json
├── prisma/
│   └── schema.prisma       # Prisma Schema Definition
└── docker-compose.yml
```

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (v16+)
- Python (v3.9+)

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/biztrackr.git
cd biztrackr
```

### 2. Environment Setup
Create a `.env` file in `backend/` and `frontend/` based on the examples.

**Backend `.env`**:
```env
DATABASE_URL=postgresql://user:password@localhost/biztrackr
SECRET_KEY=your_secret_key
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Run with Docker (Recommended)
Run the entire stack using Docker Compose:
```bash
docker-compose up --build
```

### 4. Manual Setup

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## 🗺️ Roadmap
- [x] Core Inventory & POS
- [x] Analytics Dashboard
- [x] Subscription Billing
- [ ] Mobile App (React Native)
- [ ] AI Forecasting

## 📄 License
This project is licensed under the MIT License.
