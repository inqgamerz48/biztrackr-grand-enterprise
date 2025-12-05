#!/usr/bin/env python3
"""
Quick script to import stock into warehouse via API
Usage: python import_stock.py
"""

import requests
import json

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"  # Change to your API URL
# API_BASE_URL = "https://biztrackr-grand-enterprise.onrender.com/api/v1"

def import_stock():
    """Import stock into warehouse"""
    
    print("📦 BizTrackr WMS Stock Import Utility")
    print("=" * 50)
    
    # Get user inputs
    warehouse_id = input("Warehouse ID (default: 1): ") or "1"
    supplier_id = input("Supplier ID: ")
    item_id = input("Item/Product ID: ")
    quantity = input("Quantity to import: ")
    bin_id = input("Bin ID (storage location): ")
    notes = input("Notes (optional): ")
    
    # Prepare request
    payload = {
        "warehouse_id": int(warehouse_id),
        "supplier_id": int(supplier_id),
        "item_id": int(item_id),
        "quantity_received": int(quantity),
        "bin_id": int(bin_id),
        "quality_check_status": "approved",
        "notes": notes
    }
    
    print("\n📤 Sending request...")
    print(json.dumps(payload, indent=2))
    
    try:
        # Make API request (you'll need to add authentication headers)
        response = requests.post(
            f"{API_BASE_URL}/wms/inward",
            json=payload,
            headers={
                "Content-Type": "application/json",
                # Add your auth token here:
                # "Authorization": "Bearer YOUR_TOKEN_HERE"
            }
        )
        
        if response.status_code in [200, 201]:
            print("\n✅ SUCCESS! Stock imported to warehouse")
            print(json.dumps(response.json(), indent=2))
            print(f"\n📊 Inventory updated: +{quantity} units")
        else:
            print(f"\n❌ ERROR {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"\n❌ Connection error: {e}")
        print("\nMake sure:")
        print("1. Backend is running")
        print("2. API URL is correct")
        print("3. You have authentication token (if required)")

def quick_setup():
    """Setup warehouse and bins for first-time users"""
    print("\n🏗️  First Time Setup")
    print("=" * 50)
    
    # Create warehouse
    warehouse_payload = {
        "name": "Main Warehouse",
        "location": "Default Location",
        "capacity": 10000.0
    }
    
    print("\n1️⃣ Creating warehouse...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/wms/warehouses",
            json=warehouse_payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            warehouse_data = response.json()
            warehouse_id = warehouse_data.get('id')
            print(f"✅ Warehouse created with ID: {warehouse_id}")
            
            # Create bins
            print("\n2️⃣ Creating storage bins...")
            bin_codes = ["A-01-01", "A-01-02", "A-02-01", "B-01-01", "B-01-02"]
            
            for bin_code in bin_codes:
                bin_payload = {
                    "bin_code": bin_code,
                    "warehouse_id": warehouse_id,
                    "capacity": 100.0
                }
                
                bin_response = requests.post(
                    f"{API_BASE_URL}/wms/bins",
                    json=bin_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if bin_response.status_code in [200, 201]:
                    bin_data = bin_response.json()
                    print(f"   ✅ Created bin: {bin_code} (ID: {bin_data.get('id')})")
                else:
                    print(f"   ❌ Failed to create bin: {bin_code}")
            
            print("\n🎉 Setup complete!")
            print(f"   Warehouse ID: {warehouse_id}")
            print(f"   Bins created: {len(bin_codes)}")
            print("\nYou can now import stock!")
        
        else:
            print(f"❌ Failed to create warehouse: {response.text}")
    
    except Exception as e:
        print(f"❌ Setup error: {e}")


if __name__ == "__main__":
    print("\nChoose an option:")
    print("1. Import stock")
    print("2. First-time setup (create warehouse & bins)")
    print("3. Exit")
    
    choice = input("\nEnter choice (1-3): ")
    
    if choice == "1":
        import_stock()
    elif choice == "2":
        quick_setup()
    else:
        print("Goodbye! 👋")
