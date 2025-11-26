from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core import database
from app.services import ai_service
from app.api.dependencies import get_current_user
from app.models import User

router = APIRouter()

@router.get("/forecast")
def get_forecast(
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return ai_service.generate_forecast(db, current_user.tenant_id, days)

@router.get("/insights")
def get_insights(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return {"insights": ai_service.get_insights(db, current_user.tenant_id)}
