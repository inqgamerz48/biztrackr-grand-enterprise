from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.role import Role, Permission
from app.models.user import User
from typing import List, Optional, Set
from pydantic import BaseModel

class RoleCreate(BaseModel):
    name: str
    permissions: List[str] # List of permission codes

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[List[str]] = None

class PermissionService:
    async def get_permissions(self, db: AsyncSession) -> List[Permission]:
        result = await db.execute(select(Permission))
        return result.scalars().all()

    async def get_roles(self, db: AsyncSession, tenant_id: int) -> List[Role]:
        result = await db.execute(select(Role).filter(Role.tenant_id == tenant_id))
        return result.scalars().all()

    async def get_role(self, db: AsyncSession, role_id: int, tenant_id: int) -> Optional[Role]:
        result = await db.execute(select(Role).filter(Role.id == role_id, Role.tenant_id == tenant_id))
        return result.scalars().first()

    async def create_role(self, db: AsyncSession, role_in: RoleCreate, tenant_id: int) -> Role:
        # Create Role
        db_role = Role(name=role_in.name, tenant_id=tenant_id)
        db.add(db_role)
        await db.flush() # Get ID
        
        # Assign Permissions
        if role_in.permissions:
            result = await db.execute(select(Permission).filter(Permission.code.in_(role_in.permissions)))
            perms = result.scalars().all()
            db_role.permissions = list(perms)
            
        await db.commit()
        await db.refresh(db_role)
        return db_role

    async def update_role(self, db: AsyncSession, role_id: int, role_in: RoleUpdate, tenant_id: int) -> Optional[Role]:
        db_role = await self.get_role(db, role_id, tenant_id)
        if not db_role:
            return None
        
        # Eager load permissions for update
        # Note: get_role might not load permissions. We should probably reload or ensure it's loaded.
        # But for assigning new list, we just overwrite.
        
        if role_in.name:
            db_role.name = role_in.name
            
        if role_in.permissions is not None:
            result = await db.execute(select(Permission).filter(Permission.code.in_(role_in.permissions)))
            perms = result.scalars().all()
            db_role.permissions = list(perms)
            
        await db.commit()
        await db.refresh(db_role)
        return db_role

    async def delete_role(self, db: AsyncSession, role_id: int, tenant_id: int) -> bool:
        db_role = await self.get_role(db, role_id, tenant_id)
        if not db_role:
            return False
            
        # Check if users are assigned to this role
        # We need to load users or check count
        # db_role.users might not be loaded.
        # Better to do a query check
        result = await db.execute(select(User).filter(User.role_id == role_id))
        if result.scalars().first():
            return False # Cannot delete role with assigned users
            
        await db.delete(db_role)
        await db.commit()
        return True

    async def get_user_permissions(self, db: AsyncSession, user_id: int) -> Set[str]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.role_obj).selectinload(Role.permissions))
            .filter(User.id == user_id)
        )
        user = result.scalars().first()
        if not user or not user.role_obj:
            return set()
        
        return {p.code for p in user.role_obj.permissions}

    async def check_permission(self, db: AsyncSession, user_id: int, permission_code: str) -> bool:
        perms = await self.get_user_permissions(db, user_id)
        return permission_code in perms

permission_service = PermissionService()
