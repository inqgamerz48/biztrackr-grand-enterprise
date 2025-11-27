from sqlalchemy.orm import Session
from typing import Optional
from app.models import Payment, Customer, Supplier
from pydantic import BaseModel
from datetime import datetime

class PaymentCreate(BaseModel):
    amount: float
    date: datetime = None
    payment_method: str = "Cash"
    reference_number: str = None
    notes: str = None
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None

def create_payment(db: Session, payment_in: PaymentCreate, tenant_id: int):
    # Create Payment Record
    db_payment = Payment(
        **payment_in.dict(),
        tenant_id=tenant_id
    )
    if not db_payment.date:
        db_payment.date = datetime.utcnow()
        
    db.add(db_payment)
    
    # Update Balance
    if payment_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == payment_in.customer_id, Customer.tenant_id == tenant_id).first()
        if customer:
            # Payment from customer reduces their debt (outstanding balance)
            customer.outstanding_balance -= payment_in.amount
            
    if payment_in.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == payment_in.supplier_id, Supplier.tenant_id == tenant_id).first()
        if supplier:
            # Payment to supplier reduces our debt to them (outstanding balance)
            supplier.outstanding_balance -= payment_in.amount
            
    db.commit()
    db.refresh(db_payment)
    return db_payment

def delete_payment(db: Session, payment_id: int, tenant_id: int):
    payment = db.query(Payment).filter(Payment.id == payment_id, Payment.tenant_id == tenant_id).first()
    if not payment:
        return False
        
    # Revert Balance
    if payment.customer_id:
        customer = db.query(Customer).filter(Customer.id == payment.customer_id, Customer.tenant_id == tenant_id).first()
        if customer:
            customer.outstanding_balance += payment.amount
            
    if payment.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == payment.supplier_id, Supplier.tenant_id == tenant_id).first()
        if supplier:
            supplier.outstanding_balance += payment.amount
            
    db.delete(payment)
    db.commit()
    return True
