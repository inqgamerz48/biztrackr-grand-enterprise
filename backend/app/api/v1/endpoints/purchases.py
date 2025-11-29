from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.models import User, Purchase, PurchaseItem, InventoryItem
from app.schemas import purchase as schemas
from app.api.dependencies import get_current_user, require_manager_or_above
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[schemas.Purchase])
def read_purchases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    purchases = db.query(Purchase).filter(
        Purchase.tenant_id == current_user.tenant_id
    ).offset(skip).limit(limit).all()
    return purchases

@router.post("/", response_model=schemas.Purchase)
def create_purchase(
    purchase_in: schemas.PurchaseCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    # Convert schema to service schema if needed, or just pass dict
    # The service expects a Pydantic model from sales_service, let's adapt
    from app.services.sales_service import PurchaseCreate as ServicePurchaseCreate
    
    service_in = ServicePurchaseCreate(
        supplier_id=purchase_in.supplier_id,
        invoice_number=f"PO-{datetime.now().year}-{datetime.now().timestamp()}", # Service expects this or generates it? Service doesn't generate it.
        items=[{"item_id": i.item_id, "quantity": i.quantity, "price": i.price} for i in purchase_in.items],
        transport_charges=purchase_in.transport_charges
    )
    
    # Override invoice number generation to be consistent
    count = db.query(Purchase).filter(Purchase.tenant_id == current_user.tenant_id).count()
    service_in.invoice_number = f"PO-{datetime.now().year}-{count + 1:04d}"

    from app.services import sales_service
    return sales_service.create_purchase(db, service_in, current_user.tenant_id, current_user.id)

class PaymentRequest(BaseModel):
    amount: float
    payment_method: str
    account_id: Optional[int] = None

@router.post("/{purchase_id}/pay", response_model=schemas.Purchase)
def pay_purchase(
    purchase_id: int,
    payment: PaymentRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    from app.services import sales_service
    purchase = sales_service.record_payment(
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
def receive_purchase(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    from app.services import sales_service
    purchase = sales_service.receive_purchase(db, purchase_id, current_user.tenant_id, current_user.id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase
