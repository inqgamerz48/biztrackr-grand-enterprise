from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.models.settings import Settings
from app.schemas import settings as schemas
from app.api.dependencies import get_current_user, require_admin, require_manager_or_above
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=schemas.Settings)
def get_settings(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ can view
):
    """Get global settings - Manager+ access"""
    settings = db.query(Settings).first()
    if not settings:
        # Create default settings if none exist
        settings = Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=schemas.Settings)
def update_settings(
    settings_in: schemas.SettingsUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin),  # Admin only
):
    """Update global settings - Admin only"""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings()
        db.add(settings)
    
    # Track changes for notification
    changes = []
    update_data = settings_in.dict(exclude_unset=True)
    
    if "tax_rate" in update_data and update_data["tax_rate"] != settings.tax_rate:
        changes.append(f"Tax Rate updated to {update_data['tax_rate'] * 100}%")
    
    if "currency_symbol" in update_data and update_data["currency_symbol"] != settings.currency_symbol:
        changes.append(f"Currency changed to {update_data['currency_symbol']}")

    for field, value in update_data.items():
        setattr(settings, field, value)
        
    db.add(settings)
    db.commit()
    db.refresh(settings)
    
    # Send notification if critical settings changed
    if changes:
        from app.services.notification_service import notification_service
        from app.schemas.notification import NotificationCreate
        
        message = "Global settings updated: " + ", ".join(changes)
        notification = NotificationCreate(
            title="Settings Updated",
            message=message,
            type="info",
            user_id=None # System-wide notification
        )
        notification_service.create_notification(db, notification)
        
    return settings
