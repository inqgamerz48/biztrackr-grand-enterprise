from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Customer, Supplier, Sale, Purchase, Payment
from pydantic import BaseModel

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: str = None
    address: str = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(BaseModel):
    name: str
    phone: str = None
    email: str = None
    address: str = None

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

# Customer Functions
def create_customer(db: Session, customer: CustomerCreate, tenant_id: int):
    db_obj = Customer(**customer.dict(), tenant_id=tenant_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_customers(db: Session, tenant_id: int):
    return db.query(Customer).filter(Customer.tenant_id == tenant_id).all()

def get_customer_by_id(db: Session, customer_id: int, tenant_id: int):
    return db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id
    ).first()

def update_customer(db: Session, customer_id: int, customer_update: CustomerUpdate, tenant_id: int):
    db_customer = get_customer_by_id(db, customer_id, tenant_id)
    if not db_customer:
        return None
    
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int, tenant_id: int):
    db_customer = get_customer_by_id(db, customer_id, tenant_id)
    if not db_customer:
        return False
    
    db.delete(db_customer)
    db.commit()
    return True

def get_customer_ledger(db: Session, customer_id: int, tenant_id: int):
    """Get all sales and payments for a customer with running balance"""
    sales = db.query(Sale).filter(
        Sale.customer_id == customer_id,
        Sale.tenant_id == tenant_id
    ).all()
    
    payments = db.query(Payment).filter(
        Payment.customer_id == customer_id,
        Payment.tenant_id == tenant_id
    ).all()
    
    # Combine and Sort
    transactions = []
    for sale in sales:
        transactions.append({
            "id": sale.id,
            "type": "SALE",
            "date": sale.date,
            "description": f"Invoice #{sale.invoice_number}",
            "debit": sale.total_amount, # Increase in debt
            "credit": 0.0,
            "ref_id": sale.id
        })
        
    for payment in payments:
        transactions.append({
            "id": payment.id,
            "type": "PAYMENT",
            "date": payment.date,
            "description": f"Payment ({payment.payment_method})",
            "debit": 0.0,
            "credit": payment.amount, # Decrease in debt
            "ref_id": payment.id
        })
        
    transactions.sort(key=lambda x: x['date'])
    
    # Calculate Running Balance
    balance = 0.0
    result = []
    for txn in transactions:
        balance += txn['debit'] - txn['credit']
        result.append({
            **txn,
            "date": txn['date'].isoformat(),
            "balance": balance
        })
        
    return result

def get_top_customers(db: Session, tenant_id: int, limit: int = 10):
    """Get top customers by total sales"""
    from sqlalchemy import func
    
    results = db.query(
        Customer.id,
        Customer.name,
        Customer.phone,
        func.count(Sale.id).label('transaction_count'),
        func.sum(Sale.total_amount).label('total_sales')
    ).join(Sale).filter(
        Customer.tenant_id == tenant_id
    ).group_by(Customer.id, Customer.name, Customer.phone).order_by(
        func.sum(Sale.total_amount).desc()
    ).limit(limit).all()
    
    return [
        {
            "id": cust_id,
            "name": name,
            "phone": phone,
            "transaction_count": count,
            "total_sales": float(total) if total else 0.0
        }
        for cust_id, name, phone, count, total in results
    ]

# Supplier Functions
def create_supplier(db: Session, supplier: SupplierCreate, tenant_id: int):
    db_obj = Supplier(**supplier.dict(), tenant_id=tenant_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_suppliers(db: Session, tenant_id: int):
    return db.query(Supplier).filter(Supplier.tenant_id == tenant_id).all()

def get_supplier_by_id(db: Session, supplier_id: int, tenant_id: int):
    return db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.tenant_id == tenant_id
    ).first()

def update_supplier(db: Session, supplier_id: int, supplier_update: SupplierUpdate, tenant_id: int):
    db_supplier = get_supplier_by_id(db, supplier_id, tenant_id)
    if not db_supplier:
        return None
    
    update_data = supplier_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def delete_supplier(db: Session, supplier_id: int, tenant_id: int):
    db_supplier = get_supplier_by_id(db, supplier_id, tenant_id)
    if not db_supplier:
        return False
    
    db.delete(db_supplier)
    db.commit()
    return True

def get_supplier_ledger(db: Session, supplier_id: int, tenant_id: int):
    """Get all purchases and payments for a supplier with running balance"""
    purchases = db.query(Purchase).filter(
        Purchase.supplier_id == supplier_id,
        Purchase.tenant_id == tenant_id
    ).all()
    
    payments = db.query(Payment).filter(
        Payment.supplier_id == supplier_id,
        Payment.tenant_id == tenant_id
    ).all()
    
    # Combine and Sort
    transactions = []
    for purchase in purchases:
        transactions.append({
            "id": purchase.id,
            "type": "PURCHASE",
            "date": purchase.date,
            "description": f"Invoice #{purchase.invoice_number}",
            "debit": 0.0,
            "credit": purchase.total_amount, # Increase in debt (payable)
            "ref_id": purchase.id
        })
        
    for payment in payments:
        transactions.append({
            "id": payment.id,
            "type": "PAYMENT",
            "date": payment.date,
            "description": f"Payment ({payment.payment_method})",
            "debit": payment.amount, # Decrease in debt (payable)
            "credit": 0.0,
            "ref_id": payment.id
        })
        
    transactions.sort(key=lambda x: x['date'])
    
    # Calculate Running Balance
    balance = 0.0
    result = []
    for txn in transactions:
        balance += txn['credit'] - txn['debit'] # Credit increases balance (payable), Debit decreases it
        result.append({
            **txn,
            "date": txn['date'].isoformat(),
            "balance": balance
        })
        
    return result

def get_top_suppliers(db: Session, tenant_id: int, limit: int = 10):
    """Get top suppliers by total purchase volume"""
    from sqlalchemy import func
    
    results = db.query(
        Supplier.id,
        Supplier.name,
        Supplier.phone,
        func.count(Purchase.id).label('transaction_count'),
        func.sum(Purchase.total_amount).label('total_purchases')
    ).join(Purchase).filter(
        Supplier.tenant_id == tenant_id
    ).group_by(Supplier.id, Supplier.name, Supplier.phone).order_by(
        func.sum(Purchase.total_amount).desc()
    ).limit(limit).all()
    
    return [
        {
            "id": supp_id,
            "name": name,
            "phone": phone,
            "transaction_count": count,
            "total_purchases": float(total) if total else 0.0
        }
        for supp_id, name, phone, count, total in results
    ]
