from app.core.database import SessionLocal
from app.models import Supplier, InventoryItem, User
from app.core.security import get_password_hash

db = SessionLocal()

# Get default user to get tenant_id
user = db.query(User).first()
if not user:
    print("User not found")
    exit(1)

tenant_id = user.tenant_id

# Add Supplier
supplier = db.query(Supplier).filter(Supplier.name == "Test Supplier", Supplier.tenant_id == tenant_id).first()
if not supplier:
    supplier = Supplier(
        name="Test Supplier",
        phone="1234567890",
        email="supplier@test.com",
        address="Test Address",
        tenant_id=tenant_id
    )
    db.add(supplier)
    db.commit()
    print("Supplier added")
else:
    print("Supplier already exists")

# Add Item
item = db.query(InventoryItem).filter(InventoryItem.name == "Test Item 1", InventoryItem.tenant_id == tenant_id).first()
if not item:
    item = InventoryItem(
        name="Test Item 1",
        quantity=10,
        min_stock=5,
        purchase_price=100.0,
        selling_price=150.0,
        tenant_id=tenant_id
    )
    db.add(item)
    db.commit()
    print("Item added")
else:
    print("Item already exists")

db.close()
