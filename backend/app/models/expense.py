from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ExpenseCategory(str, enum.Enum):
    RENT = "Rent"
    SALARIES = "Salaries"
    UTILITIES = "Utilities"
    MARKETING = "Marketing"
    TRANSPORT = "Transport"
    MAINTENANCE = "Maintenance"
    SUPPLIES = "Supplies"
    INSURANCE = "Insurance"
    TAXES = "Taxes"
    MISCELLANEOUS = "Miscellaneous"

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(ExpenseCategory), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="expenses")
