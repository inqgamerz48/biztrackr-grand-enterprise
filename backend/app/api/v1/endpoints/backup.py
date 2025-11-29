from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core import database
from app.api.dependencies import get_current_user, require_admin
from app.models import User
from app.services.backup_service import backup_service

router = APIRouter()

@router.get("/inventory", response_class=StreamingResponse)
def export_inventory(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin),
):
    csv_file = backup_service.export_inventory_csv(db, current_user.tenant_id)
    response = StreamingResponse(iter([csv_file.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=inventory_export.csv"
    return response

@router.get("/sales", response_class=StreamingResponse)
def export_sales(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin),
):
    csv_file = backup_service.export_sales_csv(db, current_user.tenant_id)
    response = StreamingResponse(iter([csv_file.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=sales_export.csv"
    return response

@router.get("/customers", response_class=StreamingResponse)
def export_customers(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin),
):
    csv_file = backup_service.export_customers_csv(db, current_user.tenant_id)
    response = StreamingResponse(iter([csv_file.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=customers_export.csv"
    return response
