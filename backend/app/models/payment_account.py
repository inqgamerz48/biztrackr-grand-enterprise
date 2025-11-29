from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class PaymentAccount(Base):
    __tablename__ = "payment_accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) # e.g., "Cash Drawer", "HDFC Bank"
    type = Column(String) # "Cash", "Bank", "Mobile Money"
    balance = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
