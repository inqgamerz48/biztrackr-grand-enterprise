from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.api import dependencies
from app.models.inventory import Category, InventoryItem
from app.models.crm import Supplier, Customer
from app.models.sales import Sale, SaleItem
from app.models.user import User
from datetime import datetime

router = APIRouter()

@router.post("/demo")
def seed_demo_data(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(dependencies.get_current_user),
):
    """
    Seed the database with demo data for the current user's tenant.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User does not belong to a tenant")

    # 1. Create Categories
    categories = [
        Category(name="Electronics", tenant_id=tenant_id),
        Category(name="Groceries", tenant_id=tenant_id),
        Category(name="Fashion", tenant_id=tenant_id),
    ]
    db.add_all(categories)
    db.commit()
    for c in categories:
        db.refresh(c)

    # 2. Create Suppliers
    suppliers = [
        Supplier(name="Tech Distributor Inc", phone="1234567890", email="supply@tech.com", tenant_id=tenant_id),
        Supplier(name="Fresh Farms Ltd", phone="0987654321", email="orders@freshfarms.com", tenant_id=tenant_id),
    ]
    db.add_all(suppliers)
    db.commit()
    for s in suppliers:
        db.refresh(s)

    # 3. Create Customers
    customers = [
        Customer(name="John Doe", phone="5551234567", email="john@example.com", tenant_id=tenant_id),
        Customer(name="Jane Smith", phone="5559876543", email="jane@example.com", tenant_id=tenant_id),
    ]
    db.add_all(customers)
    db.commit()
    for c in customers:
        db.refresh(c)

    # 4. Create Inventory Items
    items = [
        InventoryItem(
            name="Smartphone X",
            barcode="SMX001",
            quantity=50,
            min_stock=10,
            mrp=999.0,
            purchase_price=800.0,
            selling_price=950.0,
            category_id=categories[0].id,
            supplier_id=suppliers[0].id,
            tenant_id=tenant_id,
        ),
        InventoryItem(
            name="Laptop Pro",
            barcode="LP002",
            quantity=20,
            min_stock=5,
            mrp=1500.0,
            purchase_price=1200.0,
            selling_price=1400.0,
            category_id=categories[0].id,
            supplier_id=suppliers[0].id,
            tenant_id=tenant_id,
        ),
        InventoryItem(
            name="Organic Apples",
            barcode="APP003",
            quantity=100,
            min_stock=20,
            mrp=5.0,
            purchase_price=3.0,
            selling_price=4.5,
            category_id=categories[1].id,
            supplier_id=suppliers[1].id,
            tenant_id=tenant_id,
        ),
         InventoryItem(
            name="T-Shirt Basic",
            barcode="TSH004",
            quantity=200,
            min_stock=50,
            mrp=25.0,
            purchase_price=10.0,
            selling_price=20.0,
            category_id=categories[2].id,
            supplier_id=None,
            tenant_id=tenant_id,
        ),
         InventoryItem(
            name="Jeans Classic",
            barcode="JNS005",
            quantity=80,
            min_stock=15,
            mrp=60.0,
            purchase_price=30.0,
            selling_price=50.0,
            category_id=categories[2].id,
            supplier_id=None,
            tenant_id=tenant_id,
        ),
    ]
    db.add_all(items)
    db.commit()
    for i in items:
        db.refresh(i)

    # 5. Create Sales (Optional - simplified)
    # For now, let's just create the base data. Sales require more complex logic usually.
    
    return {"message": "Demo data seeded successfully", "categories": len(categories), "items": len(items)}
