import pandas as pd
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import Optional
from app.models import InventoryItem as Item, Sale, Purchase, Expense, SaleItem, PurchaseItem, Category, ExpenseCategory
from fastapi import UploadFile, HTTPException
from sqlalchemy import func

async def export_inventory_csv(db: AsyncSession, tenant_id: int):
    result = await db.execute(select(Item).filter(Item.tenant_id == tenant_id))
    items = result.scalars().all()
    df = pd.DataFrame([vars(i) for i in items])
    if '_sa_instance_state' in df.columns:
        del df['_sa_instance_state']
    
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    return stream.getvalue()

async def import_inventory(db: AsyncSession, file: UploadFile, tenant_id: int):
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
        
        await db.commit()
        return {"message": f"Imported {added_count} items"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def export_sales_csv(db: AsyncSession, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Export sales data to CSV"""
    stmt = select(Sale).options(selectinload(Sale.customer)).filter(Sale.tenant_id == tenant_id)
    
    if start_date:
        stmt = stmt.filter(Sale.date >= start_date)
    if end_date:
        stmt = stmt.filter(Sale.date <= end_date)
    
    result = await db.execute(stmt)
    sales = result.scalars().all()
    
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

async def export_purchases_csv(db: AsyncSession, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Export purchases data to CSV"""
    stmt = select(Purchase).options(selectinload(Purchase.supplier)).filter(Purchase.tenant_id == tenant_id)
    
    if start_date:
        stmt = stmt.filter(Purchase.date >= start_date)
    if end_date:
        stmt = stmt.filter(Purchase.date <= end_date)
    
    result = await db.execute(stmt)
    purchases = result.scalars().all()
    
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

async def export_expenses_csv(db: AsyncSession, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Export expenses data to CSV"""
    stmt = select(Expense).filter(Expense.tenant_id == tenant_id)
    
    if start_date:
        stmt = stmt.filter(Expense.date >= start_date)
    if end_date:
        stmt = stmt.filter(Expense.date <= end_date)
    
    result = await db.execute(stmt)
    expenses = result.scalars().all()
    
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

async def get_sales_analytics(db: AsyncSession, tenant_id: int, days: int = 30):
    """Get sales analytics for the last N days"""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Daily sales
    result = await db.execute(
        select(
            func.date(Sale.date).label('date'),
            func.sum(Sale.total_amount).label('total'),
            func.count(Sale.id).label('count')
        ).filter(
            Sale.tenant_id == tenant_id,
            Sale.date >= start_date,
            Sale.date <= end_date
        ).group_by(func.date(Sale.date))
    )
    daily_sales = result.all()
    
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

async def get_inventory_valuation(db: AsyncSession, tenant_id: int):
    """Calculate total inventory value"""
    
    result = await db.execute(
        select(
            func.sum(Item.quantity * Item.purchase_price).label('purchase_value'),
            func.sum(Item.quantity * Item.selling_price).label('selling_value'),
            func.count(Item.id).label('total_items'),
            func.sum(Item.quantity).label('total_quantity')
        ).filter(Item.tenant_id == tenant_id)
    )
    res = result.first()
    
    return {
        'purchase_value': float(res.purchase_value) if res.purchase_value else 0.0,
        'selling_value': float(res.selling_value) if res.selling_value else 0.0,
        'total_items': res.total_items or 0,
        'total_quantity': res.total_quantity or 0
    }

async def get_profit_loss_data(db: AsyncSession, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Calculate profit and loss metrics"""
    
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    # Total Revenue (Sales)
    result = await db.execute(
        select(func.sum(Sale.total_amount)).filter(
            Sale.tenant_id == tenant_id,
            Sale.date >= start_date,
            Sale.date <= end_date
        )
    )
    revenue = result.scalar() or 0.0
    
    # Cost of Goods Sold (Purchases)
    result = await db.execute(
        select(func.sum(Purchase.total_amount)).filter(
            Purchase.tenant_id == tenant_id,
            Purchase.date >= start_date,
            Purchase.date <= end_date
        )
    )
    cogs = result.scalar() or 0.0
    
    # Operating Expenses
    result = await db.execute(
        select(func.sum(Expense.amount)).filter(
            Expense.tenant_id == tenant_id,
            Expense.date >= start_date,
            Expense.date <= end_date
        )
    )
    expenses = result.scalar() or 0.0
    
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

async def get_inventory_category_analytics(db: AsyncSession, tenant_id: int):
    """Get inventory distribution by category"""
    
    result = await db.execute(
        select(
            Category.name,
            func.count(Item.id).label('count'),
            func.sum(Item.quantity * Item.selling_price).label('value')
        ).join(Item, Item.category_id == Category.id)\
        .filter(Item.tenant_id == tenant_id)\
        .group_by(Category.name)
    )
    results = result.all()
    
    return [
        {
            "name": name,
            "count": count,
            "value": float(value) if value else 0.0
        }
        for name, count, value in results
    ]

async def get_expense_category_analytics(db: AsyncSession, tenant_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Get expense distribution by category"""
    
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
        
    result = await db.execute(
        select(
            Expense.category,
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.tenant_id == tenant_id,
            Expense.date >= start_date,
            Expense.date <= end_date
        ).group_by(Expense.category)
    )
    results = result.all()
    
    return [
        {
            "name": category.value if hasattr(category, 'value') else str(category),
            "value": float(total) if total else 0.0
        }
        for category, total in results
    ]
