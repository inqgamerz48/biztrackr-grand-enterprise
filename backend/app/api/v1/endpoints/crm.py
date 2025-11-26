from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.services import crm_service
from app.api.dependencies import require_manager_or_above
from app.models import User

router = APIRouter()

# Customer Endpoints
@router.post("/customers")
def create_customer(
    customer: crm_service.CustomerCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return crm_service.create_customer(db, customer, current_user.tenant_id)

@router.get("/customers")
def read_customers(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return crm_service.get_customers(db, current_user.tenant_id)

@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    customer = crm_service.get_customer_by_id(db, customer_id, current_user.tenant_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    customer_update: crm_service.CustomerUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    customer = crm_service.update_customer(db, customer_id, customer_update, current_user.tenant_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    success = crm_service.delete_customer(db, customer_id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

@router.get("/customers/{customer_id}/ledger")
def get_customer_ledger(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get transaction history for a customer"""
    return crm_service.get_customer_ledger(db, customer_id, current_user.tenant_id)

@router.get("/customers/analytics/top")
def get_top_customers(
    limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get top customers by sales volume"""
    return crm_service.get_top_customers(db, current_user.tenant_id, limit)

# Supplier Endpoints
@router.post("/suppliers")
def create_supplier(
    supplier: crm_service.SupplierCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return crm_service.create_supplier(db, supplier, current_user.tenant_id)

@router.get("/suppliers")
def read_suppliers(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    return crm_service.get_suppliers(db, current_user.tenant_id)

@router.get("/suppliers/{supplier_id}")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    supplier = crm_service.get_supplier_by_id(db, supplier_id, current_user.tenant_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: int,
    supplier_update: crm_service.SupplierUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    supplier = crm_service.update_supplier(db, supplier_id, supplier_update, current_user.tenant_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.delete("/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    success = crm_service.delete_supplier(db, supplier_id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

@router.get("/suppliers/{supplier_id}/ledger")
def get_supplier_ledger(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get transaction history for a supplier"""
    return crm_service.get_supplier_ledger(db, supplier_id, current_user.tenant_id)

@router.get("/suppliers/analytics/top")
def get_top_suppliers(
    limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Get top suppliers by purchase volume"""
    return crm_service.get_top_suppliers(db, current_user.tenant_id, limit)
