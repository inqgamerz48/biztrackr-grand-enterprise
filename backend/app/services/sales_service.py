from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Sale, SaleItem, Purchase, PurchaseItem, InventoryItem as Item, Customer, Supplier
from pydantic import BaseModel

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[dict] # item_id, quantity, discount
    payment_method: str = "Cash"
    discount: float = 0.0

class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_number: str
    items: List[dict] # item_id, quantity, price
    transport_charges: float = 0.0

def create_sale(db: Session, sale_in: SaleCreate, tenant_id: int):
    # Fetch global settings for tax rate
    from app.models.settings import Settings
    settings = db.query(Settings).first()
    tax_rate = settings.tax_rate if settings else 0.0
    
    # 1. Calculate Total
    total_amount = 0.0
    sale_items_data = []
    
    for item_data in sale_in.items:
        db_item = db.query(Item).filter(Item.id == item_data['item_id'], Item.tenant_id == tenant_id).first()
        if not db_item:
            continue # Or raise error
        
        item_total = (db_item.selling_price * item_data['quantity']) - item_data.get('discount', 0)
        total_amount += item_total
        
        sale_items_data.append({
            "db_item": db_item,
            "quantity": item_data['quantity'],
            "price": db_item.selling_price,
            "discount": item_data.get('discount', 0),
            "total": item_total
        })

    # Apply cart-level discount
    total_after_discount = total_amount - sale_in.discount
    
    # Calculate tax on the discounted total
    tax_amount = total_after_discount * tax_rate
    final_total = total_after_discount + tax_amount

    # 2. Create Sale
    import datetime
    invoice_number = f"INV-{int(datetime.datetime.utcnow().timestamp())}"
    
    new_sale = Sale(
        invoice_number=invoice_number,
        customer_id=sale_in.customer_id,
        total_amount=final_total,
        tax_amount=tax_amount,
        discount=sale_in.discount,
        payment_method=sale_in.payment_method,
        tenant_id=tenant_id
    )
    db.add(new_sale)
    db.flush()

    # 3. Items & Stock Update
    for data in sale_items_data:
        item_discount = data.get('discount', 0)
        new_item = SaleItem(
            sale_id=new_sale.id,
            item_id=data['db_item'].id,
            quantity=data['quantity'],
            price=data['price'],
            discount=item_discount,
            total=data['total']
        )
        db.add(new_item)
        
        # Reduce Stock
        data['db_item'].quantity -= data['quantity']

    # Update Customer Balance
    if sale_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == sale_in.customer_id, Customer.tenant_id == tenant_id).first()
        if customer and sale_in.payment_method == "Credit":
            customer.outstanding_balance += new_sale.total_amount

    db.commit()
    db.refresh(new_sale)
    return new_sale

def create_purchase(db: Session, purchase_in: PurchaseCreate, tenant_id: int):
    total_amount = sum([item['quantity'] * item['price'] for item in purchase_in.items]) + purchase_in.transport_charges
    
    new_purchase = Purchase(
        invoice_number=purchase_in.invoice_number,
        supplier_id=purchase_in.supplier_id,
        total_amount=total_amount,
        transport_charges=purchase_in.transport_charges,
        tenant_id=tenant_id,
        status="Ordered"
    )
    db.add(new_purchase)
    db.flush()

    for item_data in purchase_in.items:
        db_item = db.query(Item).filter(Item.id == item_data['item_id'], Item.tenant_id == tenant_id).first()
        if not db_item:
            continue
        
        new_p_item = PurchaseItem(
            purchase_id=new_purchase.id,
            item_id=item_data['item_id'],
            quantity=item_data['quantity'],
            price=item_data['price'],
            total=item_data['quantity'] * item_data['price']
        )
        db.add(new_p_item)
        
        # NOTE: Stock is NOT updated here anymore. It happens on "Receive".

    db.commit()
    db.refresh(new_purchase)
    return new_purchase

def receive_purchase(db: Session, purchase_id: int, tenant_id: int):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id, Purchase.tenant_id == tenant_id).first()
    if not purchase:
        return None
    
    if purchase.status == "Received":
        return purchase # Already received
        
    # Update Stock
    for p_item in purchase.items:
        db_item = db.query(Item).filter(Item.id == p_item.item_id).first()
        if db_item:
            db_item.quantity += p_item.quantity
            db_item.purchase_price = p_item.price
            
    # Update Supplier Balance
    if purchase.supplier:
        purchase.supplier.outstanding_balance += purchase.total_amount
        
    purchase.status = "Received"
    db.commit()
    db.refresh(purchase)
    return purchase
