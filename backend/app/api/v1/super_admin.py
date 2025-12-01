from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.upgrade_request import UpgradeRequest
from app.models.tenant import Tenant
from app.services.email_service import send_upgrade_status_email
from datetime import datetime, timedelta

router = APIRouter()

def check_super_admin(user: User):
    if user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/upgrade-requests")
def list_upgrade_requests(
    status: str = "pending",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_super_admin(current_user)
    requests = db.query(UpgradeRequest).filter(UpgradeRequest.status == status).all()
    return requests

@router.post("/approve/{request_id}")
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_super_admin(current_user)
    
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
    
    db.commit()
    
    # Send Email to User
    if user:
        send_upgrade_status_email(user.email, "approved", req.plan_requested)
    
    return {"status": "approved"}

@router.post("/reject/{request_id}")
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_super_admin(current_user)
    
    req = db.query(UpgradeRequest).filter(UpgradeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = "rejected"
    db.commit()
    
    req.status = "rejected"
    db.commit()
    
    # Send Email to User
    user = db.query(User).filter(User.id == req.user_id).first()
    if user:
        send_upgrade_status_email(user.email, "rejected", req.plan_requested)
    
    return {"status": "rejected"}
