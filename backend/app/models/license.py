from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class License(Base):
    """
    License Key Model for BizTrackr Pro
    Format: INQ-BZTKR-XXXX-XXXX
    """
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, index=True, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    payment_id = Column(String, unique=True, index=True, nullable=False)
    plan = Column(String, default="PRO", nullable=False)
    payment_provider = Column(String, nullable=False)  # "instamojo", "paypal", "stripe"
    payment_amount = Column(String, nullable=True)
    payment_currency = Column(String, nullable=True)
    
    # User assignment
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="licenses")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    buyer_name = Column(String, nullable=True)
    buyer_phone = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<License {self.key} - {self.email} - Used: {self.used}>"
