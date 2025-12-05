# WMS Module - Quick Reference Card

## 🚀 Access
**URL:** `/dashboard/wms`  
**Permission:** `view_inventory`

---

## 📊 Dashboard Tabs

| Tab | Icon | Purpose |
|-----|------|---------|
| Overview | 📈 | Action plan + KPIs |
| Low Stock | ⚠️ | Critical/warning alerts |
| AI Reorder | 🤖 | Smart recommendations |
| Bins | 📦 | Location optimization |
| Anomalies | ⚡ | Issue detection |

---

## 🎯 Key Metrics

| Metric | What it Measures |
|--------|------------------|
| **Days to Stockout** | How many days until item runs out |
| **Reorder Point** | When to reorder (units) |
| **EOQ** | Optimal order quantity |
| **Picking Accuracy** | % of correct picks |
| **Space Utilization** | % of warehouse capacity used |

---

## 📡 Quick API Reference

```bash
# Get Intelligence Report
GET /api/v1/wms/intelligence?days_history=30

# Create Warehouse
POST /api/v1/wms/warehouses
{
  "name": "Main Warehouse",
  "location": "NYC",
  "capacity": 10000.0
}

# Log Inward Stock
POST /api/v1/wms/inward
{
  "warehouse_id": 1,
  "supplier_id": 3,
  "item_id": 123,
  "quantity_received": 200,
  "bin_id": 10
}

# Log Outward Pick
POST /api/v1/wms/outward
{
  "warehouse_id": 1,
  "item_id": 123,
  "quantity_picked": 25,
  "bin_id": 10,
  "customer_id": 50
}

# Get Stock Overview
GET /api/v1/wms/stock-overview?warehouse_id=1
```

---

## 🧮 Calculation Formulas

### Days to Stockout
```
avg_daily_demand = total_sales / days
days_to_stockout = current_stock / avg_daily_demand
```

### Reorder Point
```
reorder_point = (demand × lead_time) + safety_stock
safety_stock = avg_daily_demand × 3
```

### EOQ
```
optimal_qty = max(
  avg_daily_demand × 30,
  reorder_point × 2
)
```

---

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Critical | 🔴 Red | < 7 days to stockout |
| Warning | 🟡 Yellow | < 14 days to stockout |
| High Priority | 🟠 Orange | Immediate action needed |
| Normal | 🔵 Blue | Within safe levels |

---

## 🛠️ Setup Commands

```bash
# 1. Run migration
cd backend
alembic upgrade head

# 2. Seed demo data (optional)
python seed_wms_demo.py

# 3. Start backend
uvicorn app.main:app --reload

# 4. Access dashboard
Navigate to /dashboard/wms
```

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| `WMS_QUICK_START.md` | 5-min setup guide |
| `WMS_MODULE_DOCUMENTATION.md` | Full technical spec |
| `WMS_IMPLEMENTATION_SUMMARY.md` | What was built |

---

## 🆘 Troubleshooting

**No data showing?**
→ Run `python seed_wms_demo.py`

**Permission denied?**
→ Check user has `view_inventory` permission

**Migration failed?**
→ Run `alembic downgrade -1` then `alembic upgrade head`

---

**Version:** 1.0.0 | **Date:** 2025-12-05
