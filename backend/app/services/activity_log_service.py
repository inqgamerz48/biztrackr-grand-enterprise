from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.activity_log import ActivityLog
from typing import Optional, Dict, Any
import json

class ActivityLogService:
    async def log_action(
        self, 
        db: AsyncSession, 
        tenant_id: int, 
        user_id: int, 
        action: str, 
        entity_type: str, 
        entity_id: Optional[int] = None, 
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Create a new activity log entry.
        """
        try:
            log_entry = ActivityLog(
                tenant_id=tenant_id,
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details
            )
            db.add(log_entry)
            await db.commit()
            return log_entry
        except Exception as e:
            # Fallback to prevent logging failure from blocking main action
            print(f"Failed to create activity log: {e}")
            await db.rollback()
            return None

    async def get_logs(
        self, 
        db: AsyncSession, 
        tenant_id: int, 
        skip: int = 0, 
        limit: int = 50,
        user_id: Optional[int] = None,
        entity_type: Optional[str] = None
    ):
        """
        Retrieve activity logs with optional filtering.
        """
        query = select(ActivityLog).filter(ActivityLog.tenant_id == tenant_id)
        
        if user_id:
            query = query.filter(ActivityLog.user_id == user_id)
        
        if entity_type:
            query = query.filter(ActivityLog.entity_type == entity_type)
            
        result = await db.execute(query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit))
        return result.scalars().all()

activity_log_service = ActivityLogService()
