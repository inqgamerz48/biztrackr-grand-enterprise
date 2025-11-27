from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    payment_method = Column(String, default="Cash") # Cash, Bank Transfer, Check, etc.
    reference_number = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Links
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))

    # Relationships
    customer = relationship("Customer", back_populates="payments")
    supplier = relationship("Supplier", back_populates="payments")
    tenant = relationship("Tenant", back_populates="payments")
