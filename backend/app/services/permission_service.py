from sqlalchemy.orm import Session
from app.models.role import Role, Permission, role_permissions
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
    def get_permissions(self, db: Session) -> List[Permission]:
        return db.query(Permission).all()

    def get_roles(self, db: Session, tenant_id: int) -> List[Role]:
        return db.query(Role).filter(Role.tenant_id == tenant_id).all()

    def get_role(self, db: Session, role_id: int, tenant_id: int) -> Optional[Role]:
        return db.query(Role).filter(Role.id == role_id, Role.tenant_id == tenant_id).first()

    def create_role(self, db: Session, role_in: RoleCreate, tenant_id: int) -> Role:
        # Create Role
        db_role = Role(name=role_in.name, tenant_id=tenant_id)
        db.add(db_role)
        db.flush() # Get ID
        
        # Assign Permissions
        if role_in.permissions:
            perms = db.query(Permission).filter(Permission.code.in_(role_in.permissions)).all()
            db_role.permissions = perms
            
        db.commit()
        db.refresh(db_role)
        return db_role

    def update_role(self, db: Session, role_id: int, role_in: RoleUpdate, tenant_id: int) -> Optional[Role]:
        db_role = self.get_role(db, role_id, tenant_id)
        if not db_role:
            return None
        
        if role_in.name:
            db_role.name = role_in.name
            
        if role_in.permissions is not None:
            perms = db.query(Permission).filter(Permission.code.in_(role_in.permissions)).all()
            db_role.permissions = perms
            
        db.commit()
        db.refresh(db_role)
        return db_role

    def delete_role(self, db: Session, role_id: int, tenant_id: int) -> bool:
        db_role = self.get_role(db, role_id, tenant_id)
        if not db_role:
            return False
            
        # Check if users are assigned to this role
        if db_role.users:
            return False # Cannot delete role with assigned users
            
        db.delete(db_role)
        db.commit()
        return True

    def get_user_permissions(self, db: Session, user_id: int) -> Set[str]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.role_obj:
            return set()
        
        return {p.code for p in user.role_obj.permissions}

    def check_permission(self, db: Session, user_id: int, permission_code: str) -> bool:
        perms = self.get_user_permissions(db, user_id)
        return permission_code in perms

permission_service = PermissionService()
