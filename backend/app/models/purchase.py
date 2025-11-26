from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    total_amount = Column(Float, default=0.0)
    transport_charges = Column(Float, default=0.0)
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))

    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer)
    price = Column(Float)
    total = Column(Float)
    
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    
    purchase = relationship("Purchase", back_populates="items")
    item = relationship("InventoryItem", back_populates="purchase_items")
