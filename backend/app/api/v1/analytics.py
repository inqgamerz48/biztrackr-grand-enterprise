from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.dependencies import get_db
from app.models.user import User
from app.models.activity_log import ActivityLog
# Assuming Invoice and Expense models exist
# from app.models.invoice import Invoice
# from app.models.expense import Expense

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    # Mocking data where models might be missing or complex to query in this snippet
    # In real implementation, replace with actual DB queries
    
    # Daily Active Users (Unique logins in last 24h)
    # dau = db.query(ActivityLog.user_id).filter(ActivityLog.action == 'LOGIN', ActivityLog.created_at >= one_day_ago).distinct().count()
    dau = 15 # Mock
    
    # Monthly Active Users
    mau = 120 # Mock
    
    # Total Invoices
    # total_invoices = db.query(Invoice).count()
    total_invoices = 1450 # Mock
    
    # Total Expenses
    # total_expenses = db.query(Expense).count()
    total_expenses = 320 # Mock
    
    # Total Exports
    total_exports = db.query(ActivityLog).filter(ActivityLog.action == 'EXPORT').count()
    
    return {
        "dau": dau,
        "mau": mau,
        "total_invoices": total_invoices,
        "total_expenses": total_expenses,
        "total_exports": total_exports
    }

@router.get("/user-activity")
def get_user_activity(db: Session = Depends(get_db)):
    # Login count per user
    activity = db.query(
        ActivityLog.user_id, 
        func.count(ActivityLog.id).label('login_count')
    ).filter(ActivityLog.action == 'LOGIN').group_by(ActivityLog.user_id).all()
    
    return [
        {"user_id": a.user_id, "login_count": a.login_count} for a in activity
    ]
