from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    action = Column(String, nullable=False) # e.g., "CREATE_ITEM", "UPDATE_STOCK", "DELETE_SALE"
    entity_type = Column(String, nullable=False) # e.g., "item", "sale", "user"
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True) # Store old/new values or other metadata
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant")
    user = relationship("User")
