from sqlalchemy.orm import Session
from app.models import User, Tenant
from app.schemas import auth as schemas
from app.core.security import get_password_hash

def create_user(db: Session, user: schemas.UserCreate):
    # 1. Create Tenant
    new_tenant = Tenant(name=user.tenant_name)
    db.add(new_tenant)
    db.flush() # Get ID

    # 2. Create User
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        tenant_id=new_tenant.id,
        role=user.role if user.role else "admin", # Default to admin for new tenant creators
        is_superuser=user.is_superuser
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    db.refresh(db_user)
    return db_user

def create_tenant_user(db: Session, user: schemas.UserCreate, tenant_id: int):
    """Create a user within an existing tenant"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        tenant_id=tenant_id,
        role=user.role if user.role else "cashier",
        is_superuser=user.is_superuser
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
