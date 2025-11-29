from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Sale, SaleItem, InventoryItem, Category
from datetime import datetime, timedelta
from typing import List, Dict, Any

class AnalyticsService:
    def get_sales_trends(self, db: Session, tenant_id: int, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get daily sales totals for the last N days.
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query sales grouped by date
        # Note: SQLite and PostgreSQL have different date truncation functions.
        # Assuming PostgreSQL for production, but using a generic approach for compatibility if possible.
        # For simplicity in this environment (likely SQLite or simple Postgres), we'll fetch and process in Python if volume is low,
        # or use SQLAlchemy's func.date() which works in SQLite.
        
        sales = db.query(
            func.date(Sale.date).label('date'),
            func.sum(Sale.total_amount).label('total')
        ).filter(
            Sale.tenant_id == tenant_id,
            Sale.date >= start_date
        ).group_by(
            func.date(Sale.date)
        ).order_by(
            func.date(Sale.date)
        ).all()
        
        # Format results
        results = {str(s.date): s.total for s in sales}
        
        # Fill in missing days with 0
        final_data = []
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            final_data.append({
                "date": date_str,
                "total": results.get(date_str, 0.0)
            })
            current_date += timedelta(days=1)
            
        return final_data

    def get_top_selling_items(self, db: Session, tenant_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get top selling items by quantity.
        """
        top_items = db.query(
            InventoryItem.name,
            func.sum(SaleItem.quantity).label('total_quantity'),
            func.sum(SaleItem.total).label('total_revenue')
        ).join(
            SaleItem, SaleItem.item_id == InventoryItem.id
        ).join(
            Sale, Sale.id == SaleItem.sale_id
        ).filter(
            Sale.tenant_id == tenant_id
        ).group_by(
            InventoryItem.id, InventoryItem.name
        ).order_by(
            desc('total_quantity')
        ).limit(limit).all()
        
        return [
            {"name": item.name, "quantity": item.total_quantity, "revenue": item.total_revenue}
            for item in top_items
        ]

    def get_category_distribution(self, db: Session, tenant_id: int) -> List[Dict[str, Any]]:
        """
        Get sales distribution by category.
        """
        distribution = db.query(
            Category.name,
            func.sum(SaleItem.total).label('total_revenue')
        ).join(
            InventoryItem, InventoryItem.category_id == Category.id
        ).join(
            SaleItem, SaleItem.item_id == InventoryItem.id
        ).join(
            Sale, Sale.id == SaleItem.sale_id
        ).filter(
            Sale.tenant_id == tenant_id
        ).group_by(
            Category.id, Category.name
        ).all()
        
        return [
            {"name": cat.name, "value": cat.total_revenue}
            for cat in distribution
        ]

    def get_dashboard_summary(self, db: Session, tenant_id: int) -> Dict[str, Any]:
        """
        Get high-level summary stats (Total Sales, Total Orders, etc.)
        """
        total_sales = db.query(func.sum(Sale.total_amount)).filter(Sale.tenant_id == tenant_id).scalar() or 0.0
        total_orders = db.query(func.count(Sale.id)).filter(Sale.tenant_id == tenant_id).scalar() or 0
        
        # Calculate growth (compare to previous period) - skipped for brevity, returning basics
        
        return {
            "total_sales": total_sales,
            "total_orders": total_orders,
            "average_order_value": total_sales / total_orders if total_orders > 0 else 0
        }

analytics_service = AnalyticsService()
