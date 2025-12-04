from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, desc, select
from app.models import Sale, InventoryItem as Item, Customer, Supplier
import pandas as pd
from datetime import datetime, timedelta
import re

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

async def generate_forecast(db: AsyncSession, tenant_id: int, days: int = 30):
    if not PROPHET_AVAILABLE:
        return {"error": "Prophet library not available"}

    # Fetch historical sales
    result = await db.execute(
        select(
            func.date(Sale.date).label("ds"), 
            func.sum(Sale.total_amount).label("y")
        )
        .filter(Sale.tenant_id == tenant_id)
        .group_by(func.date(Sale.date))
    )
    sales_data = result.all()
    
    if len(sales_data) < 5:
        return {"message": "Not enough data for forecasting (need at least 5 days)"}

    df = pd.DataFrame(sales_data, columns=["ds", "y"])
    
    m = Prophet()
    m.fit(df)
    
    future = m.make_future_dataframe(periods=days)
    forecast = m.predict(future)
    
    return forecast.tail(days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient="records")

async def get_insights(db: AsyncSession, tenant_id: int):
    insights = []
    
    # 1. Low Stock Alert
    result = await db.execute(
        select(Item).filter(
            Item.tenant_id == tenant_id, 
            Item.quantity <= Item.min_stock
        ).limit(3)
    )
    low_stock = result.scalars().all()
    
    if low_stock:
        items_str = ", ".join([i.name for i in low_stock])
        insights.append(f"⚠️ Low stock alert: {items_str}. Consider restocking soon.")

    # 2. Top Customer
    result = await db.execute(
        select(
            Customer.name, 
            func.sum(Sale.total_amount).label('total')
        )
        .join(Sale)
        .filter(Sale.tenant_id == tenant_id)
        .group_by(Customer.id)
        .order_by(desc('total'))
        .limit(1)
    )
    top_customer = result.first()
    
    if top_customer:
        insights.append(f"🏆 Top customer: {top_customer[0]} (Total purchases: ₹{top_customer[1]:,.2f})")
    
    return insights

async def process_chat_message(db: AsyncSession, tenant_id: int, message: str):
    msg = message.lower()
    
    # 1. Sales Queries
    if "sales" in msg or "sold" in msg or "revenue" in msg:
        if "today" in msg:
            start = datetime.now().replace(hour=0, minute=0, second=0)
            result = await db.execute(
                select(func.sum(Sale.total_amount)).filter(
                    Sale.tenant_id == tenant_id, Sale.date >= start
                )
            )
            total = result.scalar() or 0
            return f"💰 Total sales today: ₹{total:,.2f}"
        
        elif "week" in msg:
            start = datetime.now() - timedelta(days=7)
            result = await db.execute(
                select(func.sum(Sale.total_amount)).filter(
                    Sale.tenant_id == tenant_id, Sale.date >= start
                )
            )
            total = result.scalar() or 0
            return f"💰 Total sales this week: ₹{total:,.2f}"
            
        elif "month" in msg:
            start = datetime.now() - timedelta(days=30)
            result = await db.execute(
                select(func.sum(Sale.total_amount)).filter(
                    Sale.tenant_id == tenant_id, Sale.date >= start
                )
            )
            total = result.scalar() or 0
            return f"💰 Total sales last 30 days: ₹{total:,.2f}"
            
        else:
            result = await db.execute(
                select(func.sum(Sale.total_amount)).filter(
                    Sale.tenant_id == tenant_id
                )
            )
            total = result.scalar() or 0
            return f"💰 Total lifetime sales: ₹{total:,.2f}"

    # 2. Inventory Queries
    if "stock" in msg or "inventory" in msg or "have" in msg:
        if "low" in msg:
            result = await db.execute(
                select(Item).filter(
                    Item.tenant_id == tenant_id, Item.quantity <= Item.min_stock
                )
            )
            items = result.scalars().all()
            if not items:
                return "✅ All items are well stocked!"
            return "⚠️ Low stock items:\n" + "\n".join([f"- {i.name}: {i.quantity}" for i in items])
        
        # Search for specific item
        # Extract potential item name (simple heuristic: words after 'have' or 'stock for')
        result = await db.execute(
            select(func.count()).select_from(Item).filter(Item.tenant_id == tenant_id)
        )
        count = result.scalar()
        return f"📦 You have {count} unique items in inventory."

    # 3. Customer Queries
    if "customer" in msg or "owe" in msg:
        if "best" in msg or "top" in msg:
            result = await db.execute(
                select(Customer.name, func.sum(Sale.total_amount).label('t'))
                .join(Sale)
                .filter(Sale.tenant_id == tenant_id)
                .group_by(Customer.id)
                .order_by(desc('t'))
                .limit(1)
            )
            top = result.first()
            if top:
                return f"🏆 Best customer is {top[0]} with ₹{top[1]:,.2f} in purchases."
            return "No sales data found."
            
        if "owe" in msg or "balance" in msg:
            result = await db.execute(
                select(Customer).filter(
                    Customer.tenant_id == tenant_id, Customer.outstanding_balance > 0
                ).order_by(desc(Customer.outstanding_balance)).limit(5)
            )
            debtors = result.scalars().all()
            if not debtors:
                return "✅ No customers owe money!"
            return "💸 Top outstanding balances:\n" + "\n".join([f"- {c.name}: ₹{c.outstanding_balance:,.2f}" for c in debtors])

    # 4. Help / Greeting
    if "hi" in msg or "hello" in msg or "help" in msg:
        return (
            "👋 Hi! I'm BizBot. Ask me things like:\n"
            "- How much did we sell today?\n"
            "- Show me low stock items.\n"
            "- Who is my best customer?\n"
            "- Who owes money?"
        )

    return "🤔 I didn't quite catch that. Try asking about 'sales', 'stock', or 'customers'."
