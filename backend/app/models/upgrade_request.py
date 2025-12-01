from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class UpgradeRequest(Base):
    __tablename__ = "upgrade_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    plan_requested = Column(String, nullable=False)
    screenshot_url = Column(String, nullable=True)
    payment_ref = Column(String, nullable=True)
    status = Column(String, default="pending", index=True) # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="upgrade_requests")
    company = relationship("Tenant", back_populates="upgrade_requests")
