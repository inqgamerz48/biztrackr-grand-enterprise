from app.core.database import engine, Base
from app.models import User, Tenant
from app.core.security import get_password_hash
from sqlalchemy.orm import Session

def init():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    session = Session(bind=engine)
    
    # Check if tenant exists
    tenant = session.query(Tenant).filter_by(name="Test Corp").first()
    if not tenant:
        print("Creating test tenant...")
        tenant = Tenant(name="Test Corp", plan="free", subscription_status="active")
        session.add(tenant)
        session.commit()
        session.refresh(tenant)
    
    # Check if user exists
    user = session.query(User).filter_by(email="admin@test.com").first()
    if not user:
        print("Creating test user...")
        user = User(
            email="admin@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="Test Admin",
            tenant_id=tenant.id,
            is_active=True,
            is_superuser=True
        )
        session.add(user)
        session.commit()
        print("Test user created: admin@test.com / password123")
    else:
        print("Test user already exists.")
    
    session.close()

if __name__ == "__main__":
    init()
