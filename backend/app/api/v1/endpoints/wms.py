from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.warehouse import (
    Warehouse, WarehouseZone, WarehouseBin, BinStock,
    StockMovement, InwardLog, OutwardLog, DemandHistory
)
from app.models.inventory import InventoryItem
from app.services.wms_intelligence import WMSIntelligenceService
from pydantic import BaseModel

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class WarehouseCreate(BaseModel):
    name: str
    location: str
    capacity: float


class WarehouseResponse(BaseModel):
    id: int
    name: str
    location: str
    capacity: float
    is_active: bool

    class Config:
        from_attributes = True


class ZoneCreate(BaseModel):
    name: str
    zone_type: str  # "fast-pick", "bulk", "cold-storage", "staging"
    warehouse_id: int


class BinCreate(BaseModel):
    bin_code: str
    zone_id: int
    capacity: float


class StockMovementCreate(BaseModel):
    item_id: int
    warehouse_id: int
    from_bin_id: Optional[int] = None
    to_bin_id: Optional[int] = None
    quantity: int
    movement_type: str  # "transfer", "inward", "outward", "adjustment"
    reason: Optional[str] = None


class InwardLogCreate(BaseModel):
    warehouse_id: int
    supplier_id: int
    item_id: int
    quantity_received: int
    bin_id: Optional[int] = None
    purchase_order_id: Optional[int] = None
    quality_check_status: str = "pending"
    notes: Optional[str] = None


class OutwardLogCreate(BaseModel):
    warehouse_id: int
    item_id: int
    quantity_picked: int
    bin_id: Optional[int] = None
    customer_id: Optional[int] = None
    sale_id: Optional[int] = None
    status: str = "pending"
    notes: Optional[str] = None


# ============================================================
# WAREHOUSE CRUD
# ============================================================

@router.get("/warehouses", response_model=List[WarehouseResponse])
async def get_warehouses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all warehouses for tenant"""
    result = await db.execute(
        select(Warehouse).where(Warehouse.tenant_id == current_user.tenant_id)
    )
    warehouses = result.scalars().all()
    return warehouses


@router.post("/warehouses", response_model=WarehouseResponse)
async def create_warehouse(
    warehouse: WarehouseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new warehouse"""
    new_warehouse = Warehouse(
        name=warehouse.name,
        location=warehouse.location,
        capacity=warehouse.capacity,
        tenant_id=current_user.tenant_id
    )
    db.add(new_warehouse)
    await db.commit()
    await db.refresh(new_warehouse)
    return new_warehouse


@router.post("/zones")
async def create_zone(
    zone: ZoneCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a warehouse zone"""
    new_zone = WarehouseZone(
        name=zone.name,
        zone_type=zone.zone_type,
        warehouse_id=zone.warehouse_id,
        tenant_id=current_user.tenant_id
    )
    db.add(new_zone)
    await db.commit()
    await db.refresh(new_zone)
    return new_zone


@router.post("/bins")
async def create_bin(
    bin: BinCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a warehouse bin"""
    new_bin = WarehouseBin(
        bin_code=bin.bin_code,
        zone_id=bin.zone_id,
        capacity=bin.capacity,
        tenant_id=current_user.tenant_id
    )
    db.add(new_bin)
    await db.commit()
    await db.refresh(new_bin)
    return new_bin


@router.get("/bins")
async def get_bins(
    warehouse_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all bins, optionally filtered by warehouse"""
    query = select(WarehouseBin).where(WarehouseBin.tenant_id == current_user.tenant_id)
    
    if warehouse_id:
        query = query.join(WarehouseZone).where(WarehouseZone.warehouse_id == warehouse_id)
    
    result = await db.execute(query)
    bins = result.scalars().all()
    return bins


# ============================================================
# STOCK MOVEMENTS
# ============================================================

@router.post("/stock-movements")
async def create_stock_movement(
    movement: StockMovementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a stock movement"""
    new_movement = StockMovement(
        item_id=movement.item_id,
        warehouse_id=movement.warehouse_id,
        from_bin_id=movement.from_bin_id,
        to_bin_id=movement.to_bin_id,
        quantity=movement.quantity,
        movement_type=movement.movement_type,
        reason=movement.reason,
        moved_by=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(new_movement)
    
    # Update bin stock accordingly
    if movement.to_bin_id:
        # Add to destination bin
        result = await db.execute(
            select(BinStock).where(
                and_(
                    BinStock.bin_id == movement.to_bin_id,
                    BinStock.item_id == movement.item_id
                )
            )
        )
        bin_stock = result.scalar_one_or_none()
        
        if bin_stock:
            bin_stock.quantity += movement.quantity
        else:
            bin_stock = BinStock(
                bin_id=movement.to_bin_id,
                item_id=movement.item_id,
                quantity=movement.quantity,
                tenant_id=current_user.tenant_id
            )
            db.add(bin_stock)
    
    if movement.from_bin_id:
        # Remove from source bin
        result = await db.execute(
            select(BinStock).where(
                and_(
                    BinStock.bin_id == movement.from_bin_id,
                    BinStock.item_id == movement.item_id
                )
            )
        )
        bin_stock = result.scalar_one_or_none()
        
        if bin_stock:
            bin_stock.quantity -= movement.quantity
            if bin_stock.quantity < 0:
                bin_stock.quantity = 0
    
    await db.commit()
    return {"message": "Stock movement recorded successfully"}


# ============================================================
# INWARD & OUTWARD LOGS
# ============================================================

@router.post("/inward")
async def create_inward_log(
    inward: InwardLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record inward stock receipt"""
    new_log = InwardLog(
        warehouse_id=inward.warehouse_id,
        supplier_id=inward.supplier_id,
        item_id=inward.item_id,
        quantity_received=inward.quantity_received,
        bin_id=inward.bin_id,
        purchase_order_id=inward.purchase_order_id,
        quality_check_status=inward.quality_check_status,
        notes=inward.notes,
        tenant_id=current_user.tenant_id
    )
    db.add(new_log)
    
    # Update inventory
    result = await db.execute(
        select(InventoryItem).where(InventoryItem.id == inward.item_id)
    )
    item = result.scalar_one_or_none()
    if item:
        item.quantity += inward.quantity_received
    
    # Update bin stock if bin is specified
    if inward.bin_id:
        result = await db.execute(
            select(BinStock).where(
                and_(
                    BinStock.bin_id == inward.bin_id,
                    BinStock.item_id == inward.item_id
                )
            )
        )
        bin_stock = result.scalar_one_or_none()
        
        if bin_stock:
            bin_stock.quantity += inward.quantity_received
        else:
            bin_stock = BinStock(
                bin_id=inward.bin_id,
                item_id=inward.item_id,
                quantity=inward.quantity_received,
                tenant_id=current_user.tenant_id
            )
            db.add(bin_stock)
    
    await db.commit()
    return {"message": "Inward stock logged successfully"}


@router.post("/outward")
async def create_outward_log(
    outward: OutwardLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record outward stock picking"""
    new_log = OutwardLog(
        warehouse_id=outward.warehouse_id,
        item_id=outward.item_id,
        quantity_picked=outward.quantity_picked,
        bin_id=outward.bin_id,
        customer_id=outward.customer_id,
        sale_id=outward.sale_id,
        status=outward.status,
        notes=outward.notes,
        picked_by=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(new_log)
    
    # Update inventory
    result = await db.execute(
        select(InventoryItem).where(InventoryItem.id == outward.item_id)
    )
    item = result.scalar_one_or_none()
    if item:
        item.quantity -= outward.quantity_picked
        if item.quantity < 0:
            item.quantity = 0
    
    # Update bin stock if bin is specified
    if outward.bin_id:
        result = await db.execute(
            select(BinStock).where(
                and_(
                    BinStock.bin_id == outward.bin_id,
                    BinStock.item_id == outward.item_id
                )
            )
        )
        bin_stock = result.scalar_one_or_none()
        
        if bin_stock:
            bin_stock.quantity -= outward.quantity_picked
            if bin_stock.quantity < 0:
                bin_stock.quantity = 0
    
    # Record demand history
    demand = DemandHistory(
        item_id=outward.item_id,
        quantity_sold=outward.quantity_picked,
        tenant_id=current_user.tenant_id
    )
    db.add(demand)
    
    await db.commit()
    return {"message": "Outward stock logged successfully"}


@router.get("/inward")
async def get_inward_logs(
    warehouse_id: Optional[int] = None,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get inward logs"""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    query = select(InwardLog).where(
        and_(
            InwardLog.tenant_id == current_user.tenant_id,
            InwardLog.received_at >= cutoff
        )
    )
    
    if warehouse_id:
        query = query.where(InwardLog.warehouse_id == warehouse_id)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    return logs


@router.get("/outward")
async def get_outward_logs(
    warehouse_id: Optional[int] = None,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get outward logs"""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    query = select(OutwardLog).where(
        and_(
            OutwardLog.tenant_id == current_user.tenant_id,
            OutwardLog.picked_at >= cutoff
        )
    )
    
    if warehouse_id:
        query = query.where(OutwardLog.warehouse_id == warehouse_id)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    return logs


# ============================================================
# AI WAREHOUSE INTELLIGENCE
# ============================================================

@router.get("/intelligence")
async def get_warehouse_intelligence(
    warehouse_id: Optional[int] = None,
    days_history: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate comprehensive AI-powered warehouse intelligence report
    
    Returns:
    - Low stock alerts with days-to-stockout
    - AI reorder recommendations
    - Optimal bin locations for fast/slow movers
    - Anomaly detection (spikes, shrinkage, GRN mismatches)
    - Warehouse performance metrics
    - Actionable business plan
    """
    service = WMSIntelligenceService(db, current_user.tenant_id)
    report = await service.generate_warehouse_intelligence_report(
        warehouse_id=warehouse_id,
        days_history=days_history
    )
    return report


@router.get("/stock-overview")
async def get_stock_overview(
    warehouse_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get stock overview across all bins"""
    query = select(BinStock).where(BinStock.tenant_id == current_user.tenant_id)
    
    if warehouse_id:
        query = query.join(WarehouseBin).join(WarehouseZone).where(
            WarehouseZone.warehouse_id == warehouse_id
        )
    
    result = await db.execute(query)
    stocks = result.scalars().all()
    
    # Aggregate by item
    stock_summary = {}
    for stock in stocks:
        if stock.item_id not in stock_summary:
            stock_summary[stock.item_id] = {
                "item_id": stock.item_id,
                "total_quantity": 0,
                "bin_locations": []
            }
        stock_summary[stock.item_id]["total_quantity"] += stock.quantity
        stock_summary[stock.item_id]["bin_locations"].append({
            "bin_id": stock.bin_id,
            "quantity": stock.quantity
        })
    
    return list(stock_summary.values())
