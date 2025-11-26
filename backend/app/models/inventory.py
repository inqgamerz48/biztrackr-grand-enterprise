from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    tenant = relationship("Tenant")
    items = relationship("InventoryItem", back_populates="category")

class InventoryItem(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    barcode = Column(String, index=True, nullable=True)
    quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=5)
    mrp = Column(Float, default=0.0)
    purchase_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)
    
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)

    category = relationship("Category", back_populates="items")
    tenant = relationship("Tenant", back_populates="items")
    supplier = relationship("Supplier", back_populates="items")
    sale_items = relationship("SaleItem", back_populates="item")
    purchase_items = relationship("PurchaseItem", back_populates="item")
