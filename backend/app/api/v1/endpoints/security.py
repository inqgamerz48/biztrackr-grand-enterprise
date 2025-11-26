from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.services.security_service import security_service
from app.api.dependencies import require_admin
from app.models import User

router = APIRouter()

@router.get("/stats")
def get_security_stats(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin),  # Admin only
):
    """Get security statistics (admin only)"""
    # In a real app, check for admin role
    return security_service.get_stats(db)
