from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.notification import Notification
from typing import List, Optional

class NotificationService:
    async def create_notification(
        self, 
        db: AsyncSession, 
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
        await db.commit()
        await db.refresh(notification)
        return notification

    async def get_unread_notifications(self, db: AsyncSession, tenant_id: int, user_id: int) -> List[Notification]:
        result = await db.execute(select(Notification).filter(
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id,
            Notification.is_read == False
        ).order_by(Notification.created_at.desc()))
        return result.scalars().all()

    async def get_unread_count(self, db: AsyncSession, tenant_id: int, user_id: int) -> int:
        result = await db.execute(select(func.count(Notification.id)).filter(
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id,
            Notification.is_read == False
        ))
        return result.scalar()

    async def mark_as_read(self, db: AsyncSession, notification_id: int, tenant_id: int, user_id: int) -> bool:
        result = await db.execute(select(Notification).filter(
            Notification.id == notification_id,
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id
        ))
        notification = result.scalars().first()
        
        if notification:
            notification.is_read = True
            await db.commit()
            return True
        return False

    async def mark_all_as_read(self, db: AsyncSession, tenant_id: int, user_id: int) -> int:
        # Note: update() with synchronize_session=False is not directly supported in async execution the same way
        # We use an update statement
        from sqlalchemy import update
        stmt = update(Notification).where(
            Notification.tenant_id == tenant_id,
            Notification.user_id == user_id,
            Notification.is_read == False
        ).values(is_read=True)
        
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount

notification_service = NotificationService()
