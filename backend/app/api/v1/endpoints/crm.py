from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import database
from app.services import crm_service, payment_service
from app.api.dependencies import require_manager_or_above
from app.models import User

router = APIRouter()

# Customer Endpoints
@router.post("/customers")
async def create_customer(
    customer: crm_service.CustomerCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return await crm_service.create_customer(db, customer, current_user.tenant_id)

@router.get("/customers")
async def read_customers(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return await crm_service.get_customers(db, current_user.tenant_id)

@router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    customer = await crm_service.get_customer_by_id(db, customer_id, current_user.tenant_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/customers/{customer_id}")
async def update_customer(
    customer_id: int,
    customer_update: crm_service.CustomerUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    customer = await crm_service.update_customer(db, customer_id, customer_update, current_user.tenant_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    success = await crm_service.delete_customer(db, customer_id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

@router.get("/customers/{customer_id}/ledger")
async def get_customer_ledger(
    customer_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get transaction history for a customer"""
    return await crm_service.get_customer_ledger(db, customer_id, current_user.tenant_id)

@router.get("/customers/analytics/top")
async def get_top_customers(
    limit: int = 10,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get top customers by sales volume"""
    return await crm_service.get_top_customers(db, current_user.tenant_id, limit)

@router.post("/customers/{customer_id}/payments")
async def create_customer_payment(
    customer_id: int,
    payment: payment_service.PaymentCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    payment.customer_id = customer_id
    # Note: payment_service needs to be async too. Assuming it will be or is.
    # If payment_service is not async yet, this will fail.
    # I should check payment_service next.
    return await payment_service.create_payment(db, payment, current_user.tenant_id)


# Supplier Endpoints
@router.post("/suppliers")
async def create_supplier(
    supplier: crm_service.SupplierCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return await crm_service.create_supplier(db, supplier, current_user.tenant_id)

@router.get("/suppliers")
async def read_suppliers(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return await crm_service.get_suppliers(db, current_user.tenant_id)

@router.get("/suppliers/{supplier_id}")
async def get_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    supplier = await crm_service.get_supplier_by_id(db, supplier_id, current_user.tenant_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/suppliers/{supplier_id}")
async def update_supplier(
    supplier_id: int,
    supplier_update: crm_service.SupplierUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    supplier = await crm_service.update_supplier(db, supplier_id, supplier_update, current_user.tenant_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    success = await crm_service.delete_supplier(db, supplier_id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

@router.get("/suppliers/{supplier_id}/ledger")
async def get_supplier_ledger(
    supplier_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get transaction history for a supplier"""
    return await crm_service.get_supplier_ledger(db, supplier_id, current_user.tenant_id)

@router.get("/suppliers/analytics/top")
async def get_top_suppliers(
    limit: int = 10,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get top suppliers by purchase volume"""
    return await crm_service.get_top_suppliers(db, current_user.tenant_id, limit)

@router.post("/suppliers/{supplier_id}/payments")
async def create_supplier_payment(
    supplier_id: int,
    payment: payment_service.PaymentCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),
):
    payment.supplier_id = supplier_id
    return await payment_service.create_payment(db, payment, current_user.tenant_id)

