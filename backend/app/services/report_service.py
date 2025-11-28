import pandas as pd
import io
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.models import InventoryItem as Item, Sale, Purchase, Expense, SaleItem, PurchaseItem, Category, ExpenseCategory
from fastapi import UploadFile, HTTPException

def export_inventory_csv(db: Session, tenant_id: int):
    items = db.query(Item).filter(Item.tenant_id == tenant_id).all()
    df = pd.DataFrame([vars(i) for i in items])
    if '_sa_instance_state' in df.columns:
        del df['_sa_instance_state']
    
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    return stream.getvalue()

async def import_inventory(db: Session, file: UploadFile, tenant_id: int):
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        added_count = 0
        for _, row in df.iterrows():
            # Basic logic
            item = Item(
                name=row.get('Name'),
                quantity=row.get('Quantity', 0),
                selling_price=row.get('Price', 0),
                tenant_id=tenant_id
            )
            db.add(item)
            added_count += 1
        
        db.commit()
        return {"message": f"Imported {added_count} items"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def export_sales_csv(db: Session, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Export sales data to CSV"""
    query = db.query(Sale).filter(Sale.tenant_id == tenant_id)
    
    if start_date:
        query = query.filter(Sale.date >= start_date)
    if end_date:
        query = query.filter(Sale.date <= end_date)
    
    sales = query.all()
    
    data = []
    for sale in sales:
        data.append({
            'Invoice Number': sale.invoice_number,
            'Date': sale.date.strftime('%Y-%m-%d %H:%M:%S'),
            'Customer': sale.customer.name if sale.customer else 'Walk-in',
            'Total Amount': sale.total_amount,
            'Discount': sale.discount,
            'Payment Method': sale.payment_method
        })
    
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    return stream.getvalue()

def export_purchases_csv(db: Session, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Export purchases data to CSV"""
    query = db.query(Purchase).filter(Purchase.tenant_id == tenant_id)
    
    if start_date:
        query = query.filter(Purchase.date >= start_date)
    if end_date:
        query = query.filter(Purchase.date <= end_date)
    
    purchases = query.all()
    
    data = []
    for purchase in purchases:
        data.append({
            'Invoice Number': purchase.invoice_number,
            'Date': purchase.date.strftime('%Y-%m-%d %H:%M:%S'),
            'Supplier': purchase.supplier.name if purchase.supplier else 'N/A',
            'Total Amount': purchase.total_amount,
            'Transport Charges': purchase.transport_charges
        })
    
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    return stream.getvalue()

def export_expenses_csv(db: Session, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Export expenses data to CSV"""
    query = db.query(Expense).filter(Expense.tenant_id == tenant_id)
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    expenses = query.all()
    
    data = []
    for expense in expenses:
        data.append({
            'Date': expense.date.strftime('%Y-%m-%d'),
            'Category': expense.category.value,
            'Amount': expense.amount,
            'Description': expense.description or ''
        })
    
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    return stream.getvalue()

def get_sales_analytics(db: Session, tenant_id: int, days: int = 30):
    """Get sales analytics for the last N days"""
    from sqlalchemy import func
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Daily sales
    daily_sales = db.query(
        func.date(Sale.date).label('date'),
        func.sum(Sale.total_amount).label('total'),
        func.count(Sale.id).label('count')
    ).filter(
        Sale.tenant_id == tenant_id,
        Sale.date >= start_date,
        Sale.date <= end_date
    ).group_by(func.date(Sale.date)).all()
    
    return {
        'daily_sales': [
            {
                'date': str(date),
                'total': float(total) if total else 0.0,
                'count': count
            }
            for date, total, count in daily_sales
        ]
    }

def get_inventory_valuation(db: Session, tenant_id: int):
    """Calculate total inventory value"""
    from sqlalchemy import func
    
    result = db.query(
        func.sum(Item.quantity * Item.purchase_price).label('purchase_value'),
        func.sum(Item.quantity * Item.selling_price).label('selling_value'),
        func.count(Item.id).label('total_items'),
        func.sum(Item.quantity).label('total_quantity')
    ).filter(Item.tenant_id == tenant_id).first()
    
    return {
        'purchase_value': float(result.purchase_value) if result.purchase_value else 0.0,
        'selling_value': float(result.selling_value) if result.selling_value else 0.0,
        'total_items': result.total_items or 0,
        'total_quantity': result.total_quantity or 0
    }

def get_profit_loss_data(db: Session, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Calculate profit and loss metrics"""
    from sqlalchemy import func
    
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    # Total Revenue (Sales)
    revenue = db.query(func.sum(Sale.total_amount)).filter(
        Sale.tenant_id == tenant_id,
        Sale.date >= start_date,
        Sale.date <= end_date
    ).scalar() or 0.0
    
    # Cost of Goods Sold (Purchases)
    cogs = db.query(func.sum(Purchase.total_amount)).filter(
        Purchase.tenant_id == tenant_id,
        Purchase.date >= start_date,
        Purchase.date <= end_date
    ).scalar() or 0.0
    
    # Operating Expenses
    expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.tenant_id == tenant_id,
        Expense.date >= start_date,
        Expense.date <= end_date
    ).scalar() or 0.0
    
    gross_profit = revenue - cogs
    net_profit = gross_profit - expenses
    
    return {
        'revenue': float(revenue),
        'cost_of_goods_sold': float(cogs),
        'gross_profit': float(gross_profit),
        'operating_expenses': float(expenses),
        'net_profit': float(net_profit),
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat()
    }

def get_inventory_category_analytics(db: Session, tenant_id: int):
    """Get inventory distribution by category"""
    from sqlalchemy import func
    
    results = db.query(
        Category.name,
        func.count(Item.id).label('count'),
        func.sum(Item.quantity * Item.selling_price).label('value')
    ).join(Item, Item.category_id == Category.id)\
    .filter(Item.tenant_id == tenant_id)\
    .group_by(Category.name).all()
    
    return [
        {
            "name": name,
            "count": count,
            "value": float(value) if value else 0.0
        }
        for name, count, value in results
    ]

def get_expense_category_analytics(db: Session, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Get expense distribution by category"""
    from sqlalchemy import func
    
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
        
    results = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.tenant_id == tenant_id,
        Expense.date >= start_date,
        Expense.date <= end_date
    ).group_by(Expense.category).all()
    
    return [
        {
            "name": category.value if hasattr(category, 'value') else str(category),
            "value": float(total) if total else 0.0
        }
        for category, total in results
    ]
