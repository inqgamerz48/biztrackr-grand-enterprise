from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    payment_method = Column(String, default="Cash")
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))

    customer = relationship("Customer", back_populates="sales")
    tenant = relationship("Tenant", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer)
    price = Column(Float)
    discount = Column(Float, default=0.0)  # Per-item discount
    total = Column(Float)
    
    sale_id = Column(Integer, ForeignKey("sales.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    
    sale = relationship("Sale", back_populates="items")
    item = relationship("InventoryItem", back_populates="sale_items")
