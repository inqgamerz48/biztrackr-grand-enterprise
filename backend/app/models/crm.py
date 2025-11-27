from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, index=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    outstanding_balance = Column(Float, default=0.0)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="customers")
    sales = relationship("Sale", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    outstanding_balance = Column(Float, default=0.0)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="suppliers")
    items = relationship("InventoryItem", back_populates="supplier")
    purchases = relationship("Purchase", back_populates="supplier")
    payments = relationship("Payment", back_populates="supplier")
