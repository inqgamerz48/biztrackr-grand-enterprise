from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
# 🔥 GLOBAL CORS — ABSOLUTE FIX FOR RENDER + VERCEL
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://biztrackr-grand-enterprise.vercel.app",
        "https://biztrackr-grand-enterprise.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001"
    ],
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
app.include_router(api_router, prefix=settings.API_V1_STR)


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
