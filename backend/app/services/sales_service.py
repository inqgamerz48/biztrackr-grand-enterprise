from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Sale, SaleItem, Purchase, PurchaseItem, InventoryItem as Item, Customer, Supplier
from pydantic import BaseModel

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[dict] # item_id, quantity, discount
    payment_method: str = "Cash"
    discount: float = 0.0
    account_id: Optional[int] = None

from app.schemas.purchase import PurchaseCreate

def create_sale(db: Session, sale_in: SaleCreate, tenant_id: int, user_id: Optional[int] = None):
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
        payment_account_id=sale_in.account_id,
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
        inventory_service.check_low_stock(db, data['db_item'].id, tenant_id)

    # Update Customer Balance
    if sale_in.customer_id:
        customer = db.query(Customer).filter(Customer.id == sale_in.customer_id, Customer.tenant_id == tenant_id).first()
        if customer and sale_in.payment_method == "Credit":
            customer.outstanding_balance += new_sale.total_amount

    # Update Payment Account Balance
    if sale_in.account_id:
        payment_account = db.query(PaymentAccount).filter(PaymentAccount.id == sale_in.account_id, PaymentAccount.tenant_id == tenant_id).first()
        if payment_account:
            payment_account.balance += new_sale.total_amount

    db.commit()
    db.refresh(new_sale)
    
    if user_id:
        activity_log_service.log_action(
            db, tenant_id, user_id, "CREATE_SALE", "sale", new_sale.id, 
            {"invoice": new_sale.invoice_number, "total": new_sale.total_amount}
        )
        
    return new_sale

def create_purchase(db: Session, purchase_in: PurchaseCreate, tenant_id: int, user_id: Optional[int] = None):
    # Fetch global settings for tax rate
    from app.models.settings import Settings
    settings = db.query(Settings).first()
    tax_rate = settings.tax_rate if settings else 0.0

    subtotal = sum([item['quantity'] * item['price'] for item in purchase_in.items])
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount + purchase_in.transport_charges
    
    new_purchase = Purchase(
        invoice_number=purchase_in.invoice_number,
        supplier_id=purchase_in.supplier_id,
        total_amount=total_amount,
        tax_amount=tax_amount,
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
    
    if user_id:
        activity_log_service.log_action(
            db, tenant_id, user_id, "CREATE_PURCHASE", "purchase", new_purchase.id, 
            {"invoice": new_purchase.invoice_number, "total": new_purchase.total_amount}
        )
        
    return new_purchase

def receive_purchase(db: Session, purchase_id: int, tenant_id: int, user_id: Optional[int] = None):
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
    
    if user_id:
        activity_log_service.log_action(
            db, tenant_id, user_id, "RECEIVE_PURCHASE", "purchase", purchase.id, 
            {"invoice": purchase.invoice_number, "status": "Received"}
        )
        
    return purchase

from app.models.payment_account import PaymentAccount

def record_payment(db: Session, purchase_id: int, amount: float, payment_method: str, tenant_id: int, account_id: Optional[int] = None):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id, Purchase.tenant_id == tenant_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    purchase.amount_paid += amount
    purchase.payment_method = payment_method
    if account_id:
        purchase.payment_account_id = account_id
    
    purchase.payment_status = "paid" if purchase.amount_paid >= purchase.total_amount else "partial"
        
    # Update Supplier Balance
    supplier = db.query(Supplier).filter(Supplier.id == purchase.supplier_id).first()
    if supplier:
        supplier.outstanding_balance -= amount
        
    # Update Payment Account Balance (if account_id provided)
    if account_id:
        payment_account = db.query(PaymentAccount).filter(PaymentAccount.id == account_id, PaymentAccount.tenant_id == tenant_id).first()
        if payment_account:
            payment_account.balance -= amount # Payment is an outflow from our account
    
    db.commit()
    db.refresh(purchase)
    
    if user_id:
        activity_log_service.log_action(
            db, tenant_id, user_id, "PAY_PURCHASE", "purchase", purchase.id, 
            {"invoice": purchase.invoice_number, "amount": amount, "method": payment_method}
        )
        
    return purchase
