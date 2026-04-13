from app.core.database import SessionLocal
from app.models import User, Supplier

db = SessionLocal()

users = db.query(User).all()
print("Users:")
for u in users:
    print(f"ID: {u.id}, Email: {u.email}, TenantID: {u.tenant_id}")

suppliers = db.query(Supplier).all()
print("\nSuppliers:")
for s in suppliers:
    print(f"ID: {s.id}, Name: {s.name}, TenantID: {s.tenant_id}")

db.close()
