from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core import database
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter()

# Schema for Tenant Response
class TenantResponse(BaseModel):
    id: int
    name: str
    plan: str
    subscription_status: str
    created_at: datetime
    user_count: int

    class Config:
        orm_mode = True

# Schema for Tenant Status Update
class TenantStatusUpdate(BaseModel):
    subscription_status: str

def require_superuser(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

@router.get("/tenants", response_model=List[TenantResponse])
def list_tenants(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_superuser)
):
    """List all tenants (Super Admin only)"""
    tenants = db.query(Tenant).all()
    
    # Enrich with user count
    results = []
    for tenant in tenants:
        user_count = db.query(User).filter(User.tenant_id == tenant.id).count()
        results.append({
            "id": tenant.id,
            "name": tenant.name,
            "plan": tenant.plan,
            "subscription_status": tenant.subscription_status,
            "created_at": tenant.created_at,
            "user_count": user_count
        })
    
    return results

@router.put("/tenants/{tenant_id}/status", response_model=TenantResponse)
def update_tenant_status(
    tenant_id: int,
    status_update: TenantStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_superuser)
):
    """Update tenant status (Super Admin only)"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.subscription_status = status_update.subscription_status
    db.commit()
    db.refresh(tenant)
    
    user_count = db.query(User).filter(User.tenant_id == tenant.id).count()
    
    return {
        "id": tenant.id,
        "name": tenant.name,
        "plan": tenant.plan,
        "subscription_status": tenant.subscription_status,
        "created_at": tenant.created_at,
        "user_count": user_count
    }
