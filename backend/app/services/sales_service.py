from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import datetime
from pydantic import BaseModel
from app.models import Sale, SaleItem, Purchase, PurchaseItem, InventoryItem as Item, Customer, Supplier, User
from app.models.settings import Settings
from app.models.payment_account import PaymentAccount
from app.services import inventory_service
from app.services.activity_log_service import activity_log_service
from app.schemas.purchase import PurchaseCreate

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[dict] # item_id, quantity, discount
    payment_method: str = "Cash"
    discount: float = 0.0
    account_id: Optional[int] = None

async def create_sale(db: AsyncSession, sale_in: SaleCreate, tenant_id: int, user_id: Optional[int] = None):
    # Fetch global settings for tax rate
    result = await db.execute(select(Settings).filter(Settings.tenant_id == tenant_id))
    settings = result.scalars().first()
    tax_rate = settings.tax_rate if settings else 0.0
    
    # 1. Calculate Total
    total_amount = 0.0
    sale_items_data = []
    
    for item_data in sale_in.items:
        result = await db.execute(select(Item).filter(Item.id == item_data['item_id'], Item.tenant_id == tenant_id))
        db_item = result.scalars().first()
        if not db_item:
            continue # Or raise error
        
        if db_item.quantity < item_data['quantity']:
            raise ValueError(f"Insufficient stock for item: {db_item.name}. Available: {db_item.quantity}")

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

    # Determine payment status and amount paid
    if sale_in.payment_method == "Credit":
        payment_status = "pending"
        amount_paid = 0.0
    else:
        payment_status = "paid"
        amount_paid = final_total

    # 2. Create Sale
    invoice_number = f"INV-{int(datetime.datetime.utcnow().timestamp())}"
    
    new_sale = Sale(
        invoice_number=invoice_number,
        customer_id=sale_in.customer_id,
        total_amount=final_total,
        tax_amount=tax_amount,
        discount=sale_in.discount,
        payment_method=sale_in.payment_method,
        payment_account_id=sale_in.account_id,
        payment_status=payment_status,
        amount_paid=amount_paid,
        tenant_id=tenant_id
    )
    db.add(new_sale)
    await db.flush()

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
        await inventory_service.check_low_stock(db, data['db_item'].id, tenant_id)

    # Update Customer Balance
    if sale_in.customer_id:
        result = await db.execute(select(Customer).filter(Customer.id == sale_in.customer_id, Customer.tenant_id == tenant_id))
        customer = result.scalars().first()
        if customer and sale_in.payment_method == "Credit":
            customer.outstanding_balance += new_sale.total_amount

    # Update Payment Account Balance
    if sale_in.account_id and sale_in.payment_method != "Credit":
        result = await db.execute(select(PaymentAccount).filter(PaymentAccount.id == sale_in.account_id, PaymentAccount.tenant_id == tenant_id))
        payment_account = result.scalars().first()
        if payment_account:
            payment_account.balance += new_sale.total_amount

    await db.commit()
    await db.refresh(new_sale)
    
    if user_id:
        await activity_log_service.log_action(
            db, tenant_id, user_id, "CREATE_SALE", "sale", new_sale.id, 
            {"invoice": new_sale.invoice_number, "total": new_sale.total_amount}
        )
        
    return new_sale

async def create_purchase(db: AsyncSession, purchase_in: PurchaseCreate, tenant_id: int, user_id: Optional[int] = None, invoice_number: Optional[str] = None):
    # Fetch global settings for tax rate
    result = await db.execute(select(Settings).filter(Settings.tenant_id == tenant_id))
    settings = result.scalars().first()
    tax_rate = settings.tax_rate if settings else 0.0

    # Handle Pydantic model access (dot notation)
    subtotal = sum([item.quantity * item.price for item in purchase_in.items])
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount + purchase_in.transport_charges
    
    # Generate invoice number if not provided
    if not invoice_number:
        invoice_number = f"PO-{int(datetime.datetime.utcnow().timestamp())}"

    new_purchase = Purchase(
        invoice_number=invoice_number,
        supplier_id=purchase_in.supplier_id,
        total_amount=total_amount,
        tax_amount=tax_amount,
        transport_charges=purchase_in.transport_charges,
        tenant_id=tenant_id,
        status="Ordered"
    )
    db.add(new_purchase)
    await db.flush()

    for item_data in purchase_in.items:
        result = await db.execute(select(Item).filter(Item.id == item_data.item_id, Item.tenant_id == tenant_id))
        db_item = result.scalars().first()
        if not db_item:
            continue
        
        new_p_item = PurchaseItem(
            purchase_id=new_purchase.id,
            item_id=item_data.item_id,
            quantity=item_data.quantity,
            price=item_data.price,
            total=item_data.quantity * item_data.price
        )
        db.add(new_p_item)
        
        # NOTE: Stock is NOT updated here anymore. It happens on "Receive".

    await db.commit()
    
    # Eager load relationships for return
    result = await db.execute(
        select(Purchase)
        .options(
            selectinload(Purchase.items).selectinload(PurchaseItem.item),
            selectinload(Purchase.supplier)
        )
        .filter(Purchase.id == new_purchase.id)
    )
    new_purchase = result.scalars().first()
    
    if user_id:
        await activity_log_service.log_action(
            db, tenant_id, user_id, "CREATE_PURCHASE", "purchase", new_purchase.id, 
            {"invoice": new_purchase.invoice_number, "total": new_purchase.total_amount}
        )
        
    return new_purchase

async def receive_purchase(db: AsyncSession, purchase_id: int, tenant_id: int, user_id: Optional[int] = None):
    result = await db.execute(
        select(Purchase)
        .options(selectinload(Purchase.items), selectinload(Purchase.supplier))
        .filter(Purchase.id == purchase_id, Purchase.tenant_id == tenant_id)
    )
    purchase = result.scalars().first()
    if not purchase:
        return None
    
    if purchase.status == "Received":
        return purchase # Already received
        
    # Update Stock
    for p_item in purchase.items:
        result = await db.execute(select(Item).filter(Item.id == p_item.item_id))
        db_item = result.scalars().first()
        if db_item:
            db_item.quantity += p_item.quantity
            db_item.purchase_price = p_item.price
            
    # Update Supplier Balance
    if purchase.supplier:
        purchase.supplier.outstanding_balance += purchase.total_amount
        
    purchase.status = "Received"
    await db.commit()
    # No need to refresh if we already eager loaded at the start of function, 
    # but to be safe and get DB generated values if any:
    # await db.refresh(purchase) 
    # Actually, refresh might clear eager loaded attributes if not careful.
    # Since we loaded them at line 184, they should be there.
    # But let's re-fetch to be absolutely sure we return a clean object with relationships.
    
    result = await db.execute(
        select(Purchase)
        .options(selectinload(Purchase.items).selectinload(PurchaseItem.item), selectinload(Purchase.supplier))
        .filter(Purchase.id == purchase_id, Purchase.tenant_id == tenant_id)
    )
    purchase = result.scalars().first()
    
    if user_id:
        await activity_log_service.log_action(
            db, tenant_id, user_id, "RECEIVE_PURCHASE", "purchase", purchase.id, 
            {"invoice": purchase.invoice_number, "status": "Received"}
        )
        
    return purchase

async def record_payment(db: AsyncSession, purchase_id: int, amount: float, payment_method: str, tenant_id: int, user_id: Optional[int] = None, account_id: Optional[int] = None):
    result = await db.execute(
        select(Purchase)
        .options(selectinload(Purchase.items).selectinload(PurchaseItem.item), selectinload(Purchase.supplier))
        .filter(Purchase.id == purchase_id, Purchase.tenant_id == tenant_id)
    )
    purchase = result.scalars().first()
    if not purchase:
        # Raise exception or return None
        return None
        
    purchase.amount_paid += amount
    purchase.payment_method = payment_method
    if account_id:
        purchase.payment_account_id = account_id
    
    purchase.payment_status = "paid" if purchase.amount_paid >= purchase.total_amount else "partial"
        
    # Update Supplier Balance
    result = await db.execute(select(Supplier).filter(Supplier.id == purchase.supplier_id))
    supplier = result.scalars().first()
    if supplier:
        supplier.outstanding_balance -= amount
        
    # Update Payment Account Balance (if account_id provided)
    if account_id:
        result = await db.execute(select(PaymentAccount).filter(PaymentAccount.id == account_id, PaymentAccount.tenant_id == tenant_id))
        payment_account = result.scalars().first()
        if payment_account:
            payment_account.balance -= amount # Payment is an outflow from our account
    
    await db.commit()
    # Re-fetch with eager loading
    result = await db.execute(
        select(Purchase)
        .options(selectinload(Purchase.items).selectinload(PurchaseItem.item), selectinload(Purchase.supplier))
        .filter(Purchase.id == purchase_id, Purchase.tenant_id == tenant_id)
    )
    purchase = result.scalars().first()
    
    if user_id:
        await activity_log_service.log_action(
            db, tenant_id, user_id, "PAY_PURCHASE", "purchase", purchase.id, 
            {"invoice": purchase.invoice_number, "amount": amount, "method": payment_method}
        )
        
    return purchase
