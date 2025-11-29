from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class PurchaseItemBase(BaseModel):
    item_id: int
    quantity: int
    price: float
    total: float

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItem(PurchaseItemBase):
    id: int
    purchase_id: int

    class Config:
        orm_mode = True

class PurchaseBase(BaseModel):
    supplier_id: int
    total_amount: float
    transport_charges: float = 0.0
    status: str = "Ordered"
    payment_status: str = "pending"
    amount_paid: float = 0.0
    due_date: Optional[datetime] = None
    payment_method: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate]

class PurchaseUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    amount_paid: Optional[float] = None
    due_date: Optional[datetime] = None
    payment_method: Optional[str] = None

class Purchase(PurchaseBase):
    id: int
    invoice_number: str
    date: datetime
    tenant_id: int
    branch_id: Optional[int]
    items: List[PurchaseItem] = []

    class Config:
        orm_mode = True
