# Deployment Guide

This guide provides instructions for deploying the BizTrackr Enterprise SaaS application to a production environment.

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed on your server.
- A **PostgreSQL Database** (we recommend [Neon](https://neon.tech) for serverless scaling).
- A domain name (optional but recommended for production).

---

## 1. Environment Configuration

1.  **Clone the repository** to your server.
2.  **Backend Configuration**:
    -   Navigate to `backend/`.
    -   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    -   **CRITICAL**: Update the following variables in `.env`:
        -   `SECRET_KEY`: Generate a strong, random string (e.g., `openssl rand -hex 32`).
        -   `POSTGRES_SERVER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Set these if using a local DB, OR see the Neon section below.
        -   `DATABASE_URL`: The full connection string.

3.  **Frontend Configuration**:
    -   Navigate to `frontend/`.
    -   Create a `.env.local` or `.env.production` file.
    -   Set `NEXT_PUBLIC_API_URL` to your production backend URL (e.g., `https://api.yourdomain.com/api/v1`).

---

## 2. Setting up Neon Database (Recommended)

1.  Sign up at [Neon.tech](https://neon.tech).
2.  Create a new project.
3.  Copy the **Connection String** provided by Neon. It usually looks like:
    `postgres://user:password@ep-xyz.region.neon.tech/dbname?sslmode=require`
4.  Update your `backend/.env` file:
    ```bash
    DATABASE_URL="postgres://user:password@ep-xyz.region.neon.tech/dbname?sslmode=require"
    ```
    *Note: You can ignore the individual POSTGRES_* variables if you provide the full DATABASE_URL.*

---

## 3. Docker Deployment

We use Docker Compose to orchestrate the application.

### Build and Run

From the root directory of the project:

```bash
# Build and start the containers in detached mode
docker-compose up --build -d
```

### Verification

- **Frontend**: Accessible at `http://YOUR_SERVER_IP:3000`
- **Backend**: Accessible at `http://YOUR_SERVER_IP:8000`

---

## 4. Production Security Checklist

Before going live:

- [ ] **Change Default Passwords**: Ensure the initial superuser password in `.env` is changed.
- [ ] **HTTPS/SSL**: Use a reverse proxy like **Nginx** or **Traefik** to serve the application over HTTPS.
- [ ] **Firewall**: Restrict access to ports 8000 and 5432 (if running local DB) from the outside world. Only expose port 80/443 via your reverse proxy.
- [ ] **Backups**: Configure automated backups for your database.
