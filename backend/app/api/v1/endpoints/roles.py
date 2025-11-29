from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core import database
from app.api.dependencies import get_current_user
from app.models import User
from app.services.permission_service import permission_service, RoleCreate, RoleUpdate
from pydantic import BaseModel

router = APIRouter()

class PermissionResponse(BaseModel):
    id: int
    code: str
    description: str

    class Config:
        orm_mode = True

class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: List[PermissionResponse]

    class Config:
        orm_mode = True

@router.get("/permissions", response_model=List[PermissionResponse])
def get_permissions(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return permission_service.get_permissions(db)

@router.get("/", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return permission_service.get_roles(db, current_user.tenant_id)

@router.post("/", response_model=RoleResponse)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    # Only admins can manage roles (for now, or check specific permission)
    if not permission_service.check_permission(db, current_user.id, "manage_roles"):
        raise HTTPException(status_code=403, detail="Not authorized to manage roles")
        
    return permission_service.create_role(db, role_in, current_user.tenant_id)

@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    if not permission_service.check_permission(db, current_user.id, "manage_roles"):
        raise HTTPException(status_code=403, detail="Not authorized to manage roles")
    
    role = permission_service.update_role(db, role_id, role_in, current_user.tenant_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    if not permission_service.check_permission(db, current_user.id, "manage_roles"):
        raise HTTPException(status_code=403, detail="Not authorized to manage roles")
    
    success = permission_service.delete_role(db, role_id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete role (it might have assigned users or not found)")
    return {"status": "success"}

@router.get("/me/permissions")
def get_my_permissions(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return list(permission_service.get_user_permissions(db, current_user.id))
