from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.schemas import notification as schemas
from typing import List

class NotificationService:
    def create_notification(self, db: Session, notification: schemas.NotificationCreate) -> Notification:
        db_notification = Notification(**notification.dict())
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification

    def get_user_notifications(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(
            (Notification.user_id == user_id) | (Notification.user_id == None)
        ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def get_unread_count(self, db: Session, user_id: int) -> int:
        return db.query(Notification).filter(
            (Notification.user_id == user_id) | (Notification.user_id == None),
            Notification.is_read == False
        ).count()

    def mark_as_read(self, db: Session, notification_id: int) -> Notification:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
        return notification

    def mark_all_as_read(self, db: Session, user_id: int):
        db.query(Notification).filter(
            (Notification.user_id == user_id) | (Notification.user_id == None),
            Notification.is_read == False
        ).update({Notification.is_read: True}, synchronize_session=False)
        db.commit()

notification_service = NotificationService()
