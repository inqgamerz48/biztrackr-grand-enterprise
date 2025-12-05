"""
Seed script to populate sample warehouse data for testing WMS module
Run this after migrations to get started with demo data.
"""
import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.warehouse import (
    Warehouse, WarehouseZone, WarehouseBin, BinStock,
    StockMovement, InwardLog, OutwardLog, DemandHistory
)
from app.models.inventory import InventoryItem
from app.models.crm import Supplier, Customer
from app.models.user import User

async def seed_wms_data():
    """Seed sample WMS data for demo purposes"""
    
    # Create async engine
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Get first tenant (for demo)
        from sqlalchemy import select
        result = await db.execute(select(User).limit(1))
        first_user = result.scalar_one_or_none()
        
        if not first_user:
            print("❌ No users found. Please create a user first.")
            return
        
        tenant_id = first_user.tenant_id
        user_id = first_user.id
        
        print(f"✅ Seeding WMS data for Tenant ID: {tenant_id}")
        
        # 1. Create Main Warehouse
        warehouse = Warehouse(
            name="Main Distribution Center",
            location="New York, NY 10001",
            capacity=10000.0,
            tenant_id=tenant_id
        )
        db.add(warehouse)
        await db.commit()
        await db.refresh(warehouse)
        print(f"✅ Created warehouse: {warehouse.name}")
        
        # 2. Create Zones
        zones = [
            WarehouseZone(
                name="Fast Pick Zone A",
                zone_type="fast-pick",
                warehouse_id=warehouse.id,
                tenant_id=tenant_id
            ),
            WarehouseZone(
                name="Bulk Storage Zone B",
                zone_type="bulk",
                warehouse_id=warehouse.id,
                tenant_id=tenant_id
            ),
            WarehouseZone(
                name="Cold Storage Zone C",
                zone_type="cold-storage",
                warehouse_id=warehouse.id,
                tenant_id=tenant_id
            ),
            WarehouseZone(
                name="Staging Zone D",
                zone_type="staging",
                warehouse_id=warehouse.id,
                tenant_id=tenant_id
            )
        ]
        for zone in zones:
            db.add(zone)
        await db.commit()
        print(f"✅ Created {len(zones)} zones")
        
        # 3. Create Bins (10 bins per zone)
        bins = []
        for zone in zones:
            await db.refresh(zone)
            for rack in range(1, 4):  # 3 racks per zone
                for position in range(1, 4):  # 3 positions per rack
                    bin_code = f"{zone.name[0]}-{rack:02d}-{position:02d}"
                    bin = WarehouseBin(
                        bin_code=bin_code,
                        zone_id=zone.id,
                        capacity=100.0,
                        current_load=random.uniform(0, 80),
                        tenant_id=tenant_id
                    )
                    bins.append(bin)
                    db.add(bin)
        await db.commit()
        print(f"✅ Created {len(bins)} bins")
        
        # 4. Get existing inventory items
        result = await db.execute(
            select(InventoryItem).where(InventoryItem.tenant_id == tenant_id).limit(20)
        )
        items = result.scalars().all()
        
        if not items:
            print("⚠️  No inventory items found. Creating sample items...")
            # Create sample items if none exist
            for i in range(20):
                item = InventoryItem(
                    name=f"Product {chr(65+i)}",
                    barcode=f"SKU-{1000+i}",
                    quantity=random.randint(10, 500),
                    min_stock=random.randint(10, 50),
                    mrp=random.uniform(10, 100),
                    purchase_price=random.uniform(5, 50),
                    selling_price=random.uniform(8, 80),
                    tenant_id=tenant_id
                )
                items.append(item)
                db.add(item)
            await db.commit()
            print(f"✅ Created {len(items)} sample inventory items")
        
        # 5. Distribute stock across bins
        for item in items:
            await db.refresh(item)
            # Assign to 1-3 random bins
            num_bins = random.randint(1, 3)
            selected_bins = random.sample(bins, num_bins)
            
            for bin in selected_bins:
                await db.refresh(bin)
                quantity = random.randint(5, 50)
                bin_stock = BinStock(
                    bin_id=bin.id,
                    item_id=item.id,
                    quantity=quantity,
                    tenant_id=tenant_id
                )
                db.add(bin_stock)
        await db.commit()
        print(f"✅ Distributed stock across bins")
        
        # 6. Get suppliers
        result = await db.execute(
            select(Supplier).where(Supplier.tenant_id == tenant_id).limit(5)
        )
        suppliers = result.scalars().all()
        
        if not suppliers:
            print("⚠️  No suppliers found. Creating sample suppliers...")
            for i in range(5):
                supplier = Supplier(
                    name=f"Supplier {chr(65+i)}",
                    email=f"supplier{chr(65+i).lower()}@example.com",
                    phone=f"+1-555-{1000+i}",
                    tenant_id=tenant_id
                )
                suppliers.append(supplier)
                db.add(supplier)
            await db.commit()
            print(f"✅ Created {len(suppliers)} sample suppliers")
        
        # 7. Get customers
        result = await db.execute(
            select(Customer).where(Customer.tenant_id == tenant_id).limit(10)
        )
        customers = result.scalars().all()
        
        if not customers:
            print("⚠️  No customers found. Creating sample customers...")
            for i in range(10):
                customer = Customer(
                    name=f"Customer {chr(65+i)}",
                    email=f"customer{chr(65+i).lower()}@example.com",
                    phone=f"+1-555-{2000+i}",
                    tenant_id=tenant_id
                )
                customers.append(customer)
                db.add(customer)
            await db.commit()
            print(f"✅ Created {len(customers)} sample customers")
        
        # 8. Create inward logs (last 30 days)
        print("📦 Creating inward logs...")
        for i in range(50):
            item = random.choice(items)
            supplier = random.choice(suppliers)
            bin = random.choice(bins)
            await db.refresh(item)
            await db.refresh(supplier)
            await db.refresh(bin)
            
            inward = InwardLog(
                warehouse_id=warehouse.id,
                supplier_id=supplier.id,
                item_id=item.id,
                quantity_received=random.randint(20, 200),
                bin_id=bin.id,
                received_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                quality_check_status=random.choice(["approved", "approved", "approved", "pending", "rejected"]),
                tenant_id=tenant_id
            )
            db.add(inward)
        await db.commit()
        print(f"✅ Created 50 inward logs")
        
        # 9. Create outward logs (last 30 days)
        print("📤 Creating outward logs...")
        for i in range(100):
            item = random.choice(items)
            customer = random.choice(customers)
            bin = random.choice(bins)
            await db.refresh(item)
            await db.refresh(customer)
            await db.refresh(bin)
            
            outward = OutwardLog(
                warehouse_id=warehouse.id,
                customer_id=customer.id,
                item_id=item.id,
                quantity_picked=random.randint(1, 20),
                bin_id=bin.id,
                picked_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                picked_by=user_id,
                status=random.choice(["picked", "packed", "shipped", "pending"]),
                tenant_id=tenant_id
            )
            db.add(outward)
        await db.commit()
        print(f"✅ Created 100 outward logs")
        
        # 10. Create demand history (last 60 days)
        print("📊 Creating demand history...")
        for item in items:
            await db.refresh(item)
            for day in range(60):
                demand = DemandHistory(
                    item_id=item.id,
                    date=datetime.utcnow() - timedelta(days=day),
                    quantity_sold=random.randint(0, 20),
                    tenant_id=tenant_id
                )
                db.add(demand)
        await db.commit()
        print(f"✅ Created demand history for 60 days")
        
        # 11. Create stock movements (last 30 days)
        print("🔄 Creating stock movements...")
        for i in range(30):
            item = random.choice(items)
            from_bin = random.choice(bins)
            to_bin = random.choice([b for b in bins if b.id != from_bin.id])
            await db.refresh(item)
            await db.refresh(from_bin)
            await db.refresh(to_bin)
            
            movement = StockMovement(
                item_id=item.id,
                warehouse_id=warehouse.id,
                from_bin_id=from_bin.id,
                to_bin_id=to_bin.id,
                quantity=random.randint(5, 30),
                movement_type=random.choice(["transfer", "adjustment"]),
                reason="Optimization" if random.random() > 0.5 else "Rebalancing",
                moved_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                moved_by=user_id,
                tenant_id=tenant_id
            )
            db.add(movement)
        await db.commit()
        print(f"✅ Created 30 stock movements")
        
        print("\n" + "="*60)
        print("🎉 WMS DEMO DATA SEEDING COMPLETED!")
        print("="*60)
        print(f"📍 Warehouse: {warehouse.name}")
        print(f"🏢 Zones: {len(zones)}")
        print(f"📦 Bins: {len(bins)}")
        print(f"📊 Items: {len(items)}")
        print(f"🏭 Suppliers: {len(suppliers)}")
        print(f"👥 Customers: {len(customers)}")
        print("\n✨ You can now access the WMS dashboard at /dashboard/wms")
        print("="*60)


if __name__ == "__main__":
    asyncio.run(seed_wms_data())
