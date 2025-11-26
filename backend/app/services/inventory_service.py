from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import InventoryItem as Item, Category
from app.schemas import item as schemas
from app.schemas import category as cat_schemas

def get_items(db: Session, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Item]:
    return db.query(Item).filter(Item.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_item(db: Session, item: schemas.ItemCreate, tenant_id: int) -> Item:
    db_item = Item(**item.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_item(db: Session, item_id: int, tenant_id: int) -> Optional[Item]:
    return db.query(Item).filter(Item.id == item_id, Item.tenant_id == tenant_id).first()

def update_item(db: Session, item_id: int, item_in: schemas.ItemUpdate, tenant_id: int) -> Optional[Item]:
    db_item = get_item(db, item_id, tenant_id)
    if not db_item:
        return None
    
    update_data = item_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int, tenant_id: int) -> bool:
    db_item = get_item(db, item_id, tenant_id)
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True

# Category CRUD
def get_categories(db: Session, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Category]:
    return db.query(Category).filter(Category.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_category(db: Session, category: cat_schemas.CategoryCreate, tenant_id: int) -> Category:
    db_category = Category(**category.dict(), tenant_id=tenant_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_in: cat_schemas.CategoryUpdate, tenant_id: int) -> Optional[Category]:
    db_category = db.query(Category).filter(Category.id == category_id, Category.tenant_id == tenant_id).first()
    if not db_category:
        return None
    
    update_data = category_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int, tenant_id: int) -> bool:
    db_category = db.query(Category).filter(Category.id == category_id, Category.tenant_id == tenant_id).first()
    if not db_category:
        return False
    db.delete(db_category)
    db.commit()
    return True
