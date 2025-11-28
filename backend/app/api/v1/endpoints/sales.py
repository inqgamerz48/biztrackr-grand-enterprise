from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.services import sales_service
from app.api.dependencies import get_current_user
from app.models import User

router = APIRouter()

@router.post("/sales", response_model=dict)
def create_sale(
    sale_in: sales_service.SaleCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    sale = sales_service.create_sale(db, sale_in, current_user.tenant_id)
    return {"id": sale.id, "invoice_number": sale.invoice_number, "total": sale.total_amount}

@router.post("/purchases", response_model=dict)
def create_purchase(
    purchase_in: sales_service.PurchaseCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    purchase = sales_service.create_purchase(db, purchase_in, current_user.tenant_id)
    return {"id": purchase.id, "invoice_number": purchase.invoice_number, "total": purchase.total_amount}

from fastapi.responses import StreamingResponse
from app.services.pdf_service_enhanced import generate_sale_receipt_pdf

@router.get("/sales/{sale_id}/pdf")
def get_sale_pdf(
    sale_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models import Sale, SaleItem
    from app.models.settings import Settings
    from app.api.dependencies import get_tenant_scoped_query
    
    sale = get_tenant_scoped_query(db, Sale, current_user).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Get tax rate from settings
    settings = db.query(Settings).first()
    tax_rate = settings.tax_rate if settings else 0.0
    
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
        'tax_rate': tax_rate,  # Add tax rate for percentage display
        'total_amount': sale.total_amount,
        'payment_method': sale.payment_method,
        'customer_name': sale.customer.name if sale.customer else None
    }
    
    # Pass db_session to enable Settings-based branding
    pdf_buffer = generate_sale_receipt_pdf(sale_data, db_session=db)
    
    # Save to local Invoices folder if enabled in settings
    import os
    try:
        # Re-query settings to be sure (or use the one fetched earlier if passed, but safe to fetch)
        # We fetched settings earlier for tax_rate, let's re-fetch or use if available.
        # Actually, let's just fetch fresh settings to be safe or use defaults.
        settings = db.query(Settings).first()
        
        save_locally = True
        save_path = "~/Desktop/Invoices"
        
        if settings:
            save_locally = settings.save_invoices_locally
            save_path = settings.local_invoice_path or "~/Desktop/Invoices"
            
        if save_locally:
            # Expand user path (handle ~)
            expanded_path = os.path.expanduser(save_path)
            os.makedirs(expanded_path, exist_ok=True)
            
            file_path = os.path.join(expanded_path, f"receipt_{sale.invoice_number}.pdf")
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(pdf_buffer.getvalue())
            
            print(f"Successfully saved PDF to {file_path}")
            
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
def get_purchase_pdf(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models import Purchase, PurchaseItem
    from app.api.dependencies import get_tenant_scoped_query
    purchase = get_tenant_scoped_query(db, Purchase, current_user).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
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
        'supplier_name': purchase.supplier.name if purchase.supplier else None
    }
    
    pdf_buffer = generate_purchase_receipt_pdf(purchase_data)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=purchase_{purchase.invoice_number}.pdf"}
    )

@router.get("/purchases", response_model=list)
def get_purchases(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models import Purchase
    from app.api.dependencies import get_tenant_scoped_query
    purchases = get_tenant_scoped_query(db, Purchase, current_user).order_by(Purchase.date.desc()).all()
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
def receive_purchase(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(get_current_user),
):
    purchase = sales_service.receive_purchase(db, purchase_id, current_user.tenant_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found or already received")
    return {"status": "success", "purchase_status": purchase.status}
