from sqlalchemy.orm import Session
from app.models.notification import Notification
from typing import List, Optional

class NotificationService:
    def create_notification(
        self, 
        db: Session, 
        tenant_id: int, 
        title: str, 
        message: str, 
        type: str = "info", 
        user_id: Optional[int] = None
    ) -> Notification:
        notification = Notification(
            tenant_id=tenant_id,
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def get_unread_notifications(self, db: Session, tenant_id: int, user_id: int) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id,
            Notification.is_read == False
        ).order_by(Notification.created_at.desc()).all()

    def get_unread_count(self, db: Session, tenant_id: int, user_id: int) -> int:
        return db.query(Notification).filter(
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    def mark_as_read(self, db: Session, notification_id: int, tenant_id: int, user_id: int) -> bool:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            db.commit()
            return True
        return False

    def mark_all_as_read(self, db: Session, tenant_id: int, user_id: int) -> int:
        result = db.query(Notification).filter(
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({Notification.is_read: True}, synchronize_session=False)
        
        db.commit()
        return result

notification_service = NotificationService()
