from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from app.core import database
from app.api.dependencies import get_current_user
from app.models import User, Sale, InventoryItem

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id
    today = date.today()
    yesterday = today - timedelta(days=1)

    # 1. Sales Today
    sales_today = db.query(func.sum(Sale.total_amount)).filter(
        Sale.tenant_id == tenant_id,
        func.date(Sale.date) == today
    ).scalar() or 0.0

    # 2. Sales Yesterday
    sales_yesterday = db.query(func.sum(Sale.total_amount)).filter(
        Sale.tenant_id == tenant_id,
        func.date(Sale.date) == yesterday
    ).scalar() or 0.0

    # 3. Inventory Stats
    total_items = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.tenant_id == tenant_id
    ).scalar() or 0

    low_stock_items = db.query(func.count(InventoryItem.id)).filter(
        InventoryItem.tenant_id == tenant_id,
        InventoryItem.quantity <= InventoryItem.min_stock
    ).scalar() or 0

    # Calculate trend
    trend_percent = 0.0
    if sales_yesterday > 0:
        trend_percent = ((sales_today - sales_yesterday) / sales_yesterday) * 100
    elif sales_today > 0:
        trend_percent = 100.0 # 100% increase if yesterday was 0 and today is > 0

    return {
        "sales_today": float(sales_today),
        "sales_yesterday": float(sales_yesterday),
        "sales_trend": round(trend_percent, 1),
        "total_inventory": total_items,
        "low_stock_items": low_stock_items
    }
