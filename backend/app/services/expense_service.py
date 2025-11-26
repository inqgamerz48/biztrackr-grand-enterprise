from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.models import Expense, ExpenseCategory
from pydantic import BaseModel

class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    amount: float
    description: Optional[str] = None
    date: datetime

class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class ExpenseSummary(BaseModel):
    category: str
    total: float
    count: int

def create_expense(db: Session, expense: ExpenseCreate, tenant_id: int):
    """Create a new expense"""
    db_obj = Expense(**expense.dict(), tenant_id=tenant_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_expenses(
    db: Session, 
    tenant_id: int, 
    category: Optional[ExpenseCategory] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get expenses with optional filters"""
    query = db.query(Expense).filter(Expense.tenant_id == tenant_id)
    
    if category:
        query = query.filter(Expense.category == category)
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    return query.order_by(Expense.date.desc()).offset(skip).limit(limit).all()

def get_expense_by_id(db: Session, expense_id: int, tenant_id: int):
    """Get a single expense by ID"""
    return db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.tenant_id == tenant_id
    ).first()

def update_expense(db: Session, expense_id: int, expense_update: ExpenseUpdate, tenant_id: int):
    """Update an expense"""
    db_expense = get_expense_by_id(db, expense_id, tenant_id)
    if not db_expense:
        return None
    
    update_data = expense_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_expense(db: Session, expense_id: int, tenant_id: int):
    """Delete an expense"""
    db_expense = get_expense_by_id(db, expense_id, tenant_id)
    if not db_expense:
        return False
    
    db.delete(db_expense)
    db.commit()
    return True

def get_expense_summary(
    db: Session,
    tenant_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[ExpenseSummary]:
    """Get expense summary grouped by category"""
    from sqlalchemy import func
    
    query = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total'),
        func.count(Expense.id).label('count')
    ).filter(Expense.tenant_id == tenant_id)
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    results = query.group_by(Expense.category).all()
    
    return [
        ExpenseSummary(category=cat.value, total=total, count=count)
        for cat, total, count in results
    ]

def get_total_expenses(
    db: Session,
    tenant_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> float:
    """Get total expenses for a period"""
    from sqlalchemy import func
    
    query = db.query(func.sum(Expense.amount)).filter(Expense.tenant_id == tenant_id)
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    result = query.scalar()
    return result if result else 0.0

def get_monthly_expense_trend(db: Session, tenant_id: int, months: int = 6):
    """Get monthly expense totals for the last N months"""
    from sqlalchemy import func, extract
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)
    
    results = db.query(
        extract('year', Expense.date).label('year'),
        extract('month', Expense.date).label('month'),
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.tenant_id == tenant_id,
        Expense.date >= start_date,
        Expense.date <= end_date
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    return [
        {
            'year': int(year),
            'month': int(month),
            'total': float(total)
        }
        for year, month, total in results
    ]
