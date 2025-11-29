from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core import database
from app.api.dependencies import get_current_user
from app.models import User
from app.services.notification_service import notification_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.get_unread_notifications(db, current_user.tenant_id, current_user.id)

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    success = notification_service.mark_as_read(db, notification_id, current_user.tenant_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    count = notification_service.mark_all_as_read(db, current_user.tenant_id, current_user.id)
    return {"status": "success", "count": count}
