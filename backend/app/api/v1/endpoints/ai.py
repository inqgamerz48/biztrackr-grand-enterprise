from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.core import database
from app.services import ai_service
from app.api.dependencies import get_current_user
from app.models import User
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.get("/forecast")
async def get_forecast(
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return await ai_service.generate_forecast(db, current_user.tenant_id, days)

@router.get("/insights")
async def get_insights(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return {"insights": await ai_service.get_insights(db, current_user.tenant_id)}

@router.post("/chat")
async def chat_with_bizbot(
    request: ChatRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    response = await ai_service.process_chat_message(db, current_user.tenant_id, request.message)
    return {"response": response}
