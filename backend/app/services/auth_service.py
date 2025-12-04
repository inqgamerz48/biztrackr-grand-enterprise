from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import User, Tenant
from app.schemas import auth as schemas
from app.core.security import get_password_hash

async def create_user(db: AsyncSession, user: schemas.UserCreate):
    # 1. Create Tenant
    new_tenant = Tenant(name=user.tenant_name)
    db.add(new_tenant)
    await db.flush() # Get ID

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
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def create_tenant_user(db: AsyncSession, user: schemas.UserCreate, tenant_id: int):
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
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalars().first()
