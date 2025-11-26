from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core import database, security
from app.services import inventory_service
from app.schemas import item as schemas
from app.schemas import category as cat_schemas
import shutil
import uuid
import os
from app.models import User

# Import centralized auth dependencies
from app.api.dependencies import get_current_user, require_manager_or_above

router = APIRouter()

@router.get("/", response_model=List[schemas.Item])
def read_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    items = inventory_service.get_items(db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)
    return items

@router.post("/", response_model=schemas.Item)
def create_item(
    item_in: schemas.ItemCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Create inventory item - Manager+ access"""
    return inventory_service.create_item(db, item=item_in, tenant_id=current_user.tenant_id)

@router.put("/{item_id}", response_model=schemas.Item)
def update_item(
    item_id: int,
    item_in: schemas.ItemUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Update inventory item - Manager+ access"""
    item = inventory_service.update_item(db, item_id=item_id, item_in=item_in, tenant_id=current_user.tenant_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(require_manager_or_above),  # Manager+ only
):
    """Delete inventory item - Manager+ access"""
    success = inventory_service.delete_item(db, item_id=item_id, tenant_id=current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

# Image Upload
@router.post("/upload-image")
def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    file_extension = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"static/images/{file_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/static/images/{file_name}"}

# Category Endpoints
@router.get("/categories", response_model=List[cat_schemas.Category])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return inventory_service.get_categories(db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)

@router.post("/categories", response_model=cat_schemas.Category)
def create_category(
    category_in: cat_schemas.CategoryCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    return inventory_service.create_category(db, category=category_in, tenant_id=current_user.tenant_id)

@router.put("/categories/{category_id}", response_model=cat_schemas.Category)
def update_category(
    category_id: int,
    category_in: cat_schemas.CategoryUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    category = inventory_service.update_category(db, category_id=category_id, category_in=category_in, tenant_id=current_user.tenant_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    success = inventory_service.delete_category(db, category_id=category_id, tenant_id=current_user.tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Bulk Import Endpoint
@router.post("/bulk-import")
async def bulk_import_items(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    import pandas as pd
    import io
    
    # Validate file type
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported")
    
    try:
        # Read file content
        contents = await file.read()
        
        # Parse file based on extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:  # xlsx
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['name', 'quantity', 'selling_price']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        items_created = 0
        categories_created = 0
        errors = []
        category_cache = {}  # Cache to avoid repeated DB queries
        
        # Get existing categories
        existing_categories = inventory_service.get_categories(db, tenant_id=current_user.tenant_id)
        for cat in existing_categories:
            category_cache[cat.name.lower()] = cat.id
        
        # Process each row
        for index, row in df.iterrows():
            try:
                # Handle category
                category_id = None
                if 'category' in df.columns and pd.notna(row['category']) and row['category']:
                    category_name = str(row['category']).strip()
                    category_key = category_name.lower()
                    
                    if category_key not in category_cache:
                        # Create new category
                        new_category = inventory_service.create_category(
                            db,
                            cat_schemas.CategoryCreate(name=category_name),
                            tenant_id=current_user.tenant_id
                        )
                        category_cache[category_key] = new_category.id
                        categories_created += 1
                    
                    category_id = category_cache[category_key]
                
                # Create item
                item_data = {
                    'name': str(row['name']).strip(),
                    'quantity': int(row['quantity']),
                    'selling_price': float(row['selling_price']),
                    'category_id': category_id,
                    'min_stock': int(row['min_stock']) if 'min_stock' in df.columns and pd.notna(row['min_stock']) else 5,
                    'image_url': str(row['image_url']).strip() if 'image_url' in df.columns and pd.notna(row['image_url']) else None
                }
                
                inventory_service.create_item(
                    db,
                    schemas.ItemCreate(**item_data),
                    tenant_id=current_user.tenant_id
                )
                items_created += 1
                
            except Exception as e:
                errors.append({
                    'row': index + 2,  # +2 because index starts at 0 and header is row 1
                    'error': str(e),
                    'data': row.to_dict()
                })
        
        return {
            'items_created': items_created,
            'categories_created': categories_created,
            'total_rows': len(df),
            'errors': errors
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
