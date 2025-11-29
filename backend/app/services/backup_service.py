import csv
import io
from sqlalchemy.orm import Session
from app.models import InventoryItem, Sale, Customer, User
from typing import List

class BackupService:
    def export_inventory_csv(self, db: Session, tenant_id: int) -> io.StringIO:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['ID', 'Name', 'Category', 'Quantity', 'Unit', 'Purchase Price', 'Selling Price', 'Min Stock Level', 'Location'])
        
        # Data
        items = db.query(InventoryItem).filter(InventoryItem.tenant_id == tenant_id).all()
        for item in items:
            writer.writerow([
                item.id,
                item.name,
                item.category.name if item.category else '',
                item.quantity,
                item.unit,
                item.purchase_price,
                item.selling_price,
                item.min_stock_level,
                item.location
            ])
            
        output.seek(0)
        return output

    def export_sales_csv(self, db: Session, tenant_id: int) -> io.StringIO:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['ID', 'Invoice Number', 'Date', 'Customer', 'Total Amount', 'Tax Amount', 'Discount', 'Payment Method'])
        
        # Data
        sales = db.query(Sale).filter(Sale.tenant_id == tenant_id).order_by(Sale.date.desc()).all()
        for sale in sales:
            writer.writerow([
                sale.id,
                sale.invoice_number,
                sale.date,
                sale.customer.name if sale.customer else 'Walk-in',
                sale.total_amount,
                sale.tax_amount,
                sale.discount,
                sale.payment_method
            ])
            
        output.seek(0)
        return output

    def export_customers_csv(self, db: Session, tenant_id: int) -> io.StringIO:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['ID', 'Name', 'Email', 'Phone', 'Address', 'Outstanding Balance'])
        
        # Data
        customers = db.query(Customer).filter(Customer.tenant_id == tenant_id).all()
        for customer in customers:
            writer.writerow([
                customer.id,
                customer.name,
                customer.email,
                customer.phone,
                customer.address,
                customer.outstanding_balance
            ])
            
        output.seek(0)
        return output

backup_service = BackupService()
