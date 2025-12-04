from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core import database
from app.services import sales_service
from app.api.dependencies import get_current_user, get_tenant_scoped_stmt
from app.models import User
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()

@router.post("/sales", response_model=dict)
async def create_sale(
    sale_in: sales_service.SaleCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    sale = await sales_service.create_sale(db, sale_in, current_user.tenant_id, current_user.id)
    return {"id": sale.id, "invoice_number": sale.invoice_number, "total": sale.total_amount}

@router.post("/purchases", response_model=dict)
async def create_purchase(
    purchase_in: sales_service.PurchaseCreate,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    purchase = await sales_service.create_purchase(db, purchase_in, current_user.tenant_id, current_user.id)
    return {"id": purchase.id, "invoice_number": purchase.invoice_number, "total": purchase.total_amount}

from fastapi.responses import StreamingResponse
from app.services.pdf_service_enhanced import generate_sale_receipt_pdf

@router.get("/sales/{sale_id}/pdf")
async def get_sale_pdf(
    sale_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models import Sale, SaleItem
    from app.models.settings import Settings
    
    # Eager load items and customer for PDF generation
    stmt = get_tenant_scoped_stmt(Sale, current_user).options(
        selectinload(Sale.items).selectinload(SaleItem.item),
        selectinload(Sale.customer)
    ).filter(Sale.id == sale_id)
    
    result = await db.execute(stmt)
    sale = result.scalars().first()
    
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Get settings asynchronously
    result = await db.execute(select(Settings).filter(Settings.tenant_id == current_user.tenant_id))
    settings = result.scalars().first()
    
    tax_rate = settings.tax_rate if settings else 0.0
    
    # Prepare settings dictionary
    settings_dict = {}
    if settings:
        settings_dict = {
            'company_name': settings.company_name,
            'company_address': settings.company_address,
            'company_phone': settings.company_phone,
            'company_email': settings.company_email,
            'company_website': settings.company_website,
            'footer_text': settings.footer_text,
            'terms_and_conditions': settings.terms_and_conditions,
            'save_invoices_locally': settings.save_invoices_locally,
            'local_invoice_path': settings.local_invoice_path
        }
    
    # Prepare sale data for PDF
    items_data = []
    for sale_item in sale.items:
        items_data.append({
            'name': sale_item.item.name,
            'quantity': sale_item.quantity,
            'price': sale_item.price,
            'discount': sale_item.discount,
            'total': sale_item.total
        })
    
    subtotal = sum(item['price'] * item['quantity'] for item in items_data)
    item_discounts = sum(item['discount'] for item in items_data)
    
    sale_data = {
        'invoice_number': sale.invoice_number,
        'date': sale.date,
        'items': items_data,
        'subtotal': subtotal,
        'item_discounts': item_discounts,
        'total_discount': sale.discount,
        'tax_amount': sale.tax_amount,
        'tax_rate': tax_rate,
        'total_amount': sale.total_amount,
        'payment_method': sale.payment_method,
        'customer_name': sale.customer.name if sale.customer else None,
        'tenant_id': sale.tenant_id
    }
    
    # PDF Generation in thread pool
    loop = asyncio.get_event_loop()
    pdf_buffer = await loop.run_in_executor(None, generate_sale_receipt_pdf, sale_data, settings_dict)
    
    # Save to local Invoices folder if enabled in settings
    import os
    try:
        save_locally = settings_dict.get('save_invoices_locally', True)
        save_path = settings_dict.get('local_invoice_path', "~/Desktop/Invoices")
            
        if save_locally:
            # Expand user path (handle ~)
            expanded_path = os.path.expanduser(save_path)
            os.makedirs(expanded_path, exist_ok=True)
            
            file_path = os.path.join(expanded_path, f"receipt_{sale.invoice_number}.pdf")
            
            # Save file - IO bound, but fast enough for local, or use aiofiles
            with open(file_path, "wb") as f:
                f.write(pdf_buffer.getvalue())
            
            # Reset buffer for streaming response
            pdf_buffer.seek(0)
    except Exception as e:
        print(f"Failed to save local copy of PDF: {e}")

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=receipt_{sale.invoice_number}.pdf"}
    )

from app.services.purchase_pdf_service import generate_purchase_receipt_pdf

@router.get("/purchases/{purchase_id}/pdf")
async def get_purchase_pdf(
    purchase_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models import Purchase, PurchaseItem
    from app.models.settings import Settings
    
    stmt = get_tenant_scoped_stmt(Purchase, current_user).options(
        selectinload(Purchase.items).selectinload(PurchaseItem.item),
        selectinload(Purchase.supplier)
    ).filter(Purchase.id == purchase_id)
    
    result = await db.execute(stmt)
    purchase = result.scalars().first()
    
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Get settings asynchronously
    result = await db.execute(select(Settings).filter(Settings.tenant_id == current_user.tenant_id))
    settings = result.scalars().first()
    
    # Prepare settings dictionary
    settings_dict = {}
    if settings:
        settings_dict = {
            'company_name': settings.company_name,
            'company_address': settings.company_address,
            'company_phone': settings.company_phone,
            'company_email': settings.company_email,
            'company_website': settings.company_website,
            # 'footer_text': settings.footer_text, # Optional for PO
        }
    
    # Prepare purchase data for PDF
    items_data = []
    for purchase_item in purchase.items:
        items_data.append({
            'name': purchase_item.item.name,
            'quantity': purchase_item.quantity,
            'price': purchase_item.price,
            'total': purchase_item.total
        })
    
    subtotal = sum(item['total'] for item in items_data)
    
    purchase_data = {
        'invoice_number': purchase.invoice_number,
        'date': purchase.date,
        'items': items_data,
        'subtotal': subtotal,
        'transport_charges': purchase.transport_charges,
        'total_amount': purchase.total_amount,
        'supplier_name': purchase.supplier.name if purchase.supplier else None,
        'tenant_id': purchase.tenant_id
    }
    
    loop = asyncio.get_event_loop()
    pdf_buffer = await loop.run_in_executor(None, generate_purchase_receipt_pdf, purchase_data, settings_dict)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=purchase_{purchase.invoice_number}.pdf"}
    )

@router.get("/purchases", response_model=list)
async def get_purchases(
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models import Purchase
    
    stmt = get_tenant_scoped_stmt(Purchase, current_user).options(
        selectinload(Purchase.supplier),
        selectinload(Purchase.items)
    ).order_by(Purchase.date.desc())
    
    result = await db.execute(stmt)
    purchases = result.scalars().all()
    
    return [{
        "id": p.id,
        "invoice_number": p.invoice_number,
        "date": p.date,
        "supplier_name": p.supplier.name if p.supplier else "Unknown",
        "total_amount": p.total_amount,
        "status": p.status,
        "items_count": len(p.items)
    } for p in purchases]

@router.post("/purchases/{purchase_id}/receive")
async def receive_purchase(
    purchase_id: int,
    db: AsyncSession = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    purchase = await sales_service.receive_purchase(db, purchase_id, current_user.tenant_id, current_user.id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found or already received")
    return {"status": "success", "purchase_status": purchase.status}
