from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.models.tenant import Tenant
from app.schemas import tenant as schemas
from app.api.dependencies import get_current_user, require_admin
from app.models.user import User

router = APIRouter()

@router.get("/me", response_model=schemas.Tenant)
def read_tenant_me(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin),
):
    """
    Get current tenant details.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=404, detail="User does not belong to a tenant")
        
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/me", response_model=schemas.Tenant)
def update_tenant_me(
    tenant_in: schemas.TenantUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin),
):
    """
    Update current tenant details.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=404, detail="User does not belong to a tenant")
        
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if tenant_in.name is not None:
        tenant.name = tenant_in.name
    
    # Only allow plan updates if specifically handled (usually via payment webhook)
    # But for now, we'll allow it for admin flexibility or disable it if strict
    # tenant.plan = tenant_in.plan 
        
    db.commit()
    db.refresh(tenant)
    return tenant
