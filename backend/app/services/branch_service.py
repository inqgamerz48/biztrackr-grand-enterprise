from sqlalchemy.orm import Session
from app.models.branch import Branch
from typing import List, Optional
from pydantic import BaseModel

class BranchCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    is_main: bool = False

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_main: Optional[bool] = None

class BranchService:
    def get_branches(self, db: Session, tenant_id: int) -> List[Branch]:
        return db.query(Branch).filter(Branch.tenant_id == tenant_id).all()

    def get_branch(self, db: Session, branch_id: int, tenant_id: int) -> Optional[Branch]:
        return db.query(Branch).filter(Branch.id == branch_id, Branch.tenant_id == tenant_id).first()

    def create_branch(self, db: Session, branch_in: BranchCreate, tenant_id: int) -> Branch:
        # If this is set as main, unset others
        if branch_in.is_main:
            db.query(Branch).filter(Branch.tenant_id == tenant_id).update({Branch.is_main: False})
        
        # Check if it's the first branch, make it main by default
        existing_count = db.query(Branch).filter(Branch.tenant_id == tenant_id).count()
        is_main = branch_in.is_main or (existing_count == 0)

        db_branch = Branch(
            tenant_id=tenant_id,
            name=branch_in.name,
            address=branch_in.address,
            phone=branch_in.phone,
            is_main=is_main
        )
        db.add(db_branch)
        db.commit()
        db.refresh(db_branch)
        return db_branch

    def update_branch(self, db: Session, branch_id: int, branch_in: BranchUpdate, tenant_id: int) -> Optional[Branch]:
        db_branch = self.get_branch(db, branch_id, tenant_id)
        if not db_branch:
            return None
        
        if branch_in.is_main:
             db.query(Branch).filter(Branch.tenant_id == tenant_id).update({Branch.is_main: False})
        
        update_data = branch_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_branch, field, value)
            
        db.commit()
        db.refresh(db_branch)
        return db_branch

    def delete_branch(self, db: Session, branch_id: int, tenant_id: int) -> bool:
        db_branch = self.get_branch(db, branch_id, tenant_id)
        if not db_branch:
            return False
        
        # Prevent deleting the main branch
        if db_branch.is_main:
            return False # Or raise specific error
            
        db.delete(db_branch)
        db.commit()
        return True

branch_service = BranchService()
