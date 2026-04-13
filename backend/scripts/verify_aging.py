import requests
import sys
import datetime
from dotenv import load_dotenv
import os

# Load env before importing settings
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.sales import Sale
from app.models.crm import Customer
from app.models.tenant import Tenant
from app.models.user import User

# Setup DB connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    try:
        response = requests.post(f"{BASE_URL}/auth/login/access-token", data={"username": email, "password": password})
        if response.status_code == 200:
            return response.json()["access_token"]
        print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Connection failed: {e}")
    return None

def seed_aging_data(db):
    print("Seeding aging data...")
    # Get admin user to find tenant
    admin = db.query(User).filter(User.email == "admin@biztrackr.com").first()
    if not admin:
        print("Admin user not found")
        return False
    
    tenant_id = admin.tenant_id
    
    # Create a test customer
    customer = Customer(
        name="Aging Test Customer",
        phone="555-0199",
        email="aging@test.com",
        tenant_id=tenant_id
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    today = datetime.datetime.utcnow()
    
    # Create sales with different due dates
    sales_data = [
        # 0-30 days overdue (due 15 days ago)
        {"due": today - datetime.timedelta(days=15), "amount": 100.0, "bucket": "0-30"},
        # 31-60 days overdue (due 45 days ago)
        {"due": today - datetime.timedelta(days=45), "amount": 200.0, "bucket": "31-60"},
        # 61-90 days overdue (due 75 days ago)
        {"due": today - datetime.timedelta(days=75), "amount": 300.0, "bucket": "61-90"},
        # 90+ days overdue (due 100 days ago)
        {"due": today - datetime.timedelta(days=100), "amount": 400.0, "bucket": "90+"}
    ]
    
    for item in sales_data:
        sale = Sale(
            invoice_number=f"INV-AGING-{item['bucket']}",
            date=item['due'] - datetime.timedelta(days=30), # Sale date 30 days before due
            due_date=item['due'],
            total_amount=item['amount'],
            amount_paid=0.0,
            payment_status="pending",
            customer_id=customer.id,
            tenant_id=tenant_id
        )
        db.add(sale)
    
    db.commit()
    print("Seeding complete.")
    return True

def verify_aging_report():
    # 1. Seed Data
    db = SessionLocal()
    if not seed_aging_data(db):
        return
    db.close()
    
    # 2. Login
    print("Logging in...")
    token = login("admin@biztrackr.com", "admin123")
    if not token: sys.exit(1)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Fetch Report
    print("Fetching Aging Report...")
    resp = requests.get(f"{BASE_URL}/aging/receivables", headers=headers)
    
    if resp.status_code != 200:
        print(f"FAIL: API returned {resp.status_code}")
        print(resp.text)
        return

    data = resp.json()
    details = data.get("details", [])
    
    # Find our test customer
    test_customer = next((c for c in details if c["customer_name"] == "Aging Test Customer"), None)
    
    if not test_customer:
        print("FAIL: Test customer not found in report")
        return
        
    print("Verifying buckets...")
    # Check values
    if test_customer["0-30"] == 100.0:
        print("PASS: 0-30 bucket correct")
    else:
        print(f"FAIL: 0-30 bucket expected 100.0, got {test_customer['0-30']}")

    if test_customer["31-60"] == 200.0:
        print("PASS: 31-60 bucket correct")
    else:
        print(f"FAIL: 31-60 bucket expected 200.0, got {test_customer['31-60']}")

    if test_customer["61-90"] == 300.0:
        print("PASS: 61-90 bucket correct")
    else:
        print(f"FAIL: 61-90 bucket expected 300.0, got {test_customer['61-90']}")

    if test_customer["90+"] == 400.0:
        print("PASS: 90+ bucket correct")
    else:
        print(f"FAIL: 90+ bucket expected 400.0, got {test_customer['90+']}")

    if test_customer["total_due"] == 1000.0:
        print("PASS: Total due correct")
    else:
        print(f"FAIL: Total due expected 1000.0, got {test_customer['total_due']}")

if __name__ == "__main__":
    verify_aging_report()
