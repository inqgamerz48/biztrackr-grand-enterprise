from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core import database
from app.models import User, Purchase, PurchaseItem, InventoryItem
from app.schemas import purchase as schemas
from app.api.dependencies import get_current_user, require_manager_or_above
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[schemas.Purchase])
async def read_purchases(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Purchase)
        .options(
            selectinload(Purchase.items).selectinload(PurchaseItem.item),
            selectinload(Purchase.supplier)
        )
        .filter(Purchase.tenant_id == current_user.tenant_id)
        .offset(skip)
        .limit(limit)
    )
    purchases = result.scalars().all()
    return purchases

@router.post("/", response_model=schemas.Purchase)
async def create_purchase(
    purchase_in: schemas.PurchaseCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    # Override invoice number generation to be consistent
    from sqlalchemy import func
    result = await db.execute(select(func.count(Purchase.id)).filter(Purchase.tenant_id == current_user.tenant_id))
    count = result.scalar()
    invoice_number = f"PO-{datetime.now().year}-{count + 1:04d}"

    from app.services import sales_service
    return await sales_service.create_purchase(db, purchase_in, current_user.tenant_id, current_user.id, invoice_number=invoice_number)

class PaymentRequest(BaseModel):
    amount: float
    payment_method: str
    account_id: Optional[int] = None

@router.post("/{purchase_id}/pay", response_model=schemas.Purchase)
async def pay_purchase(
    purchase_id: int,
    payment: PaymentRequest,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    from app.services import sales_service
    purchase = await sales_service.record_payment(
        db=db,
        purchase_id=purchase_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        account_id=payment.account_id
    )
    
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    return purchase

@router.post("/{purchase_id}/receive", response_model=schemas.Purchase)
async def receive_purchase(
    purchase_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    from app.services import sales_service
    purchase = await sales_service.receive_purchase(db, purchase_id, current_user.tenant_id, current_user.id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase
