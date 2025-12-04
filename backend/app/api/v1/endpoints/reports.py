from fastapi import APIRouter, Depends, UploadFile, File, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.core import database
from app.services import report_service
from app.api.dependencies import get_current_user, require_manager_or_above
from app.models import User, Sale, SaleItem, InventoryItem, Category
from sqlalchemy import func, desc

router = APIRouter()

# CSV Export Endpoints
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Get key metrics for the dashboard"""
    # ... existing implementation ...
    return {"message": "Stats placeholder"}

@router.get("/sales-over-time")
async def get_sales_over_time(
    days: int = 30,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Get sales volume over the last N days"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            func.date(Sale.date).label('date'),
            func.sum(Sale.total_amount).label('total')
        ).filter(
            Sale.tenant_id == current_user.tenant_id,
            Sale.date >= start_date
        ).group_by(
            func.date(Sale.date)
        ).order_by(
            func.date(Sale.date)
        )
    )
    sales_data = result.all()
    
    return [{"date": str(s.date), "total": s.total} for s in sales_data]

@router.get("/top-selling-items")
async def get_top_selling_items(
    limit: int = 5,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Get top selling items by quantity"""
    result = await db.execute(
        select(
            InventoryItem.name,
            func.sum(SaleItem.quantity).label('total_quantity')
        ).join(
            SaleItem, InventoryItem.id == SaleItem.item_id
        ).join(
            Sale, Sale.id == SaleItem.sale_id
        ).filter(
            Sale.tenant_id == current_user.tenant_id
        ).group_by(
            InventoryItem.name
        ).order_by(
            desc('total_quantity')
        ).limit(limit)
    )
    top_items = result.all()
    
    return [{"name": i.name, "quantity": i.total_quantity} for i in top_items]

@router.get("/category-distribution")
async def get_category_distribution(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Get sales distribution by category"""
    result = await db.execute(
        select(
            Category.name,
            func.sum(SaleItem.total).label('total_sales')
        ).join(
            InventoryItem, Category.id == InventoryItem.category_id
        ).join(
            SaleItem, InventoryItem.id == SaleItem.item_id
        ).join(
            Sale, Sale.id == SaleItem.sale_id
        ).filter(
            Sale.tenant_id == current_user.tenant_id
        ).group_by(
            Category.name
        )
    )
    cat_dist = result.all()
    
    return [{"name": c.name, "value": c.total_sales} for c in cat_dist]

@router.get("/inventory/export")
async def export_inventory(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = await report_service.export_inventory_csv(db, current_user.tenant_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory.csv"}
    )

@router.get("/sales/export")
async def export_sales(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = await report_service.export_sales_csv(db, current_user.tenant_id, start_date, end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales.csv"}
    )

@router.get("/purchases/export")
async def export_purchases(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = await report_service.export_purchases_csv(db, current_user.tenant_id, start_date, end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=purchases.csv"}
    )

@router.get("/expenses/export")
async def export_expenses(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = await report_service.export_expenses_csv(db, current_user.tenant_id, start_date, end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )

# Analytics Endpoints
@router.get("/analytics/sales")
async def get_sales_analytics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get sales analytics for the last N days"""
    return await report_service.get_sales_analytics(db, current_user.tenant_id, days)

@router.get("/analytics/inventory-valuation")
async def get_inventory_valuation(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get total inventory valuation"""
    return await report_service.get_inventory_valuation(db, current_user.tenant_id)

@router.get("/analytics/profit-loss")
async def get_profit_loss(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get profit and loss data"""
    return await report_service.get_profit_loss_data(db, current_user.tenant_id, start_date, end_date)

@router.get("/analytics/inventory-by-category")
async def get_inventory_by_category(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Get inventory distribution by category"""
    return await report_service.get_inventory_category_analytics(db, current_user.tenant_id)

@router.get("/analytics/expenses-by-category")
async def get_expenses_by_category(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    """Get expense distribution by category"""
    return await report_service.get_expense_category_analytics(db, current_user.tenant_id, start_date, end_date)

# Inventory Import
@router.post("/inventory/import")
async def import_inventory(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return await report_service.import_inventory(db, file, current_user.tenant_id)
