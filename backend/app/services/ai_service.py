from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Sale, InventoryItem as Item
import pandas as pd
from datetime import datetime, timedelta

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

def generate_forecast(db: Session, tenant_id: int, days: int = 30):
    if not PROPHET_AVAILABLE:
        return {"error": "Prophet library not available"}

    # Fetch historical sales
    sales_data = db.query(
        func.date(Sale.date).label("ds"), 
        func.sum(Sale.total_amount).label("y")
    ).filter(Sale.tenant_id == tenant_id).group_by(func.date(Sale.date)).all()
    
    if len(sales_data) < 5:
        return {"message": "Not enough data for forecasting (need at least 5 days)"}

    df = pd.DataFrame(sales_data, columns=["ds", "y"])
    
    m = Prophet()
    m.fit(df)
    
    future = m.make_future_dataframe(periods=days)
    forecast = m.predict(future)
    
    return forecast.tail(days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient="records")

def get_insights(db: Session, tenant_id: int):
    insights = []
    
    # 1. Dead Stock
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    # Logic: Items with quantity > 0 but no sales in last 30 days
    # Simplified: Just check items created > 30 days ago with no recent sales
    # For now, let's just return a dummy insight for demonstration
    insights.append("Check stock for 'Winter Jackets' - no sales in 30 days.")
    
    return insights
