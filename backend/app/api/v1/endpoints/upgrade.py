from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.upgrade_request import UpgradeRequest
from app.models.tenant import Tenant
from app.services.email_service import send_upgrade_request_notification
import shutil
import os
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "static/uploads/screenshots"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/request")
async def request_upgrade(
    plan: str = Form(...),
    payment_ref: str = Form(...),
    screenshot: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate plan
    if plan not in ["basic", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid plan selected")

    # Save screenshot
    file_extension = screenshot.filename.split(".")[-1]
    filename = f"{current_user.id}_{datetime.now().timestamp()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(screenshot.file, buffer)
        
    screenshot_url = f"/static/uploads/screenshots/{filename}"

    # Create Upgrade Request
    upgrade_request = UpgradeRequest(
        user_id=current_user.id,
        company_id=current_user.tenant_id,
        plan_requested=plan,
        screenshot_url=screenshot_url,
        payment_ref=payment_ref,
        status="pending"
    )
    
    db.add(upgrade_request)
    db.commit()
    db.refresh(upgrade_request)
    
    db.refresh(upgrade_request)
    
    # Trigger Email Notification to Super Admin
    # Assuming super admin email is fixed or fetched from DB
    send_upgrade_request_notification("biztrackrsuperadmin@gmail.com", current_user.email, "My Company", plan, upgrade_request.id)
    
    return {"status": "success", "message": "Upgrade request submitted", "request_id": upgrade_request.id}
