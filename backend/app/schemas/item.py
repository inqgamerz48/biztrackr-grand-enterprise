from typing import Optional
from pydantic import BaseModel

class ItemBase(BaseModel):
    name: str
    barcode: Optional[str] = None
    quantity: int = 0
    min_stock: int = 5
    mrp: float = 0.0
    purchase_price: float = 0.0
    selling_price: float = 0.0
    tax_rate: float = 0.0
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    image_url: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    tenant_id: int
    class Config:
        from_attributes = True
