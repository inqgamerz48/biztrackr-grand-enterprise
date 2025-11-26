from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.schemas import notification as schemas
from app.services.notification_service import notification_service
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Notification])
def get_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.get_user_notifications(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/unread-count", response_model=int)
def get_unread_count(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.get_unread_count(db, user_id=current_user.id)

@router.put("/{notification_id}/read", response_model=schemas.Notification)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    notification = notification_service.mark_as_read(db, notification_id=notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.put("/mark-all-read")
def mark_all_read(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    notification_service.mark_all_as_read(db, user_id=current_user.id)
    return {"status": "success"}

# Endpoint for testing/admin to create notification
@router.post("/", response_model=schemas.Notification)
def create_notification(
    notification: schemas.NotificationCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    # In real app, restrict to admin or system services
    return notification_service.create_notification(db, notification)
