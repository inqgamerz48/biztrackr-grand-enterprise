"""Centralized authentication and authorization dependencies"""

from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError

from app.core import database
from app.core.config import settings
from app.core import security
from app.core.rbac import get_role_permissions
from app.models.user import User

from fastapi import Request
from fastapi.security.utils import get_authorization_scheme_param

class OAuth2BearerCookie(OAuth2PasswordBearer):
    """
    Custom OAuth2 class to extract token from HttpOnly cookie.
    Falls back to Authorization header if cookie is missing.
    """
    async def __call__(self, request: Request) -> str:
        # 1. Try to get token from cookie
        authorization: str = request.cookies.get("access_token")
        
        # 2. If no cookie, try header (fallback for API clients)
        if not authorization:
            authorization = request.headers.get("Authorization")
            
        scheme, param = get_authorization_scheme_param(authorization)
        
        if not authorization or scheme.lower() != "bearer":
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                return None
        return param

# OAuth2 scheme for token authentication (Cookie-first)
oauth2_scheme = OAuth2BearerCookie(tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token")
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(database.get_db)
) -> User:
    """
    Dependency to get the current authenticated user from Supabase JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Supabase JWT signature key is SUPABASE_JWT_SECRET (fallback to SECRET_KEY)
        jwt_key = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY
        payload = jwt.decode(token, jwt_key, algorithms=["HS256"], options={"verify_aud": False})
        supabase_uid: str = payload.get("sub")
        email: str = payload.get("email")
        if supabase_uid is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.tenant))
        .filter(User.supabase_uid == supabase_uid)
    )
    user = result.scalars().first()
    
    # Check by email to link legacy accounts
    if user is None and email:
        result = await db.execute(
            select(User)
            .options(selectinload(User.tenant))
            .filter(User.email == email)
        )
        user = result.scalars().first()
        if user:
            user.supabase_uid = supabase_uid
            await db.commit()
            await db.refresh(user)
            
    # Auto-provision new user and workspace
    if user is None:
        from app.models.tenant import Tenant
        tenant_name = f"{email.split('@')[0]}'s Workspace" if email else "My Workspace"
        new_tenant = Tenant(name=tenant_name)
        db.add(new_tenant)
        await db.flush()
        
        user = User(
            email=email or f"user_{supabase_uid[:8]}@supabase.io",
            supabase_uid=supabase_uid,
            tenant_id=new_tenant.id,
            role="admin",
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user
def require_role(allowed_roles: List[str]):
    """
    Dependency factory to check if user has required role.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


# Convenience dependencies for common role requirements
require_admin = require_role(["admin"])
require_manager_or_above = require_role(["admin", "manager"])
require_any_role = require_role(["admin", "manager", "cashier"])

def require_permission(permission: str):
    """
    Dependency factory to check if user has required permission.
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_permissions = get_role_permissions(current_user.role)
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission: {permission}"
            )
        return current_user
    
    return permission_checker

def get_tenant_scoped_stmt(model, user: User):
    """
    Returns a SQLAlchemy Select statement filtered by the current user's tenant_id.
    Enforces strict isolation.
    """
    if not user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="User does not belong to any organization (Tenant ID missing)"
        )
    return select(model).filter(model.tenant_id == user.tenant_id)
