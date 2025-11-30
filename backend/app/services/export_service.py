import csv
import io
from typing import List, Dict
from datetime import datetime

class ExportService:
    @staticmethod
    def generate_csv(data: List[Dict], filename: str = "export"):
        if not data:
            return None
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue()

    @staticmethod
    def generate_monthly_report(sales_data: List[Dict], expense_data: List[Dict]):
        # Combine data into a summary report
        summary = {
            "generated_at": datetime.now().isoformat(),
            "total_sales": sum(s['amount'] for s in sales_data),
            "total_expenses": sum(e['amount'] for e in expense_data),
            "net_profit": sum(s['amount'] for s in sales_data) - sum(e['amount'] for e in expense_data)
        }
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Metric", "Value"])
        for key, value in summary.items():
            writer.writerow([key, value])
            
        writer.writerow([])
        writer.writerow(["Sales Breakdown"])
        if sales_data:
            writer.writerow(sales_data[0].keys())
            for item in sales_data:
                writer.writerow(item.values())
                
        writer.writerow([])
        writer.writerow(["Expense Breakdown"])
        if expense_data:
            writer.writerow(expense_data[0].keys())
            for item in expense_data:
                writer.writerow(item.values())
                
        return output.getvalue()
