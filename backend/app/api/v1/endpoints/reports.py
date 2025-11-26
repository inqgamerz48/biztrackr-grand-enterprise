from fastapi import APIRouter, Depends, UploadFile, File, Response, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.core import database
from app.services import report_service
from app.api.dependencies import require_manager_or_above
from app.models import User

router = APIRouter()

# CSV Export Endpoints
@router.get("/inventory/export")
def export_inventory(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = report_service.export_inventory_csv(db, current_user.tenant_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory.csv"}
    )

@router.get("/sales/export")
def export_sales(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = report_service.export_sales_csv(db, current_user.tenant_id, start_date, end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales.csv"}
    )

@router.get("/purchases/export")
def export_purchases(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = report_service.export_purchases_csv(db, current_user.tenant_id, start_date, end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=purchases.csv"}
    )

@router.get("/expenses/export")
def export_expenses(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    csv_content = report_service.export_expenses_csv(db, current_user.tenant_id, start_date, end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"}
    )

# Analytics Endpoints
@router.get("/analytics/sales")
def get_sales_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get sales analytics for the last N days"""
    return report_service.get_sales_analytics(db, current_user.tenant_id, days)

@router.get("/analytics/inventory-valuation")
def get_inventory_valuation(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get total inventory valuation"""
    return report_service.get_inventory_valuation(db, current_user.tenant_id)

@router.get("/analytics/profit-loss")
def get_profit_loss(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get profit and loss data"""
    return report_service.get_profit_loss_data(db, current_user.tenant_id, start_date, end_date)

# Inventory Import
@router.post("/inventory/import")
async def import_inventory(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return await report_service.import_inventory(db, file, current_user.tenant_id)
