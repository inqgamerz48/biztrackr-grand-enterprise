from app.core.database import SessionLocal
from app.models import User, Tenant
from app.core.security import get_password_hash

def create_user():
    db = SessionLocal()
    try:
        # Ensure tenant
        tenant = db.query(Tenant).filter_by(name="Test Corp").first()
        if not tenant:
            tenant = Tenant(name="Test Corp", plan="free", subscription_status="active")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print("Tenant created.")
        
        # Ensure user
        user = db.query(User).filter_by(email="admin@test.com").first()
        if not user:
            print("Creating user...")
            user = User(
                email="admin@test.com",
                hashed_password=get_password_hash("password123"),
                full_name="Test Admin",
                tenant_id=tenant.id,
                is_active=True,
                is_superuser=True
            )
            db.add(user)
            db.commit()
            print("User created successfully.")
        else:
            print("User already exists. Resetting password...")
            user.hashed_password = get_password_hash("password123")
            db.commit()
            print("User password reset.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
