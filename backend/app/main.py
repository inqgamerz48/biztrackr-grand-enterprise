from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.router import api_router
from app.core.database import engine, Base
from app.core.ratelimit import limiter
import app.models  # Ensure model registration


# --------------------------------------------------
# ✔ CREATE ALL TABLES (TEMP FOR PROD UNTIL MIGRATIONS)
# --------------------------------------------------
# Works for Docker + SQLite + PostgreSQL (Neon)
try:
    Base.metadata.create_all(bind=engine)
    print("📌 Database tables ensured.")
except Exception as e:
    print("❌ DB INIT ERROR:", e)


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
# 🔥 GLOBAL CORS — FIXES ALL FRONTEND ERRORS
# --------------------------------------------------
# Works for:
# - localhost:3000
# - Docker
# - Render URL
# - Vercel frontend
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# --------------------------------------------------
# ✔ SECURITY MIDDLEWARE (KEEP UNDER CORS)
# --------------------------------------------------
# CAUTION: TrustedHostMiddleware *must* allow Render + Vercel hostnames
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# --------------------------------------------------
# ✔ RATE LIMITING
# --------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# --------------------------------------------------
# ✔ STATIC FILES (REPORTS, PDF, EXPORTED FILES)
# --------------------------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")


# --------------------------------------------------
# ✔ API ROUTES
# --------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)


# --------------------------------------------------
# ✔ HEALTH CHECK
# --------------------------------------------------
@app.get("/")
def root():
    return {"message": "Welcome to BizTracker PRO SaaS API"}


# --------------------------------------------------
# ✔ EXECUTION ENTRY POINT (FOR RENDER)
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 10000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=settings.ENVIRONMENT == "development")
