from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core import database
from app.api.dependencies import get_current_user
from app.models import User
from app.services.branch_service import branch_service, BranchCreate, BranchUpdate
from pydantic import BaseModel

router = APIRouter()

class BranchResponse(BaseModel):
    id: int
    name: str
    address: str = None
    phone: str = None
    is_main: bool

    class Config:
        orm_mode = True

@router.get("/", response_model=List[BranchResponse])
def get_branches(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return branch_service.get_branches(db, current_user.tenant_id)

@router.post("/", response_model=BranchResponse)
def create_branch(
    branch_in: BranchCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create branches")
    return branch_service.create_branch(db, branch_in, current_user.tenant_id)

@router.put("/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: int,
    branch_in: BranchUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update branches")
    
    branch = branch_service.update_branch(db, branch_id, branch_in, current_user.tenant_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.delete("/{branch_id}")
def delete_branch(
    branch_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete branches")
    
    success = branch_service.delete_branch(db, branch_id, current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete branch (it might be the main branch or not found)")
    return {"status": "success"}
