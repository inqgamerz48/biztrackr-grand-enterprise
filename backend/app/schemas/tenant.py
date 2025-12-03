from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class TenantBase(BaseModel):
    name: str
    plan: Optional[str] = "free"

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None

class Tenant(TenantBase):
    id: int
    subscription_status: str
    created_at: datetime

    class Config:
        orm_mode = True
