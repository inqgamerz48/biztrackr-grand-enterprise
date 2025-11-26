from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.core import database
from app.services import expense_service
from app.api.dependencies import require_manager_or_above
from app.models import User, ExpenseCategory

router = APIRouter()

@router.post("/", response_model=dict)
def create_expense(
    expense: expense_service.ExpenseCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Create a new expense"""
    db_expense = expense_service.create_expense(db, expense, current_user.tenant_id)
    return {
        "id": db_expense.id,
        "category": db_expense.category.value,
        "amount": db_expense.amount,
        "description": db_expense.description,
        "date": db_expense.date.isoformat()
    }

@router.get("/")
def get_expenses(
    category: Optional[ExpenseCategory] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get expenses with optional filters"""
    expenses = expense_service.get_expenses(
        db, current_user.tenant_id, category, start_date, end_date, skip, limit
    )
    return [
        {
            "id": exp.id,
            "category": exp.category.value,
            "amount": exp.amount,
            "description": exp.description,
            "date": exp.date.isoformat(),
            "created_at": exp.created_at.isoformat()
        }
        for exp in expenses
    ]

@router.get("/{expense_id}")
def get_expense(
    expense_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get a single expense by ID"""
    expense = expense_service.get_expense_by_id(db, expense_id, current_user.tenant_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {
        "id": expense.id,
        "category": expense.category.value,
        "amount": expense.amount,
        "description": expense.description,
        "date": expense.date.isoformat(),
        "created_at": expense.created_at.isoformat()
    }

@router.put("/{expense_id}")
def update_expense(
    expense_id: int,
    expense_update: expense_service.ExpenseUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Update an expense"""
    expense = expense_service.update_expense(db, expense_id, expense_update, current_user.tenant_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {
        "id": expense.id,
        "category": expense.category.value,
        "amount": expense.amount,
        "description": expense.description,
        "date": expense.date.isoformat()
    }

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Delete an expense"""
    success = expense_service.delete_expense(db, expense_id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"message": "Expense deleted successfully"}

@router.get("/summary/by-category")
def get_expense_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get expense summary grouped by category"""
    summary = expense_service.get_expense_summary(db, current_user.tenant_id, start_date, end_date)
    return summary

@router.get("/summary/total")
def get_total_expenses(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get total expenses for a period"""
    total = expense_service.get_total_expenses(db, current_user.tenant_id, start_date, end_date)
    return {"total": total}

@router.get("/analytics/trend")
def get_expense_trend(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get monthly expense trend"""
    trend = expense_service.get_monthly_expense_trend(db, current_user.tenant_id, months)
    return trend
