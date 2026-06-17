from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import warnings

# Suppress Pydantic V2 migration warnings (TODO: Upgrade to Pydantic v2)
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.endpoints import (
    auth, users, inventory, sales, dashboard, reports, crm, expenses, billing, settings as settings_endpoint, super_admin, notifications, ai, aging, activity_logs, backup, branches, analytics, roles, purchases, tax_report, banking, upgrade, tenants
)
from app.core.database import engine, Base
from app.core.ratelimit import limiter
import app.models  # Ensure model registration


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
# 🛡️ SECURITY: PROXY HEADERS (CRITICAL FOR RATE LIMITING/IP BANS)
# --------------------------------------------------
# This ensures request.client.host is the ACTUAL user IP, not the Load Balancer's.
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# --------------------------------------------------
# 🛡️ SECURITY: TRUSTED HOSTS
# --------------------------------------------------
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# --------------------------------------------------
# 🛡️ SECURITY: CORS
# --------------------------------------------------
# Use settings for CORS to allow flexibility across environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_origin_regex=r"https://biztrackr-grand-enterprise.*\.vercel\.app", # Keep regex for preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
# Note: In production, serve static files via Nginx/CDN, not FastAPI.
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
app.include_router(super_admin.router, prefix="/api/v1/super-admin", tags=["super-admin"])
app.include_router(upgrade.router, prefix="/api/v1/upgrade", tags=["upgrade"])
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
app.include_router(tenants.router, prefix="/api/v1/tenants", tags=["tenants"])



# --------------------------------------------------
# ✔ HEALTH CHECK
# --------------------------------------------------
@app.get("/")
def root():
    return {"message": "Welcome to BizTracker PRO SaaS API"}


# --------------------------------------------------
# ✔ STARTUP EVENTS
# --------------------------------------------------
from app.core.db_startup import run_pending_migrations

@app.on_event("startup")
async def startup_event():
    if settings.ENVIRONMENT == "development":
        await run_pending_migrations()


# --------------------------------------------------
# ✔ GLOBAL EXCEPTION HANDLER (CORS FIX FOR 500s)
# --------------------------------------------------
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to ensure CORS headers are always present,
    even when an unhandled exception (500) occurs.
    """
    import traceback
    error_details = traceback.format_exc()
    print(f"Global Exception: {exc}\n{error_details}")
    
    # Get origin from request headers
    origin = request.headers.get("origin")
    
    # Check if origin is allowed
    allowed_origins = [str(o) for o in settings.BACKEND_CORS_ORIGINS]
    allow_origin = origin if origin in allowed_origins or "*" in allowed_origins else ""
    
    # If regex matching is needed (like for Vercel previews), we might need more logic.
    # For now, we'll try to be permissive for the error response if it's a known domain pattern.
    if not allow_origin and origin and ("vercel.app" in origin or "localhost" in origin):
        allow_origin = origin

    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": allow_origin or "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# --------------------------------------------------
# ✔ ENTRYPOINT FOR RENDER
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 10000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=settings.ENVIRONMENT == "development")

