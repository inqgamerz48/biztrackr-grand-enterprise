from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.core import database
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.models.upgrade_request import UpgradeRequest
from app.services.email_service import send_upgrade_status_email

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
    # Support both legacy is_superuser and new role-based super_admin
    if not current_user.is_superuser and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

@router.get("/tenants", response_model=List[TenantResponse])
def list_tenants(
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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

# --- Upgrade Request Endpoints ---

@router.get("/upgrade-requests")
def list_upgrade_requests(
    status: str = "pending",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    requests = db.query(UpgradeRequest).filter(UpgradeRequest.status == status).all()
    return requests

@router.post("/approve/{request_id}")
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    req = db.query(UpgradeRequest).filter(UpgradeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
        
    # Approve
    req.status = "approved"
    
    # Update User Plan
    user = db.query(User).filter(User.id == req.user_id).first()
    if user:
        user.plan = req.plan_requested
        user.plan_expiry = datetime.now() + timedelta(days=30)
        
    # Update Tenant Plan (if applicable)
    if req.company_id:
        tenant = db.query(Tenant).filter(Tenant.id == req.company_id).first()
        if tenant:
            tenant.plan = req.plan_requested
            
    db.commit()
    
    # Send Email to User
    if user:
        send_upgrade_status_email(user.email, "approved", req.plan_requested)
    
    return {"status": "approved"}

@router.post("/reject/{request_id}")
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    req = db.query(UpgradeRequest).filter(UpgradeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = "rejected"
    db.commit()
    
    # Send Email to User
    user = db.query(User).filter(User.id == req.user_id).first()
    if user:
        send_upgrade_status_email(user.email, "rejected", req.plan_requested)
    
    return {"status": "rejected"}
