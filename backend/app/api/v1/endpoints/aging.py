from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core import database
from app.api.dependencies import require_manager_or_above
from app.models.user import User
from app.models.sales import Sale
from app.models.crm import Customer

router = APIRouter()

@router.get("/receivables")
def get_aging_receivables(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above)
):
    """
    Get Accounts Receivable Aging Report.
    Groups unpaid invoices into buckets: 0-30, 31-60, 61-90, 90+ days overdue.
    """
    # Fetch all pending/partial sales with a due date
    unpaid_sales = db.query(Sale).filter(
        Sale.tenant_id == current_user.tenant_id,
        Sale.payment_status.in_(["pending", "partial"]),
        Sale.due_date.isnot(None)
    ).all()
    
    aging_data = {}
    total_receivables = 0.0
    
    today = datetime.utcnow().date()
    
    for sale in unpaid_sales:
        customer_id = sale.customer_id
        customer_name = sale.customer.name if sale.customer else "Unknown Customer"
        
        if customer_id not in aging_data:
            aging_data[customer_id] = {
                "customer_name": customer_name,
                "total_due": 0.0,
                "0-30": 0.0,
                "31-60": 0.0,
                "61-90": 0.0,
                "90+": 0.0
            }
            
        due_date = sale.due_date.date()
        days_overdue = (today - due_date).days
        
        # Calculate amount remaining
        amount_remaining = sale.total_amount - sale.amount_paid
        
        # Add to total
        aging_data[customer_id]["total_due"] += amount_remaining
        total_receivables += amount_remaining
        
        # Bucket logic
        if days_overdue <= 30:
            aging_data[customer_id]["0-30"] += amount_remaining
        elif days_overdue <= 60:
            aging_data[customer_id]["31-60"] += amount_remaining
        elif days_overdue <= 90:
            aging_data[customer_id]["61-90"] += amount_remaining
        else:
            aging_data[customer_id]["90+"] += amount_remaining

    return {
        "summary": {
            "total_receivables": total_receivables,
            "customer_count": len(aging_data)
        },
        "details": list(aging_data.values())
    }
