from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.security import SecurityEvent, BlockedIP, SecurityEventType
from typing import Optional, Dict

class SecurityService:
    @staticmethod
    async def log_event(
        db: AsyncSession, 
        event_type: str, 
        ip_address: str, 
        description: str = None, 
        severity: str = "medium",
        user_email: str = None
    ) -> SecurityEvent:
        event = SecurityEvent(
            event_type=event_type,
            ip_address=ip_address,
            description=description,
            severity=severity,
            user_email=user_email
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    @staticmethod
    async def is_ip_blocked(db: AsyncSession, ip_address: str) -> bool:
        result = await db.execute(
            select(BlockedIP).filter(
                BlockedIP.ip_address == ip_address,
                BlockedIP.is_active == True
            )
        )
        blocked = result.scalars().first()
        
        if blocked:
            if blocked.expires_at and blocked.expires_at < datetime.utcnow():
                # Ban expired
                blocked.is_active = False
                await db.commit()
                return False
            return True
        return False

    @staticmethod
    async def ban_ip(
        db: AsyncSession, 
        ip_address: str, 
        reason: str, 
        duration_minutes: int = 60
    ) -> BlockedIP:
        # Check if already banned
        result = await db.execute(select(BlockedIP).filter(BlockedIP.ip_address == ip_address))
        existing = result.scalars().first()
        expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
        
        if existing:
            existing.is_active = True
            existing.reason = reason
            existing.expires_at = expires_at
            existing.blocked_at = datetime.utcnow()
            await db.commit()
            await db.refresh(existing)
            return existing
        
        blocked = BlockedIP(
            ip_address=ip_address,
            reason=reason,
            expires_at=expires_at
        )
        db.add(blocked)
        await db.commit()
        await db.refresh(blocked)
        return blocked

    @staticmethod
    async def check_login_failures(db: AsyncSession, ip_address: str) -> bool:
        """
        Check if IP has exceeded failed login threshold in the last 5 minutes.
        Returns True if IP was just banned, False otherwise.
        """
        THRESHOLD = 5
        WINDOW_MINUTES = 5
        
        since = datetime.utcnow() - timedelta(minutes=WINDOW_MINUTES)
        
        result = await db.execute(
            select(func.count(SecurityEvent.id)).filter(
                SecurityEvent.ip_address == ip_address,
                SecurityEvent.event_type == SecurityEventType.LOGIN_FAILED,
                SecurityEvent.created_at >= since
            )
        )
        count = result.scalar()
        
        if count >= THRESHOLD:
            await SecurityService.ban_ip(
                db, 
                ip_address, 
                reason=f"Too many failed login attempts ({count} in {WINDOW_MINUTES}m)"
            )
            return True
        return False

    @staticmethod
    async def get_stats(db: AsyncSession) -> Dict:
        total_events = await db.execute(select(func.count(SecurityEvent.id)))
        blocked_ips = await db.execute(select(func.count(BlockedIP.id)).filter(BlockedIP.is_active == True))
        recent_attacks = await db.execute(
            select(func.count(SecurityEvent.id)).filter(
                SecurityEvent.created_at >= datetime.utcnow() - timedelta(hours=24)
            )
        )
        
        return {
            "total_events": total_events.scalar(),
            "active_bans": blocked_ips.scalar(),
            "attacks_last_24h": recent_attacks.scalar()
        }

security_service = SecurityService()
