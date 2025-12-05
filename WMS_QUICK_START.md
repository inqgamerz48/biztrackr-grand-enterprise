# 🚀 WMS Module - Quick Start Guide

## What is the WMS Module?

The **Warehouse Management System (WMS)** module is an enterprise-grade AI-powered warehouse intelligence platform that provides:

- 📊 **Real-time warehouse analytics**
- 🤖 **AI-powered reorder recommendations**
- 📦 **Bin location optimization**
- ⚠️ **Anomaly detection**
- 🎯 **Performance metrics & KPIs**
- 📈 **Demand forecasting**

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Apply Database Migration

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Add WMS tables"

# Apply migration
alembic upgrade head
```

### Step 2: Seed Demo Data (Optional but Recommended)

```bash
# Still in /backend directory
python seed_wms_demo.py
```

This will create:
- ✅ 1 Main warehouse
- ✅ 4 Zones (Fast-pick, Bulk, Cold-storage, Staging)
- ✅ 36 Bins
- ✅ 20 Products with stock distributed across bins
- ✅ 50 Inward logs (GRN)
- ✅ 100 Outward logs (Picks)
- ✅ 60 days of demand history
- ✅ 30 Stock movements

### Step 3: Access the WMS Dashboard

1. Log in to BizTrackr
2. Navigate to **Warehouse (WMS)** in the sidebar
3. Click **"Refresh Report"** to generate AI insights

---

## 📊 Using the WMS Dashboard

### Tabs Overview

1. **Overview**
   - Action Plan (Step-by-step business recommendations)
   - Performance Summary (KPIs, fast/slow movers)

2. **Low Stock Alerts**
   - Critical items (< 7 days to stockout)
   - Warning items (< 14 days to stockout)
   - Reorder points and safety stock calculations

3. **AI Reorder**
   - Recommended order quantities
   - Best supplier suggestions
   - Cost impact analysis

4. **Bin Optimization**
   - Fast-mover placement recommendations
   - Overloaded/underutilized bin alerts
   - Space optimization tips

5. **Anomalies**
   - Usage spikes detection
   - Quality rejections
   - Potential shrinkage alerts

---

## 🔌 API Usage Examples

### Get Warehouse Intelligence Report

```bash
curl -X GET "http://localhost:8000/api/v1/wms/intelligence?days_history=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a New Warehouse

```bash
curl -X POST "http://localhost:8000/api/v1/wms/warehouses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Secondary Warehouse",
    "location": "Los Angeles, CA",
    "capacity": 8000.0
  }'
```

### Log Inward Stock (GRN)

```bash
curl -X POST "http://localhost:8000/api/v1/wms/inward" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_id": 1,
    "supplier_id": 3,
    "item_id": 123,
    "quantity_received": 200,
    "bin_id": 10,
    "quality_check_status": "approved"
  }'
```

### Log Outward Stock (Picking)

```bash
curl -X POST "http://localhost:8000/api/v1/wms/outward" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_id": 1,
    "item_id": 123,
    "quantity_picked": 25,
    "bin_id": 10,
    "customer_id": 50,
    "status": "picked"
  }'
```

---

## 🎯 Understanding the AI Logic

### How Days-to-Stockout Works

```python
avg_daily_demand = sum(sales_last_30_days) / 30
days_to_stockout = current_stock / avg_daily_demand
```

**Example:**
- Current stock: 50 units
- Sales in last 30 days: 120 units
- Avg daily demand: 120 / 30 = 4 units/day
- Days to stockout: 50 / 4 = **12.5 days** ⚠️

### How Reorder Point is Calculated

```python
lead_time_days = 7  # How long it takes to get new stock
safety_stock = avg_daily_demand * 3  # 3-day buffer
reorder_point = (avg_daily_demand * lead_time_days) + safety_stock
```

**Example:**
- Avg daily demand: 4 units/day
- Lead time: 7 days
- Safety stock: 4 × 3 = 12 units
- Reorder point: (4 × 7) + 12 = **40 units**

👉 **Order new stock when inventory drops below 40 units**

### How EOQ (Economic Order Quantity) Works

```python
optimal_order_qty = max(
    avg_daily_demand * 30,  # 30-day supply
    reorder_point * 2        # Or 2x reorder point
)
```

**Example:**
- Avg daily demand: 4 units/day
- 30-day supply: 4 × 30 = 120 units
- Reorder point: 40 units
- 2x reorder point: 80 units
- Optimal order: **120 units** (whichever is higher)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │         WMS Dashboard Page                   │  │
│  │  - KPI Cards                                 │  │
│  │  - Low Stock Alerts                          │  │
│  │  - Reorder Recommendations                   │  │
│  │  - Bin Optimization                          │  │
│  │  - Anomaly Detection                         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↕ HTTP/REST API
┌─────────────────────────────────────────────────────┐
│              Backend (FastAPI)                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │      WMS API Endpoints                       │  │
│  │  /api/v1/wms/warehouses                      │  │
│  │  /api/v1/wms/bins                            │  │
│  │  /api/v1/wms/inward                          │  │
│  │  /api/v1/wms/outward                         │  │
│  │  /api/v1/wms/intelligence ← AI Service       │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │    WMSIntelligenceService (AI Engine)        │  │
│  │  - Low Stock Analysis                        │  │
│  │  - Reorder Recommendations                   │  │
│  │  - Bin Optimization                          │  │
│  │  - Anomaly Detection                         │  │
│  │  - Performance Metrics                       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↕ SQLAlchemy ORM
┌─────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                  │
│                                                     │
│  • warehouses           • bin_stocks                │
│  • warehouse_zones      • stock_movements           │
│  • warehouse_bins       • inward_logs               │
│  • demand_history       • outward_logs              │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Migration Fails?

```bash
# Reset migrations (CAUTION: Development only)
alembic downgrade -1
alembic upgrade head

# Or auto-generate fresh migration
alembic revision --autogenerate -m "Add WMS tables v2"
alembic upgrade head
```

### No Data Showing?

1. Run the seed script: `python seed_wms_demo.py`
2. Check that you have:
   - Inventory items
   - Suppliers
   - Customers
3. Verify tenant_id matches your logged-in user

### Permission Denied?

- WMS requires `view_inventory` permission
- Check your user role in `/dashboard/users`
- Admin users have all permissions by default

---

## 📚 Further Reading

- [WMS_MODULE_DOCUMENTATION.md](./WMS_MODULE_DOCUMENTATION.md) - Full technical documentation
- [Backend API](./backend/app/api/v1/endpoints/wms.py) - API implementation
- [AI Service](./backend/app/services/wms_intelligence.py) - Intelligence engine
- [Frontend Dashboard](./frontend/src/pages/dashboard/wms.tsx) - UI implementation

---

## 🎉 You're All Set!

The WMS module is now fully integrated into BizTrackr. Start optimizing your warehouse operations with AI-powered insights!

**Questions?** Check the main documentation or reach out to the development team.

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-05
