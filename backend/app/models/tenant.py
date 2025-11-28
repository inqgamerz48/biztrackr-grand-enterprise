from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    plan = Column(String, default="free") # free, starter, pro
    subscription_status = Column(String, default="active")
    stripe_customer_id = Column(String, nullable=True)
    subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="tenant")
    items = relationship("InventoryItem", back_populates="tenant")
    sales = relationship("Sale", back_populates="tenant")
    customers = relationship("Customer", back_populates="tenant")
    suppliers = relationship("Supplier", back_populates="tenant")
    expenses = relationship("Expense", back_populates="tenant")
    payments = relationship("Payment", back_populates="tenant")
