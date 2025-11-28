"""User management endpoints for Admin users"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import database
from app.api.dependencies import require_admin, get_current_user, require_manager_or_above
from app.models.user import User
from app.schemas.auth import User as UserSchema
from app.core.rbac import check_plan_limits

router = APIRouter()


class RoleUpdate(BaseModel):
    role: str


class ActivationUpdate(BaseModel):
    is_active: bool


@router.get("/me", response_model=UserSchema)
def read_users_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user.
    """
    from app.core.rbac import get_role_permissions
    # Manually attach permissions to the user object for the schema
    current_user.permissions = get_role_permissions(current_user.role)
    return current_user


@router.get("/", response_model=List[UserSchema])
def list_users(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above)  # Manager+ can view
):
    """
    List all users (Manager+ can view, only Admin can modify)
    """
    from app.api.dependencies import get_tenant_scoped_query
    users = get_tenant_scoped_query(db, User, current_user).all()
    return users


@router.put("/{user_id}/role", response_model=UserSchema)
def update_user_role(
    user_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(database.get_db),
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
    from app.api.dependencies import get_tenant_scoped_query
    user = get_tenant_scoped_query(db, User, current_user).filter(User.id == user_id).first()
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
    db.commit()
    db.refresh(user)
    
    return user


@router.put("/{user_id}/activate", response_model=UserSchema)
def toggle_user_activation(
    user_id: int,
    activation: ActivationUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin)
):
    """Activate or deactivate user - Admin only"""
    
    # Get user
    from app.api.dependencies import get_tenant_scoped_query
    user = get_tenant_scoped_query(db, User, current_user).filter(User.id == user_id).first()
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
    db.commit()
    db.refresh(user)
    
    return user


from app.services import auth_service
from app.schemas.auth import UserCreate

@router.post("/", response_model=UserSchema)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new user (Admin only).
    """
    user = auth_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Ensure tenant_id matches current admin's tenant
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Admin user must belong to a tenant")

    # Check Plan Limits (Total Users)
    from app.api.dependencies import get_tenant_scoped_query
    current_count = get_tenant_scoped_query(db, User, current_user).count()
    if not check_plan_limits(current_user.tenant.plan, "users", current_count):
        raise HTTPException(
            status_code=403, 
            detail=f"User limit reached for your '{current_user.tenant.plan}' plan. Please upgrade to add more users."
        )
        
    # Check Role-Specific Limits (e.g., Free plan: 1 Manager, 1 Cashier)
    if user_in.role:
        from app.api.dependencies import get_tenant_scoped_query
        current_role_count = get_tenant_scoped_query(db, User, current_user).filter(
            User.role == user_in.role
        ).count()
        resource_name = f"{user_in.role}s" # e.g., "managers", "cashiers"
        if not check_plan_limits(current_user.tenant.plan, resource_name, current_role_count):
            raise HTTPException(
                status_code=403, 
                detail=f"Limit reached for {resource_name} in your '{current_user.tenant.plan}' plan."
            )

    # Create user in existing tenant
    user = auth_service.create_tenant_user(db, user=user_in, tenant_id=current_user.tenant_id)
    return user
