from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    capacity = Column(Float, default=0.0)  # Total capacity in cubic meters
    is_active = Column(Boolean, default=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    tenant = relationship("Tenant")
    zones = relationship("WarehouseZone", back_populates="warehouse", cascade="all, delete-orphan")
    stock_movements = relationship("StockMovement", back_populates="warehouse")
    inward_logs = relationship("InwardLog", back_populates="warehouse")
    outward_logs = relationship("OutwardLog", back_populates="warehouse")


class WarehouseZone(Base):
    __tablename__ = "warehouse_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    zone_type = Column(String)  # "fast-pick", "bulk", "cold-storage", "staging"
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    warehouse = relationship("Warehouse", back_populates="zones")
    tenant = relationship("Tenant")
    bins = relationship("WarehouseBin", back_populates="zone", cascade="all, delete-orphan")


class WarehouseBin(Base):
    __tablename__ = "warehouse_bins"

    id = Column(Integer, primary_key=True, index=True)
    bin_code = Column(String, unique=True, index=True)  # e.g., "A-01-03" (Zone-Rack-Bin)
    zone_id = Column(Integer, ForeignKey("warehouse_zones.id"))
    capacity = Column(Float, default=0.0)  # Capacity in cubic meters
    current_load = Column(Float, default=0.0)  # Current utilization
    is_active = Column(Boolean, default=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    zone = relationship("WarehouseZone", back_populates="bins")
    tenant = relationship("Tenant")
    bin_stocks = relationship("BinStock", back_populates="bin", cascade="all, delete-orphan")


class BinStock(Base):
    __tablename__ = "bin_stocks"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(Integer, ForeignKey("warehouse_bins.id"))
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    bin = relationship("WarehouseBin", back_populates="bin_stocks")
    item = relationship("InventoryItem")
    tenant = relationship("Tenant")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    from_bin_id = Column(Integer, ForeignKey("warehouse_bins.id"), nullable=True)
    to_bin_id = Column(Integer, ForeignKey("warehouse_bins.id"), nullable=True)
    quantity = Column(Integer)
    movement_type = Column(String)  # "transfer", "inward", "outward", "adjustment"
    reason = Column(Text, nullable=True)
    moved_at = Column(DateTime, default=datetime.utcnow)
    moved_by = Column(Integer, ForeignKey("users.id"))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    item = relationship("InventoryItem")
    warehouse = relationship("Warehouse", back_populates="stock_movements")
    from_bin = relationship("WarehouseBin", foreign_keys=[from_bin_id])
    to_bin = relationship("WarehouseBin", foreign_keys=[to_bin_id])
    user = relationship("User")
    tenant = relationship("Tenant")


class InwardLog(Base):
    __tablename__ = "inward_logs"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    purchase_order_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity_received = Column(Integer)
    bin_id = Column(Integer, ForeignKey("warehouse_bins.id"), nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    quality_check_status = Column(String, default="pending")  # "pending", "approved", "rejected"
    notes = Column(Text, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    warehouse = relationship("Warehouse", back_populates="inward_logs")
    supplier = relationship("Supplier")
    purchase = relationship("Purchase")
    item = relationship("InventoryItem")
    bin = relationship("WarehouseBin")
    tenant = relationship("Tenant")


class OutwardLog(Base):
    __tablename__ = "outward_logs"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity_picked = Column(Integer)
    bin_id = Column(Integer, ForeignKey("warehouse_bins.id"), nullable=True)
    picked_at = Column(DateTime, default=datetime.utcnow)
    picked_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")  # "pending", "picked", "packed", "shipped"
    notes = Column(Text, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    warehouse = relationship("Warehouse", back_populates="outward_logs")
    customer = relationship("Customer")
    sale = relationship("Sale")
    item = relationship("InventoryItem")
    bin = relationship("WarehouseBin")
    user = relationship("User")
    tenant = relationship("Tenant")


class DemandHistory(Base):
    __tablename__ = "demand_history"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    date = Column(DateTime, default=datetime.utcnow)
    quantity_sold = Column(Integer, default=0)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    item = relationship("InventoryItem")
    tenant = relationship("Tenant")
