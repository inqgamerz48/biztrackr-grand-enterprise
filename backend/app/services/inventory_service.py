from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import InventoryItem as Item, Category
from app.schemas import item as schemas
from app.schemas import category as cat_schemas

def get_items(db: Session, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Item]:
    return db.query(Item).filter(Item.tenant_id == tenant_id).offset(skip).limit(limit).all()

from app.services.activity_log_service import activity_log_service
from app.services.notification_service import notification_service

def check_low_stock(db: Session, item_id: int, tenant_id: int):
    """
    Check if item stock is below minimum level and trigger notification.
    """
    item = get_item(db, item_id, tenant_id)
    if not item:
        return

    if item.quantity <= item.min_stock:
        # Check if notification already exists to avoid spamming (optional, but good practice)
        # For now, we'll just create it. A more robust system would check for recent unread notifications.
        
        # Find admin users for this tenant to notify
        from app.models import User
        admins = db.query(User).filter(User.tenant_id == tenant_id, User.role == "admin").all()
        
        for admin in admins:
            notification_service.create_notification(
                db, 
                tenant_id, 
                "Low Stock Alert", 
                f"Item '{item.name}' is low on stock. Current quantity: {item.quantity} (Min: {item.min_stock})",
                "warning",
                user_id=admin.id
            )

def create_item(db: Session, item: schemas.ItemCreate, tenant_id: int, user_id: Optional[int] = None) -> Item:
    db_item = Item(**item.dict(), tenant_id=tenant_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    if user_id:
        activity_log_service.log_action(
            db, tenant_id, user_id, "CREATE_ITEM", "item", db_item.id, 
            {"name": db_item.name, "quantity": db_item.quantity}
        )
        
    return db_item

def get_item(db: Session, item_id: int, tenant_id: int) -> Optional[Item]:
    return db.query(Item).filter(Item.id == item_id, Item.tenant_id == tenant_id).first()

def update_item(db: Session, item_id: int, item_in: schemas.ItemUpdate, tenant_id: int, user_id: Optional[int] = None) -> Optional[Item]:
    db_item = get_item(db, item_id, tenant_id)
    if not db_item:
        return None
    
    update_data = item_in.dict(exclude_unset=True)
    old_values = {k: getattr(db_item, k) for k in update_data.keys()}
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    
    if user_id:
        activity_log_service.log_action(
            db, tenant_id, user_id, "UPDATE_ITEM", "item", db_item.id, 
            {"changes": update_data, "old_values": old_values}
        )
        
    # Check for low stock if quantity was updated
    if "quantity" in update_data:
        check_low_stock(db, item_id, tenant_id)
        
    return db_item

def delete_item(db: Session, item_id: int, tenant_id: int, user_id: Optional[int] = None) -> bool:
    db_item = get_item(db, item_id, tenant_id)
    if not db_item:
        return False
    
    item_name = db_item.name
    db.delete(db_item)
    db.commit()
    
    if user_id:
        activity_log_service.log_action(
            db, tenant_id, user_id, "DELETE_ITEM", "item", item_id, 
            {"name": item_name}
        )
        
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
