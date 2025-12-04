from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from app.core import database
from app.models.payment_account import PaymentAccount
from app.api.dependencies import get_current_user, require_manager_or_above
from pydantic import BaseModel

router = APIRouter()

class PaymentAccountCreate(BaseModel):
    name: str
    type: str
    currency: str = "INR"
    initial_balance: float = 0.0

class PaymentAccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None

class PaymentAccountOut(BaseModel):
    id: int
    name: str
    type: str
    balance: float
    currency: str
    
    class Config:
        orm_mode = True

@router.post("/", response_model=PaymentAccountOut)
async def create_account(
    account_in: PaymentAccountCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(require_manager_or_above)
):
    account = PaymentAccount(
        name=account_in.name,
        type=account_in.type,
        balance=account_in.initial_balance,
        currency=account_in.currency,
        tenant_id=current_user.tenant_id
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account

@router.get("/", response_model=List[PaymentAccountOut])
async def list_accounts(
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(PaymentAccount).filter(PaymentAccount.tenant_id == current_user.tenant_id)
    )
    return result.scalars().all()

@router.put("/{account_id}", response_model=PaymentAccountOut)
async def update_account(
    account_id: int,
    account_in: PaymentAccountUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(require_manager_or_above)
):
    result = await db.execute(
        select(PaymentAccount).filter(
            PaymentAccount.id == account_id,
            PaymentAccount.tenant_id == current_user.tenant_id
        )
    )
    account = result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    if account_in.name:
        account.name = account_in.name
    if account_in.type:
        account.type = account_in.type
    if account_in.balance is not None:
        account.balance = account_in.balance
        
    await db.commit()
    await db.refresh(account)
    return account

@router.delete("/{account_id}")
async def delete_account(
    account_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user = Depends(require_manager_or_above)
):
    result = await db.execute(
        select(PaymentAccount).filter(
            PaymentAccount.id == account_id,
            PaymentAccount.tenant_id == current_user.tenant_id
        )
    )
    account = result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    await db.delete(account)
    await db.commit()
    return {"message": "Account deleted"}
