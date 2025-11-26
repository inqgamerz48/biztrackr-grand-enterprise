from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.security import SecurityEvent, BlockedIP, SecurityEventType
from typing import Optional, Dict

class SecurityService:
    @staticmethod
    def log_event(
        db: Session, 
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
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def is_ip_blocked(db: Session, ip_address: str) -> bool:
        blocked = db.query(BlockedIP).filter(
            BlockedIP.ip_address == ip_address,
            BlockedIP.is_active == True
        ).first()
        
        if blocked:
            if blocked.expires_at and blocked.expires_at < datetime.utcnow():
                # Ban expired
                blocked.is_active = False
                db.commit()
                return False
            return True
        return False

    @staticmethod
    def ban_ip(
        db: Session, 
        ip_address: str, 
        reason: str, 
        duration_minutes: int = 60
    ) -> BlockedIP:
        # Check if already banned
        existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address).first()
        expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
        
        if existing:
            existing.is_active = True
            existing.reason = reason
            existing.expires_at = expires_at
            existing.blocked_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        
        blocked = BlockedIP(
            ip_address=ip_address,
            reason=reason,
            expires_at=expires_at
        )
        db.add(blocked)
        db.commit()
        db.refresh(blocked)
        return blocked

    @staticmethod
    def check_login_failures(db: Session, ip_address: str) -> bool:
        """
        Check if IP has exceeded failed login threshold in the last 5 minutes.
        Returns True if IP was just banned, False otherwise.
        """
        THRESHOLD = 5
        WINDOW_MINUTES = 5
        
        since = datetime.utcnow() - timedelta(minutes=WINDOW_MINUTES)
        
        count = db.query(SecurityEvent).filter(
            SecurityEvent.ip_address == ip_address,
            SecurityEvent.event_type == SecurityEventType.LOGIN_FAILED,
            SecurityEvent.created_at >= since
        ).count()
        
        if count >= THRESHOLD:
            SecurityService.ban_ip(
                db, 
                ip_address, 
                reason=f"Too many failed login attempts ({count} in {WINDOW_MINUTES}m)"
            )
            return True
        return False

    @staticmethod
    def get_stats(db: Session) -> Dict:
        total_events = db.query(SecurityEvent).count()
        blocked_ips = db.query(BlockedIP).filter(BlockedIP.is_active == True).count()
        recent_attacks = db.query(SecurityEvent).filter(
            SecurityEvent.created_at >= datetime.utcnow() - timedelta(hours=24)
        ).count()
        
        return {
            "total_events": total_events,
            "active_bans": blocked_ips,
            "attacks_last_24h": recent_attacks
        }

security_service = SecurityService()
