from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class SecurityEventType(str, enum.Enum):
    LOGIN_FAILED = "login_failed"
    SQL_INJECTION = "sql_injection"
    BRUTE_FORCE = "brute_force"
    XSS_ATTEMPT = "xss_attempt"
    UNAUTHORIZED_ACCESS = "unauthorized_access"

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    ip_address = Column(String, index=True)
    description = Column(String, nullable=True)
    severity = Column(String, default="medium") # low, medium, high, critical
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Optional: Link to user if known
    user_email = Column(String, nullable=True)

class BlockedIP(Base):
    __tablename__ = "blocked_ips"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String)
    blocked_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True) # Null means permanent
    is_active = Column(Boolean, default=True)
