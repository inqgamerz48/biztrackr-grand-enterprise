"""
Payment Request model for bank transfers and manual payment processing.
"""
from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class PaymentRequest(Base):
    __tablename__ = "payment_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    
    # Payment details
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    plan_type = Column(String(50))  # basic, pro, enterprise
    payment_method = Column(String(50))  # bank_transfer, check, cash
    
    # Status tracking
    status = Column(String(20), default="pending")  # pending, approved, rejected, paid
    reference_number = Column(String(100), unique=True, index=True)
    
    # Bank/Payment details
    bank_details = Column(JSON)  # Store bank account info
    payment_proof_url = Column(String(500))  # URL to uploaded proof
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    approver = relationship("User", foreign_keys=[approved_by])
    
    def __repr__(self):
        return f"<PaymentRequest {self.reference_number} - {self.status}>"
