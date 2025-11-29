from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.endpoints import (
    auth, users, inventory, sales, dashboard, reports, crm, expenses, billing, settings as settings_endpoint, super_admin, notifications, ai, aging, activity_logs, backup, branches, analytics, roles, purchases, tax_report, banking
)
from app.core.database import engine, Base
from app.core.ratelimit import limiter
import app.models  # Ensure model registration


# --------------------------------------------------
# ✔ CREATE ALL TABLES & RUN MIGRATIONS
# --------------------------------------------------
from app.core.db_init import init_db
init_db()


# --------------------------------------------------
# ✔ APP INITIALIZATION
# --------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)


# --------------------------------------------------
# 🔥 GLOBAL CORS — ABSOLUTE FIX FOR RENDER + VERCEL
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://biztrackr-grand-enterprise.vercel.app",
        "https://biztrackr-grand-enterprise.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
    ],
    allow_origin_regex=r"https://biztrackr-grand-enterprise.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# ❗ REMOVE TrustedHostMiddleware (BLOCKING RENDER REQUESTS)
# --------------------------------------------------
# RENDER DOES BLOCK REQUESTS IF THIS IS ENABLED.
# ONLY ENABLE LATER IN FINAL PRODUCTION.

# from fastapi.middleware.trustedhost import TrustedHostMiddleware
# app.add_middleware(
#     TrustedHostMiddleware,
#     allowed_hosts=["*"]
# )


# --------------------------------------------------
# ✔ GZIP
# --------------------------------------------------
app.add_middleware(GZipMiddleware, minimum_size=1000)


# --------------------------------------------------
# ✔ RATE LIMITING
# --------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# --------------------------------------------------
# ✔ STATIC FILES
# --------------------------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")


# --------------------------------------------------
# ✔ API ROUTES
# --------------------------------------------------
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["sales"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(crm.router, prefix="/api/v1/crm", tags=["crm"])
app.include_router(expenses.router, prefix="/api/v1/expenses", tags=["expenses"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(settings_endpoint.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(super_admin.router, prefix="/api/v1/admin", tags=["super-admin"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(aging.router, prefix="/api/v1/aging", tags=["aging"])
app.include_router(activity_logs.router, prefix="/api/v1/activity-logs", tags=["activity-logs"])
app.include_router(backup.router, prefix="/api/v1/backup", tags=["backup"])

app.include_router(branches.router, prefix="/api/v1/branches", tags=["branches"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(roles.router, prefix="/api/v1/roles", tags=["roles"])
app.include_router(purchases.router, prefix="/api/v1/purchases", tags=["purchases"])
app.include_router(tax_report.router, prefix="/api/v1/tax", tags=["tax"])
app.include_router(banking.router, prefix="/api/v1/banking", tags=["banking"])



# --------------------------------------------------
# ✔ HEALTH CHECK
# --------------------------------------------------
@app.get("/")
def root():
    return {"message": "Welcome to BizTracker PRO SaaS API"}


# --------------------------------------------------
# ✔ ENTRYPOINT FOR RENDER
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 10000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=settings.ENVIRONMENT == "development")
