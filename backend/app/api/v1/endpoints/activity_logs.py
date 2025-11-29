from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core import database
from app.api.dependencies import get_current_user, require_admin
from app.models import User
from app.services.activity_log_service import activity_log_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ActivityLogSchema(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: Optional[dict]
    created_at: datetime
    
    class Config:
        orm_mode = True

@router.get("/", response_model=List[ActivityLogSchema])
def get_activity_logs(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin), # Admin only
):
    """
    Get activity logs for the current tenant.
    Only accessible by Admins.
    """
    return activity_log_service.get_logs(
        db, 
        tenant_id=current_user.tenant_id, 
        skip=skip, 
        limit=limit,
        user_id=user_id,
        entity_type=entity_type
    )
