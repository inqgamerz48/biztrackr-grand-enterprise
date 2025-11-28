import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Any
from pydantic import AnyHttpUrl, field_validator, ValidationInfo

class Settings(BaseSettings):
    PROJECT_NAME: str = "BizTracker PRO SaaS"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENVIRONMENT: str = "development"  # dev, staging, production
    
    # Database (Neon-first)
    DATABASE_URL: Optional[str] = None
    
    # Optional legacy Postgres fields (only used if DATABASE_URL missing)
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None

    # Integrations
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # PayPal
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"
    PAYPAL_WEBHOOK_ID: str = ""

    # Social Auth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # CORS / Hosts
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    ALLOWED_HOSTS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Build the DB connection automatically
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info: ValidationInfo) -> Any:
        if v and isinstance(v, str):
            return v

        values = info.data

        # fallback to local postgres only if Neon url missing
        if (
            values.get("POSTGRES_USER")
            and values.get("POSTGRES_PASSWORD")
            and values.get("POSTGRES_SERVER")
            and values.get("POSTGRES_DB")
        ):
            return (
                f"postgresql://{values.get('POSTGRES_USER')}:"
                f"{values.get('POSTGRES_PASSWORD')}@"
                f"{values.get('POSTGRES_SERVER')}/"
                f"{values.get('POSTGRES_DB')}"
            )

        raise ValueError("DATABASE_URL is required for production")

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info: ValidationInfo) -> str:
        if info.data.get("ENVIRONMENT") == "production" and len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 chars in production")
        return v


settings = Settings()
