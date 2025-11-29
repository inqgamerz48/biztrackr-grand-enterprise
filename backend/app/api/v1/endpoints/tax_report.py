from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core import database
from app.models import Sale, Purchase, Settings
from app.api.dependencies import get_current_user, require_manager_or_above
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/tax", response_model=dict)
def get_tax_report(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(database.get_db),
    current_user = Depends(require_manager_or_above),
):
    # Default to current month if no dates provided
    if not start_date:
        start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
        
    start = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1) # Include end date
    
    # Input Tax (Purchases)
    input_tax = db.query(func.sum(Purchase.tax_amount)).filter(
        Purchase.tenant_id == current_user.tenant_id,
        Purchase.date >= start,
        Purchase.date < end
    ).scalar() or 0.0
    
    # Output Tax (Sales)
    output_tax = db.query(func.sum(Sale.tax_amount)).filter(
        Sale.tenant_id == current_user.tenant_id,
        Sale.date >= start,
        Sale.date < end
    ).scalar() or 0.0
    
    # Net Tax
    net_tax = output_tax - input_tax
    
    # Get Tax Settings
    settings = db.query(Settings).first()
    tax_rate = settings.tax_rate if settings else 0.0
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "input_tax": input_tax,
        "output_tax": output_tax,
        "net_tax_payable": net_tax,
        "tax_rate": tax_rate
    }
