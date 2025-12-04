from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
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
async def get_notifications(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return await notification_service.get_unread_notifications(db, current_user.tenant_id, current_user.id)

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    count = await notification_service.get_unread_count(db, current_user.tenant_id, current_user.id)
    return {"count": count}

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    success = await notification_service.mark_as_read(db, notification_id, current_user.tenant_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.put("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    count = await notification_service.mark_all_as_read(db, current_user.tenant_id, current_user.id)
    return {"status": "success", "count": count}
