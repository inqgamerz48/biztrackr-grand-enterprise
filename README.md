# BizTrackr - Enterprise SaaS Solution

BizTrackr is a comprehensive, enterprise-grade SaaS application designed to streamline business operations. It integrates Inventory Management, Point of Sale (POS), CRM, Analytics, and more into a single, powerful platform. Built with modern technologies, it offers scalability, security, and a premium user experience.

## 🚀 Key Features

### Core Modules
- **Inventory Management**: Real-time tracking, low stock alerts, and barcode/QR code support.
- **Sales (POS)**: Fast and efficient Point of Sale system with receipt generation.
- **Purchases**: Manage supplier orders, receive goods, and track costs.
- **CRM**: Customer Relationship Management to track interactions and history.
- **Expenses & Billing**: Track business expenses and manage billing.

### Enterprise Features
- **Multi-Branch Support**: Manage multiple physical store locations from a central dashboard.
- **Role-Based Access Control (RBAC)**: Granular permissions for Admins, Managers, and Cashiers.
- **Advanced Analytics**: Interactive dashboards with sales trends, top items, and category distribution.
- **Notifications**: Real-time alerts for low stock and system events.
- **AI Integration**: Smart insights and assistance (Beta).

### Recent Updates
- **Google Authentication**: Secure sign-in with Google OAuth.
- **Team Management**: Enhanced interface for managing staff and roles.
- **Tax & Banking**: Dedicated modules for tax reporting and banking integrations.

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT & Google OAuth
- **Documentation**: OpenAPI (Swagger UI)

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Framer Motion, Lucide React
- **Charts**: Recharts

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

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set up environment variables:
Create a `.env` file in the `backend` directory and configure your database and API keys.

Run the server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
# or
yarn install
```

Run the development server:
```bash
npm run dev
# or
yarn dev
```
The application will be available at `http://localhost:3000`.

### 4. Docker Setup (Recommended)
Run the entire stack using Docker Compose:
```bash
docker-compose up --build
```

## 🤝 Contributing
Contributions are welcome! Please read our contribution guidelines before submitting a pull request.

## 📄 License
This project is licensed under the MIT License.
