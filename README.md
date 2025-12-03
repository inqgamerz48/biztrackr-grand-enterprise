# 🚀 BizTrackr - The Ultimate Enterprise SaaS Solution

![BizTrackr Banner](docs/images/banner.png)

> **Empower your business with an all-in-one platform for Inventory, Sales, CRM, and Analytics.**

BizTrackr is a cutting-edge, enterprise-grade SaaS application designed to streamline business operations. Built with a robust **FastAPI** backend and a dynamic **Next.js** frontend, it offers a seamless experience for managing multi-branch retail, wholesale, and service businesses.

---

## ✨ Key Features

### 📊 **Dashboard & Analytics**
Visualize your business performance with interactive charts and real-time data.
- **Sales Trends**: Track daily, weekly, and monthly revenue.
- **Top Products**: Identify your best-selling items.
- **Category Distribution**: Understand your inventory mix.
- **AI Forecasting**: Predict future sales trends using Prophet.

![Dashboard Screenshot](docs/images/dashboard.png)

### 🎨 **Multi-Theme System**
Personalize your experience with our dynamic theme engine.
- **Dark & Light Modes**: Seamless switching for day/night usage.
- **Stranger Things Theme**: Immersive "Upside Down" aesthetic with particle effects.
- **Christmas Theme**: Festive holiday vibes with snowfall animations.
- **Semantic Styling**: Consistent look and feel across all components.

### 📦 **Inventory Management**
Complete control over your stock across multiple locations.
- **Real-time Tracking**: Monitor stock levels instantly.
- **Barcode & QR Support**: Scan items for quick lookup and sales.
- **Low Stock Alerts**: Get notified before you run out.
- **Multi-Branch Support**: Manage inventory for different stores.

### 💰 **Sales & POS**
A fast and efficient Point of Sale system for modern businesses.
- **Quick Checkout**: Streamlined process for cashiers.
- **Receipt Generation**: Auto-generate professional PDF receipts.
- **Discount Management**: Apply coupons and discounts easily.
- **Payment Integration**: Support for **Stripe**, **Razorpay**, and **PayPal**.

### 🤝 **CRM & Customer Loyalty**
Build lasting relationships with your customers.
- **Customer Profiles**: Track purchase history and preferences.
- **Loyalty Programs**: Reward repeat customers.
- **Interaction Logs**: Keep a record of all communications.

### 📉 **Purchases & Expenses**
Keep your finances in check.
- **Supplier Management**: Track orders and payments to suppliers.
- **Expense Tracking**: Categorize and monitor operational costs.
- **Tax Reports**: Generate automated tax reports for compliance.

### 🔐 **Security & Administration**
Enterprise-grade security and control.
- **RBAC**: Role-Based Access Control (Admin, Manager, Cashier).
- **Audit Logs**: Track every action taken within the system.
- **Secure Auth**: JWT and Google OAuth authentication.
- **Data Backup**: Automated backup solutions.

### 🛠️ **Administration Tools**
Powerful tools for system administrators.
- **Company Details**: Dedicated page for Admins to manage tenant information.
- **Profile Sync**: Seamless synchronization of user profile data.
- **Plan Management**: Scripts to upgrade users and tenants to Pro plans.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI (inspired)
- **Animations**: Framer Motion, AnimeJS
- **State Management**: React Hooks
- **Charts**: Recharts

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL / SQLite (with SQLAlchemy ORM)
- **Authentication**: JWT (OAuth2), Google OAuth
- **Payments**: Stripe, Razorpay, PayPal
- **PDF Generation**: ReportLab
- **AI/ML**: Prophet (Sales Forecasting)

### **DevOps & Tools**
- **Containerization**: Docker & Docker Compose
- **Linting**: Flake8, Black, ESLint
- **Package Managers**: pip, npm

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed:
- **Docker** & **Docker Compose**
- **Node.js** (v16+)
- **Python** (v3.9+)

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/biztrackr.git
cd biztrackr
```

### 2. Environment Setup
Create `.env` files for both backend and frontend.

**Backend (`backend/.env`)**:
```env
DATABASE_URL=postgresql://user:password@localhost/biztrackr
SECRET_KEY=your_super_secret_key
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

**Frontend (`frontend/.env.local`)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

### 3. Run with Docker (Recommended)
Launch the entire stack with a single command:
```bash
docker-compose up --build
```
The app will be available at:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/docs`

### 4. Manual Setup
**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Upgrade a user to Pro plan
python backend/scripts/upgrade_user_plan.py
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 API Documentation
Explore the interactive API documentation via Swagger UI:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🗺️ Roadmap
- [x] **Core Modules**: Inventory, POS, CRM, Expenses
- [x] **Payments**: Stripe & Razorpay Integration
- [x] **Advanced Features**: Barcode Scanning, AI Forecasting
- [ ] **Mobile App**: React Native implementation
- [ ] **E-commerce Storefront**: Customer-facing online store

---

## 📄 License
This project is licensed under the MIT License.

---

Made with ❤️ by the **BizTrackr Team**.
