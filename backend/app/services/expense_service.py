from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, extract
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

async def create_expense(db: AsyncSession, expense: ExpenseCreate, tenant_id: int):
    """Create a new expense"""
    db_obj = Expense(**expense.dict(), tenant_id=tenant_id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_expenses(
    db: AsyncSession, 
    tenant_id: int, 
    category: Optional[ExpenseCategory] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get expenses with optional filters"""
    stmt = select(Expense).filter(Expense.tenant_id == tenant_id)
    
    if category:
        stmt = stmt.filter(Expense.category == category)
    
    if start_date:
        stmt = stmt.filter(Expense.date >= start_date)
    
    if end_date:
        stmt = stmt.filter(Expense.date <= end_date)
    
    result = await db.execute(stmt.order_by(Expense.date.desc()).offset(skip).limit(limit))
    return result.scalars().all()

async def get_expense_by_id(db: AsyncSession, expense_id: int, tenant_id: int):
    """Get a single expense by ID"""
    result = await db.execute(select(Expense).filter(
        Expense.id == expense_id,
        Expense.tenant_id == tenant_id
    ))
    return result.scalars().first()

async def update_expense(db: AsyncSession, expense_id: int, expense_update: ExpenseUpdate, tenant_id: int):
    """Update an expense"""
    db_expense = await get_expense_by_id(db, expense_id, tenant_id)
    if not db_expense:
        return None
    
    update_data = expense_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

async def delete_expense(db: AsyncSession, expense_id: int, tenant_id: int):
    """Delete an expense"""
    db_expense = await get_expense_by_id(db, expense_id, tenant_id)
    if not db_expense:
        return False
    
    await db.delete(db_expense)
    await db.commit()
    return True

async def get_expense_summary(
    db: AsyncSession,
    tenant_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[ExpenseSummary]:
    """Get expense summary grouped by category"""
    
    stmt = select(
        Expense.category,
        func.sum(Expense.amount).label('total'),
        func.count(Expense.id).label('count')
    ).filter(Expense.tenant_id == tenant_id)
    
    if start_date:
        stmt = stmt.filter(Expense.date >= start_date)
    
    if end_date:
        stmt = stmt.filter(Expense.date <= end_date)
    
    result = await db.execute(stmt.group_by(Expense.category))
    results = result.all()
    
    return [
        ExpenseSummary(category=cat.value, total=total, count=count)
        for cat, total, count in results
    ]

async def get_total_expenses(
    db: AsyncSession,
    tenant_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> float:
    """Get total expenses for a period"""
    
    stmt = select(func.sum(Expense.amount)).filter(Expense.tenant_id == tenant_id)
    
    if start_date:
        stmt = stmt.filter(Expense.date >= start_date)
    
    if end_date:
        stmt = stmt.filter(Expense.date <= end_date)
    
    result = await db.execute(stmt)
    total = result.scalar()
    return total if total else 0.0

async def get_monthly_expense_trend(db: AsyncSession, tenant_id: int, months: int = 6):
    """Get monthly expense totals for the last N months"""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)
    
    stmt = select(
        extract('year', Expense.date).label('year'),
        extract('month', Expense.date).label('month'),
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.tenant_id == tenant_id,
        Expense.date >= start_date,
        Expense.date <= end_date
    ).group_by('year', 'month').order_by('year', 'month')
    
    result = await db.execute(stmt)
    results = result.all()
    
    return [
        {
            'year': int(year),
            'month': int(month),
            'total': float(total)
        }
        for year, month, total in results
    ]
