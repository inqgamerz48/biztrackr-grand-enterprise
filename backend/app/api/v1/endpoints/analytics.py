from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core import database
from app.api.dependencies import get_current_user
from app.models import User
from app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/summary")
def get_summary(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_dashboard_summary(db, current_user.tenant_id)

@router.get("/sales-trends")
def get_sales_trends(
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_sales_trends(db, current_user.tenant_id, days)

@router.get("/top-items")
def get_top_items(
    limit: int = 5,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_top_selling_items(db, current_user.tenant_id, limit)

@router.get("/category-distribution")
def get_category_distribution(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_category_distribution(db, current_user.tenant_id)
