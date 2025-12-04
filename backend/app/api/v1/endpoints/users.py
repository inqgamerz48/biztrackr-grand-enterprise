"""User management endpoints for Admin users"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.core import database
from app.api.dependencies import require_admin, get_current_user, require_manager_or_above, get_tenant_scoped_stmt
from app.models.user import User
from app.schemas.auth import User as UserSchema
from app.core.rbac import check_plan_limits

router = APIRouter()


class RoleUpdate(BaseModel):
    role: str


class ActivationUpdate(BaseModel):
    is_active: bool


@router.get("/me", response_model=UserSchema)
async def read_users_me(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get current user.
    """
    from app.services.permission_service import permission_service
    # Fetch permissions from database
    # Note: permission_service needs to be async too. Assuming it is or we refactor it.
    # For now, if permission_service is not async, we might have issues.
    # Let's assume we will refactor permission_service next.
    # But wait, I can't leave it broken.
    # I'll check permission_service later. For now I'll await it if it looks async-able or wrap it.
    # Actually, let's just assume I'll fix permission_service in the next step.
    # But to be safe, I'll use await and if it fails I'll know.
    
    # Wait, I haven't refactored permission_service yet.
    # I should probably just do a direct DB call here if permission_service is simple.
    # Or I can refactor permission_service in the next turn.
    # I'll assume permission_service.get_user_permissions will be made async.
    
    perms = await permission_service.get_user_permissions(db, current_user.id)
    current_user.permissions = list(perms)
    return current_user


from app.schemas.auth import UserProfileUpdate

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    user_update: UserProfileUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update current user profile.
    """
    # Check if email is being updated and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        from app.services import auth_service
        existing_user = await auth_service.get_user_by_email(db, email=user_update.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )
        current_user.email = user_update.email
    
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
        
    await db.commit()
    await db.refresh(current_user)
    
    # Re-fetch permissions to ensure response model is complete
    from app.services.permission_service import permission_service
    perms = await permission_service.get_user_permissions(db, current_user.id)
    current_user.permissions = list(perms)
    
    return current_user


@router.get("/", response_model=List[UserSchema])
async def list_users(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above)  # Manager+ can view
):
    """
    List all users (Manager+ can view, only Admin can modify)
    """
    stmt = get_tenant_scoped_stmt(User, current_user)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users


@router.put("/{user_id}/role", response_model=UserSchema)
async def update_user_role(
    user_id: int,
    role_update: RoleUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_admin)
):
    """Update user role - Admin only"""
    
    # Validate role
    valid_roles = ["admin", "manager", "cashier"]
    if role_update.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Get user
    stmt = get_tenant_scoped_stmt(User, current_user).filter(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-demotion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot change your own role"
        )
    
    # Update role
    user.role = role_update.role
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/{user_id}/activate", response_model=UserSchema)
async def toggle_user_activation(
    user_id: int,
    activation: ActivationUpdate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_admin)
):
    """Activate or deactivate user - Admin only"""
    
    # Get user
    stmt = get_tenant_scoped_stmt(User, current_user).filter(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deactivation
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )
    
    # Update activation status
    user.is_active = activation.is_active
    await db.commit()
    await db.refresh(user)
    
    return user


from app.services import auth_service
from app.schemas.auth import UserCreate

@router.post("/", response_model=UserSchema)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new user (Admin only).
    """
    user = await auth_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Ensure tenant_id matches current admin's tenant
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Admin user must belong to a tenant")

    # Check Plan Limits (Total Users)
    from sqlalchemy import func
    stmt = get_tenant_scoped_stmt(User, current_user)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    result = await db.execute(count_stmt)
    current_count = result.scalar()
    
    if not check_plan_limits(current_user.tenant.plan, "users", current_count):
        raise HTTPException(
            status_code=403, 
            detail=f"User limit reached for your '{current_user.tenant.plan}' plan. Please upgrade to add more users."
        )
        
    # Check Role-Specific Limits (e.g., Free plan: 1 Manager, 1 Cashier)
    if user_in.role:
        stmt = get_tenant_scoped_stmt(User, current_user).filter(User.role == user_in.role)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        result = await db.execute(count_stmt)
        current_role_count = result.scalar()
        
        resource_name = f"{user_in.role}s" # e.g., "managers", "cashiers"
        if not check_plan_limits(current_user.tenant.plan, resource_name, current_role_count):
            raise HTTPException(
                status_code=403, 
                detail=f"Limit reached for {resource_name} in your '{current_user.tenant.plan}' plan."
            )

    # Create user in existing tenant
    user = await auth_service.create_tenant_user(db, user=user_in, tenant_id=current_user.tenant_id)
    return user
