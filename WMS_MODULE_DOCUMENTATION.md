# 🏭 Enterprise Warehouse Management System (WMS) Module

## Overview

The **Warehouse Management System (WMS)** module is an AI-powered, enterprise-grade warehouse intelligence platform integrated into BizTrackr. It provides comprehensive warehouse analytics, inventory optimization, and actionable insights to maximize warehouse efficiency and minimize operational costs.

---

## 🚀 Features

### 1. **Low Stock Analysis**
- **Days-to-Stockout Calculation**: Predicts when items will run out based on velocity
- **Reorder Point (ROL)**: Calculates optimal reorder points dynamically
- **Safety Stock Recommendations**: Suggests buffer stock levels
- **Critical vs Warning Alerts**: Prioritizes urgent items

### 2. **AI Reorder Recommendations**
- **Demand Forecasting**: Uses historical data to predict future demand
- **Economic Order Quantity (EOQ)**: Optimizes order quantities
- **Supplier Performance Analysis**: Recommends best suppliers based on historical performance
- **Cost Impact Analysis**: Estimates financial impact of delayed reordering

### 3. **Bin Location Optimization**
- **Fast-Mover Placement**: Suggests placing high-velocity items closer to dispatch zones
- **Slow-Mover Relocation**: Recommends moving slow-moving items to back/bulk storage
- **Bin Utilization Monitoring**: Identifies overloaded and underutilized bins
- **Space Optimization**: Maximizes warehouse capacity utilization

### 4. **Inward & Outward Anomaly Detection**
- **Usage Spikes Detection**: Identifies sudden increases/decreases in stock movement
- **GRN Mismatch Alerts**: Flags quality check failures and rejections
- **Shrinkage Detection**: Detects potential inventory discrepancies
- **Data Integrity Checks**: Highlights inconsistencies in stock records

### 5. **Warehouse Performance Metrics**
- **Picking Accuracy**: Measures accuracy of order fulfillment
- **Cycle Count Accuracy**: Tracks inventory count precision
- **Space Utilization**: Monitors warehouse capacity usage
- **Fast/Slow Mover Analysis**: ABC classification of inventory

---

## 📊 Data Model

### Database Tables

#### **Warehouses**
```python
- id: INT (Primary Key)
- name: STRING
- location: STRING
- capacity: FLOAT (cubic meters)
- is_active: BOOLEAN
- tenant_id: INT (Foreign Key)
```

#### **Warehouse Zones**
```python
- id: INT (Primary Key)
- name: STRING
- zone_type: STRING (fast-pick, bulk, cold-storage, staging)
- warehouse_id: INT (Foreign Key)
- tenant_id: INT (Foreign Key)
```

#### **Warehouse Bins**
```python
- id: INT (Primary Key)
- bin_code: STRING (unique, e.g., "A-01-03")
- zone_id: INT (Foreign Key)
- capacity: FLOAT
- current_load: FLOAT
- is_active: BOOLEAN
- tenant_id: INT (Foreign Key)
```

#### **Bin Stocks**
```python
- id: INT (Primary Key)
- bin_id: INT (Foreign Key)
- item_id: INT (Foreign Key)
- quantity: INT
- last_updated: DATETIME
- tenant_id: INT (Foreign Key)
```

#### **Stock Movements**
```python
- id: INT (Primary Key)
- item_id: INT (Foreign Key)
- warehouse_id: INT (Foreign Key)
- from_bin_id: INT (Foreign Key, nullable)
- to_bin_id: INT (Foreign Key, nullable)
- quantity: INT
- movement_type: STRING (transfer, inward, outward, adjustment)
- reason: TEXT
- moved_at: DATETIME
- moved_by: INT (Foreign Key to User)
- tenant_id: INT (Foreign Key)
```

#### **Inward Logs**
```python
- id: INT (Primary Key)
- warehouse_id: INT (Foreign Key)
- supplier_id: INT (Foreign Key)
- purchase_order_id: INT (Foreign Key, nullable)
- item_id: INT (Foreign Key)
- quantity_received: INT
- bin_id: INT (Foreign Key, nullable)
- received_at: DATETIME
- quality_check_status: STRING (pending, approved, rejected)
- notes: TEXT
- tenant_id: INT (Foreign Key)
```

#### **Outward Logs**
```python
- id: INT (Primary Key)
- warehouse_id: INT (Foreign Key)
- customer_id: INT (Foreign Key, nullable)
- sale_id: INT (Foreign Key, nullable)
- item_id: INT (Foreign Key)
- quantity_picked: INT
- bin_id: INT (Foreign Key, nullable)
- picked_at: DATETIME
- picked_by: INT (Foreign Key to User)
- status: STRING (pending, picked, packed, shipped)
- notes: TEXT
- tenant_id: INT (Foreign Key)
```

#### **Demand History**
```python
- id: INT (Primary Key)
- item_id: INT (Foreign Key)
- date: DATETIME
- quantity_sold: INT
- tenant_id: INT (Foreign Key)
```

---

## 🔌 API Endpoints

### Base URL: `/api/v1/wms`

### **Warehouse Management**

#### `GET /api/v1/wms/warehouses`
Get all warehouses for the tenant.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Warehouse",
    "location": "New York, NY",
    "capacity": 5000.0,
    "is_active": true
  }
]
```

#### `POST /api/v1/wms/warehouses`
Create a new warehouse.

**Request:**
```json
{
  "name": "Main Warehouse",
  "location": "New York, NY",
  "capacity": 5000.0
}
```

#### `POST /api/v1/wms/zones`
Create a warehouse zone.

**Request:**
```json
{
  "name": "Fast Pick Zone A",
  "zone_type": "fast-pick",
  "warehouse_id": 1
}
```

#### `POST /api/v1/wms/bins`
Create a warehouse bin.

**Request:**
```json
{
  "bin_code": "A-01-03",
  "zone_id": 1,
  "capacity": 100.0
}
```

#### `GET /api/v1/wms/bins?warehouse_id=1`
Get all bins, optionally filtered by warehouse.

---

### **Stock Operations**

#### `POST /api/v1/wms/stock-movements`
Record a stock movement (transfer, inward, outward, adjustment).

**Request:**
```json
{
  "item_id": 123,
  "warehouse_id": 1,
  "from_bin_id": 5,
  "to_bin_id": 10,
  "quantity": 50,
  "movement_type": "transfer",
  "reason": "Optimizing bin placement"
}
```

#### `POST /api/v1/wms/inward`
Log inward stock (goods received).

**Request:**
```json
{
  "warehouse_id": 1,
  "supplier_id": 3,
  "item_id": 123,
  "quantity_received": 200,
  "bin_id": 10,
  "quality_check_status": "approved",
  "notes": "Good condition"
}
```

#### `POST /api/v1/wms/outward`
Log outward stock (picking for orders).

**Request:**
```json
{
  "warehouse_id": 1,
  "item_id": 123,
  "quantity_picked": 25,
  "bin_id": 10,
  "customer_id": 50,
  "sale_id": 789,
  "status": "picked"
}
```

#### `GET /api/v1/wms/inward?warehouse_id=1&days=30`
Get inward logs for the last N days.

#### `GET /api/v1/wms/outward?warehouse_id=1&days=30`
Get outward logs for the last N days.

#### `GET /api/v1/wms/stock-overview?warehouse_id=1`
Get stock overview across all bins.

---

### **AI Warehouse Intelligence** 🤖

#### `GET /api/v1/wms/intelligence?warehouse_id=1&days_history=30`
Generate comprehensive AI-powered warehouse intelligence report.

**Response:**
```json
{
  "generated_at": "2025-12-05T11:20:00Z",
  "warehouse_id": 1,
  "analysis_period_days": 30,
  "low_stock_alerts": [
    {
      "item_id": 123,
      "sku": "SKU-001",
      "name": "Widget Pro",
      "current_stock": 15,
      "min_stock": 20,
      "avg_daily_demand": 3.5,
      "days_to_stockout": 4.3,
      "status": "critical",
      "reorder_point": 35,
      "safety_stock": 11
    }
  ],
  "reorder_suggestions": [
    {
      "item_id": 123,
      "name": "Widget Pro",
      "recommended_order_qty": 105,
      "reorder_immediately": true,
      "best_supplier_id": 3,
      "estimated_cost_if_delayed": 500,
      "reasoning": "Based on 3.5 units/day demand, recommend ordering 105 units to cover 30 days."
    }
  ],
  "optimal_bin_locations": [
    {
      "item_id": 456,
      "recommendation": "Place in fast-pick zone (closest to dispatch)",
      "reason": "High velocity item (50.2 units/day). Minimize picking distance.",
      "priority": "high"
    }
  ],
  "anomalies_detected": [
    {
      "type": "outward_spike",
      "item_id": 789,
      "description": "Unusual spike in outward quantity: 500 units (avg: 120.5)",
      "severity": "medium"
    }
  ],
  "warehouse_performance": {
    "picking_accuracy_pct": 97.5,
    "cycle_count_accuracy_pct": 95.0,
    "warehouse_space_utilization_pct": 72.3,
    "total_inward_receipts": 450,
    "total_outward_picks": 380,
    "successful_picks": 370,
    "top_fast_moving_items": ["Item-123", "Item-456", "Item-789"],
    "top_slow_moving_items": ["Item-111", "Item-222"],
    "active_bins": 85,
    "total_bins": 100
  },
  "action_plan": [
    "URGENT: Place immediate purchase orders for 3 critical items within 24 hours to avoid stockouts.",
    "Schedule reorders for 5 items approaching minimum stock levels within 7 days.",
    "Relocate 2 fast-moving items to fast-pick zones to improve picking efficiency."
  ]
}
```

---

## 🎨 Frontend

### WMS Dashboard Page
**Location:** `/dashboard/wms`

**Features:**
- **Real-time KPI cards** with performance metrics
- **Interactive tabs:**
  - Overview (Action Plan + Performance Summary)
  - Low Stock Alerts (Critical and Warning alerts)
  - AI Reorder Recommendations
  - Bin Optimization Suggestions
  - Anomaly Detection
- **Dynamic filtering** by time period (7, 30, 60, 90 days)
- **Beautiful gradient UI** with animations and hover effects
- **Status-based color coding** (critical = red, warning = yellow, etc.)

---

## 🧠 AI Intelligence Logic

### Low Stock Analysis Algorithm
```python
1. Calculate avg_daily_demand = mean(demand_history) / num_days
2. days_to_stockout = current_stock / avg_daily_demand
3. If days_to_stockout < 7: status = "critical"
4. Else if days_to_stockout < 14 OR current_stock <= min_stock: status = "warning"
5. Reorder point = (avg_daily_demand * lead_time_days) + safety_stock
6. Safety stock = avg_daily_demand * 3 (3-day buffer)
```

### Reorder Recommendation Algorithm
```python
1. EOQ = max(avg_daily_demand * 30, reorder_point * 2)
2. Find best supplier = supplier with highest delivery count
3. Cost if delayed = $500 if days_to_stockout < 7, else $0
```

### Bin Optimization Algorithm
```python
1. Calculate velocity for all items
2. Sort by velocity
3. Top 20% = fast movers → recommend fast-pick zone
4. Bottom 20% = slow movers → recommend bulk storage
5. Bins > 90% utilization → flag as overloaded
6. Bins < 30% utilization → flag as underutilized
```

### Anomaly Detection Algorithm
```python
1. For each item, calculate mean and std_dev of outward quantities
2. If any quantity > mean + (2 * std_dev) → spike detected
3. If quality_check_status = "rejected" → quality issue
4. If actual_stock = 0 AND recent outward activity exists → potential shrinkage
```

---

## 🛠️ Setup & Installation

### Backend Setup

1. **Apply database migration:**
```bash
cd backend
alembic revision --autogenerate -m "Add WMS tables"
alembic upgrade head
```

2. **Restart the backend:**
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

The WMS page is already integrated. Just navigate to `/dashboard/wms` after logging in.

---

## 📈 Usage Workflow

### 1. **Setup Warehouse Structure**
```
POST /api/v1/wms/warehouses → Create warehouse
POST /api/v1/wms/zones → Create zones (fast-pick, bulk, etc.)
POST /api/v1/wms/bins → Create bins (A-01-01, A-01-02, etc.)
```

### 2. **Log Inward Stock**
```
POST /api/v1/wms/inward → Log goods received from suppliers
```

### 3. **Log Outward Stock**
```
POST /api/v1/wms/outward → Log picked items for customer orders
```

### 4. **Generate Intelligence Report**
```
GET /api/v1/wms/intelligence → Get AI-powered insights
```

### 5. **Take Action**
- Reorder critical items immediately
- Optimize bin placements
- Investigate anomalies
- Monitor warehouse performance

---

## 🔒 Security & Permissions

- All endpoints require authentication (`get_current_user`)
- All operations are **tenant-isolated** (multi-tenant safe)
- Permission: Uses `view_inventory` permission (can be customized)
- Sidebar visibility: Shown to users with `view_inventory` permission

---

## 🎯 Future Enhancements

- [ ] Real-time barcode scanning integration
- [ ] Mobile app for warehouse staff
- [ ] Advanced ML models for demand forecasting (ARIMA, LSTM)
- [ ] Integration with IoT sensors for real-time bin monitoring
- [ ] 3D warehouse layout visualization
- [ ] Automated picking route optimization
- [ ] Multi-warehouse transfer optimization
- [ ] Predictive maintenance for warehouse equipment

---

## 📞 Support

For questions or issues, contact the BizTrackr development team.

**Module Created:** 2025-12-05  
**Version:** 1.0.0  
**License:** MIT
