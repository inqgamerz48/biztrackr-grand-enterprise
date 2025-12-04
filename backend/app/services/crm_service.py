from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.models import Customer, Supplier, Sale, Purchase, Payment
from pydantic import BaseModel
from sqlalchemy import func

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
async def create_customer(db: AsyncSession, customer: CustomerCreate, tenant_id: int):
    db_obj = Customer(**customer.dict(), tenant_id=tenant_id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_customers(db: AsyncSession, tenant_id: int):
    result = await db.execute(select(Customer).filter(Customer.tenant_id == tenant_id))
    return result.scalars().all()

async def get_customer_by_id(db: AsyncSession, customer_id: int, tenant_id: int):
    result = await db.execute(select(Customer).filter(
        Customer.id == customer_id,
        Customer.tenant_id == tenant_id
    ))
    return result.scalars().first()

async def update_customer(db: AsyncSession, customer_id: int, customer_update: CustomerUpdate, tenant_id: int):
    db_customer = await get_customer_by_id(db, customer_id, tenant_id)
    if not db_customer:
        return None
    
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    await db.commit()
    await db.refresh(db_customer)
    return db_customer

async def delete_customer(db: AsyncSession, customer_id: int, tenant_id: int):
    db_customer = await get_customer_by_id(db, customer_id, tenant_id)
    if not db_customer:
        return False
    
    await db.delete(db_customer)
    await db.commit()
    return True

async def get_customer_ledger(db: AsyncSession, customer_id: int, tenant_id: int):
    """Get all sales and payments for a customer with running balance"""
    result = await db.execute(select(Sale).filter(
        Sale.customer_id == customer_id,
        Sale.tenant_id == tenant_id
    ))
    sales = result.scalars().all()
    
    result = await db.execute(select(Payment).filter(
        Payment.customer_id == customer_id,
        Payment.tenant_id == tenant_id
    ))
    payments = result.scalars().all()
    
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

async def get_top_customers(db: AsyncSession, tenant_id: int, limit: int = 10):
    """Get top customers by total sales"""
    
    result = await db.execute(
        select(
            Customer.id,
            Customer.name,
            Customer.phone,
            func.count(Sale.id).label('transaction_count'),
            func.sum(Sale.total_amount).label('total_sales')
        ).join(Sale).filter(
            Customer.tenant_id == tenant_id
        ).group_by(Customer.id, Customer.name, Customer.phone).order_by(
            func.sum(Sale.total_amount).desc()
        ).limit(limit)
    )
    results = result.all()
    
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
async def create_supplier(db: AsyncSession, supplier: SupplierCreate, tenant_id: int):
    db_obj = Supplier(**supplier.dict(), tenant_id=tenant_id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_suppliers(db: AsyncSession, tenant_id: int):
    result = await db.execute(select(Supplier).filter(Supplier.tenant_id == tenant_id))
    return result.scalars().all()

async def get_supplier_by_id(db: AsyncSession, supplier_id: int, tenant_id: int):
    result = await db.execute(select(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.tenant_id == tenant_id
    ))
    return result.scalars().first()

async def update_supplier(db: AsyncSession, supplier_id: int, supplier_update: SupplierUpdate, tenant_id: int):
    db_supplier = await get_supplier_by_id(db, supplier_id, tenant_id)
    if not db_supplier:
        return None
    
    update_data = supplier_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    
    await db.commit()
    await db.refresh(db_supplier)
    return db_supplier

async def delete_supplier(db: AsyncSession, supplier_id: int, tenant_id: int):
    db_supplier = await get_supplier_by_id(db, supplier_id, tenant_id)
    if not db_supplier:
        return False
    
    await db.delete(db_supplier)
    await db.commit()
    return True

async def get_supplier_ledger(db: AsyncSession, supplier_id: int, tenant_id: int):
    """Get all purchases and payments for a supplier with running balance"""
    result = await db.execute(select(Purchase).filter(
        Purchase.supplier_id == supplier_id,
        Purchase.tenant_id == tenant_id
    ))
    purchases = result.scalars().all()
    
    result = await db.execute(select(Payment).filter(
        Payment.supplier_id == supplier_id,
        Payment.tenant_id == tenant_id
    ))
    payments = result.scalars().all()
    
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

async def get_top_suppliers(db: AsyncSession, tenant_id: int, limit: int = 10):
    """Get top suppliers by total purchase volume"""
    
    result = await db.execute(
        select(
            Supplier.id,
            Supplier.name,
            Supplier.phone,
            func.count(Purchase.id).label('transaction_count'),
            func.sum(Purchase.total_amount).label('total_purchases')
        ).join(Purchase).filter(
            Supplier.tenant_id == tenant_id
        ).group_by(Supplier.id, Supplier.name, Supplier.phone).order_by(
            func.sum(Purchase.total_amount).desc()
        ).limit(limit)
    )
    results = result.all()
    
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
