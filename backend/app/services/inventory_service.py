from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from app.models import InventoryItem as Item, Category
from app.schemas import item as schemas
from app.schemas import category as cat_schemas

async def get_items(db: AsyncSession, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Item]:
    result = await db.execute(select(Item).filter(Item.tenant_id == tenant_id).offset(skip).limit(limit))
    return result.scalars().all()

from app.services.activity_log_service import activity_log_service
from app.services.notification_service import notification_service

async def check_low_stock(db: AsyncSession, item_id: int, tenant_id: int):
    """
    Check if item stock is below minimum level and trigger notification.
    """
    item = await get_item(db, item_id, tenant_id)
    if not item:
        return

    if item.quantity <= item.min_stock:
        # Check if notification already exists to avoid spamming (optional, but good practice)
        # For now, we'll just create it. A more robust system would check for recent unread notifications.
        
        # Find admin users for this tenant to notify
        from app.models import User
        result = await db.execute(select(User).filter(User.tenant_id == tenant_id, User.role == "admin"))
        admins = result.scalars().all()
        
        for admin in admins:
            await notification_service.create_notification(
                db, 
                tenant_id, 
                "Low Stock Alert", 
                f"Item '{item.name}' is low on stock. Current quantity: {item.quantity} (Min: {item.min_stock})",
                "warning",
                user_id=admin.id
            )

import time
import random

async def create_item(db: AsyncSession, item: schemas.ItemCreate, tenant_id: int, user_id: Optional[int] = None) -> Item:
    item_data = item.dict()
    if not item_data.get("barcode"):
        # Generate a unique barcode: ITM-{timestamp}-{random_4_digits}
        timestamp = int(time.time())
        rand_suffix = random.randint(1000, 9999)
        item_data["barcode"] = f"ITM-{timestamp}-{rand_suffix}"
    
    db_item = Item(**item_data, tenant_id=tenant_id)
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    
    if user_id:
        await activity_log_service.log_action(
            db, tenant_id, user_id, "CREATE_ITEM", "item", db_item.id, 
            {"name": db_item.name, "quantity": db_item.quantity}
        )
        
    return db_item

async def get_item(db: AsyncSession, item_id: int, tenant_id: int) -> Optional[Item]:
    result = await db.execute(select(Item).filter(Item.id == item_id, Item.tenant_id == tenant_id))
    return result.scalars().first()

async def update_item(db: AsyncSession, item_id: int, item_in: schemas.ItemUpdate, tenant_id: int, user_id: Optional[int] = None) -> Optional[Item]:
    db_item = await get_item(db, item_id, tenant_id)
    if not db_item:
        return None
    
    update_data = item_in.dict(exclude_unset=True)
    old_values = {k: getattr(db_item, k) for k in update_data.keys()}
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    await db.commit()
    await db.refresh(db_item)
    
    if user_id:
        await activity_log_service.log_action(
            db, tenant_id, user_id, "UPDATE_ITEM", "item", db_item.id, 
            {"changes": update_data, "old_values": old_values}
        )
        
    # Check for low stock if quantity was updated
    if "quantity" in update_data:
        await check_low_stock(db, item_id, tenant_id)
        
    return db_item

async def delete_item(db: AsyncSession, item_id: int, tenant_id: int, user_id: Optional[int] = None) -> bool:
    db_item = await get_item(db, item_id, tenant_id)
    if not db_item:
        return False
    
    item_name = db_item.name
    await db.delete(db_item)
    await db.commit()
    
    if user_id:
        await activity_log_service.log_action(
            db, tenant_id, user_id, "DELETE_ITEM", "item", item_id, 
            {"name": item_name}
        )
        
    return True

# Category CRUD
async def get_categories(db: AsyncSession, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Category]:
    result = await db.execute(select(Category).filter(Category.tenant_id == tenant_id).offset(skip).limit(limit))
    return result.scalars().all()

async def create_category(db: AsyncSession, category: cat_schemas.CategoryCreate, tenant_id: int) -> Category:
    db_category = Category(**category.dict(), tenant_id=tenant_id)
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category

async def update_category(db: AsyncSession, category_id: int, category_in: cat_schemas.CategoryUpdate, tenant_id: int) -> Optional[Category]:
    result = await db.execute(select(Category).filter(Category.id == category_id, Category.tenant_id == tenant_id))
    db_category = result.scalars().first()
    if not db_category:
        return None
    
    update_data = category_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    await db.commit()
    await db.refresh(db_category)
    return db_category

async def delete_category(db: AsyncSession, category_id: int, tenant_id: int) -> bool:
    result = await db.execute(select(Category).filter(Category.id == category_id, Category.tenant_id == tenant_id))
    db_category = result.scalars().first()
    if not db_category:
        return False
    await db.delete(db_category)
    await db.commit()
    return True
