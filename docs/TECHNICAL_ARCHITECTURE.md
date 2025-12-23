# 🏗️ Technical Architecture

This document outlines the system architecture of BizTrackr PRO, including the backend service layer, database schema, and frontend verification status.

## 1. Backend Architecture (Python/FastAPI)
The backend follows a service-oriented pattern to separate business logic from API endpoints.

*   **API Layer** (`backend/app/api/`): Handles HTTP requests, validation (Pydantic), and dependency injection.
*   **Service Layer** (`backend/app/services/`): Contains the core business logic.
    *   `inventory_service.py`: Managing stock levels and atomic updates.
    *   `sales_service.py`: Processing sales, calculating totals, and linking to inventory.
    *   `crm_service.py`: Managing customer ledgers and payment histories.
*   **Data Layer** (`backend/app/models/`): SQLAlchemy ORM models mapped to PostgreSQL tables.

### Concurrency
Database operations utilize `sqlalchemy.ext.asyncio` to handle concurrent requests without blocking the event loop. This allows the single-process FastAPI application to handle multiple I/O bound requests efficiently.

## 2. Verified Module Capabilities

### 🛡️ Security
*   **RBAC**: Role-Based Access Control is enforced via `dependencies.py` (e.g., `require_super_admin`).
*   **Tenant Isolation**: All database queries are scoped by `tenant_id` to ensure data separation.

### 📦 CRM & Ledgers
*   **Double-Entry Logic**: The system functions as a double-entry ledger for customers and suppliers.
*   **Partial Payments**: Supports recording partial payments against invoices, maintaining a running `outstanding_balance`.

### 💰 Sales & Invoicing
*   **PDF Generation**: Uses `backend/app/services/pdf_service_enhanced.py` to generate PDF invoices server-side.
*   **Inventory Hooks**: Sales logic automatically triggers inventory deductions.

## 3. Code Metrics
*   **Stack**: Next.js 14, Python 3.10, FastAPI, PostgreSQL.
*   **Tests**: A basic test suite exists (e.g., `backend/test_email_license_system.py`), though coverage is not yet comprehensive.

---
**INQ**
