# 📦 WMS Stock Import & Inventory Integration Guide

## Overview
This guide explains how to import stock into the warehouse and sync it with your main inventory in BizTrackr.

---

## 🎯 **Stock Import Workflow**

### **Option 1: Direct API Approach (Recommended for Integration)**

#### **Step 1: Log Inward Stock (Goods Receipt)**
When you receive stock from suppliers, log it in the WMS system:

```bash
POST /api/v1/wms/inward
```

**Request Body:**
```json
{
  "warehouse_id": 1,
  "supplier_id": 3,
  "item_id": 123,
  "quantity_received": 200,
  "bin_id": 10,
  "purchase_order_id": 45,
  "quality_check_status": "approved",
  "notes": "Batch #2024-123"
}
```

**What Happens:**
1. ✅ Stock is logged in `inward_logs` table
2. ✅ **Main inventory quantity is automatically updated** (`items.quantity += quantity_received`)
3. ✅ Stock is allocated to the specified bin (`bin_stocks` table updated)
4. ✅ Audit trail is created

#### **Step 2: Assign to Bin Location**
The system automatically updates bin stock when you log inward:

```sql
-- Automatically happens in the backend:
UPDATE bin_stocks 
SET quantity = quantity + 200 
WHERE bin_id = 10 AND item_id = 123
```

---

### **Option 2: Manual Stock Movement**

If stock is already in inventory and you want to organize it in bins:

```bash
POST /api/v1/wms/stock-movements
```

**Request Body:**
```json
{
  "item_id": 123,
  "warehouse_id": 1,
  "from_bin_id": null,
  "to_bin_id": 10,
  "quantity": 50,
  "movement_type": "inward",
  "reason": "Initial stock allocation to bin"
}
```

---

## 🔄 **Integration with Main Inventory**

### **How Stock Flows:**

```
┌──────────────────────────────────────────────────────┐
│  1. Receive Stock from Supplier                      │
│     POST /api/v1/wms/inward                          │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  2. AUTOMATIC UPDATES:                               │
│     ✅ items.quantity += quantity_received           │
│     ✅ bin_stocks.quantity += quantity_received      │
│     ✅ inward_logs created                           │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  3. Stock is now in:                                 │
│     - Main Inventory (items table)                   │
│     - Warehouse Bin (bin_stocks table)               │
│     - Tracked in WMS (inward_logs table)             │
└──────────────────────────────────────────────────────┘
```

### **When Stock is Picked (Outward):**

```bash
POST /api/v1/wms/outward
```

**Request Body:**
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

**What Happens:**
1. ✅ Main inventory reduced (`items.quantity -= 25`)
2. ✅ Bin stock reduced (`bin_stocks.quantity -= 25`)
3. ✅ Outward log created for tracking
4. ✅ Demand history recorded for AI analysis

---

## 📋 **Practical Example: Complete Flow**

### **Scenario: You receive 500 units of "Widget Pro" from a supplier**

#### **1. Log the Receipt**
```javascript
// Frontend or API call
await axiosInstance.post('/wms/inward', {
  warehouse_id: 1,
  supplier_id: 5,
  item_id: 42,  // Widget Pro
  quantity_received: 500,
  bin_id: 15,   // Assign to Bin A-02-03
  quality_check_status: "approved",
  notes: "Good condition, checked by supervisor"
});
```

**Result:**
- ✅ Inventory item #42 quantity: 100 → 600
- ✅ Bin A-02-03 stock: +500 units
- ✅ Inward log created with timestamp

#### **2. Customer Orders 30 Units**
```javascript
// When order is fulfilled
await axiosInstance.post('/wms/outward', {
  warehouse_id: 1,
  item_id: 42,
  quantity_picked: 30,
  bin_id: 15,
  customer_id: 23,
  sale_id: 156,
  status: "picked"
});
```

**Result:**
- ✅ Inventory item #42 quantity: 600 → 570
- ✅ Bin A-02-03 stock: 500 → 470
- ✅ Outward log created
- ✅ Demand history recorded (for AI forecasting)

#### **3. Check WMS Dashboard**
Navigate to `/dashboard/wms` and see:
- Real-time stock levels
- AI predictions for reorders
- Bin utilization
- Fast/slow mover analysis

---

## 🛠️ **Frontend Integration Examples**

### **Example 1: Create Inward Stock Form**

```tsx
// In your frontend component
const handleInwardStock = async (formData) => {
  try {
    const response = await axiosInstance.post('/wms/inward', {
      warehouse_id: formData.warehouseId,
      supplier_id: formData.supplierId,
      item_id: formData.itemId,
      quantity_received: formData.quantity,
      bin_id: formData.binId,
      quality_check_status: formData.qualityStatus,
      notes: formData.notes
    });
    
    toast.success('Stock added to warehouse and inventory!');
    // Refresh inventory list
    refetchInventory();
  } catch (error) {
    toast.error('Failed to add stock');
  }
};
```

### **Example 2: Pick Stock for Order**

```tsx
const handlePickStock = async (orderId, items) => {
  for (const item of items) {
    await axiosInstance.post('/wms/outward', {
      warehouse_id: currentWarehouse.id,
      item_id: item.id,
      quantity_picked: item.quantity,
      bin_id: item.bin_id,
      sale_id: orderId,
      picked_by: currentUser.id,
      status: "picked"
    });
  }
  
  toast.success('Order picked successfully!');
};
```

---

## 📊 **Available API Endpoints**

### **Stock Operations**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wms/inward` | POST | Log goods received (adds to inventory) |
| `/wms/outward` | POST | Log stock picked (reduces inventory) |
| `/wms/stock-movements` | POST | Move stock between bins |
| `/wms/intelligence` | GET | Get AI insights & recommendations |
| `/wms/stock-overview` | GET | View all stock across bins |
| `/wms/warehouses` | GET | List all warehouses |
| `/wms/bins` | GET | List all bins |

---

## 🎨 **Integration with Existing Inventory Page**

You can add WMS buttons to your existing inventory page:

```tsx
// In inventory.tsx
<button onClick={() => openWMSDialog(item)}>
  📦 Assign to Bin
</button>

<button onClick={() => viewBinLocations(item)}>
  📍 View Locations
</button>
```

---

## 🔍 **Quick Start Checklist**

### **Initial Setup:**
- [ ] Run database migration (`alembic upgrade head`)
- [ ] Create warehouse: `POST /wms/warehouses`
- [ ] Create zones (fast-pick, bulk, etc.)
- [ ] Create bins (A-01-01, A-01-02, etc.)

### **Daily Operations:**
- [ ] Log inward stock when receiving goods
- [ ] Log outward stock when fulfilling orders
- [ ] Review WMS dashboard for insights
- [ ] Act on AI reorder recommendations

---

## 💡 **Best Practices**

1. **Always log inward stock through WMS** - This ensures:
   - Proper inventory tracking
   - Accurate bin locations
   - AI can analyze demand patterns

2. **Quality check before approval** - Set `quality_check_status` to:
   - `"pending"` - Still being inspected
   - `"approved"` - Good to use
   - `"rejected"` - Don't add to inventory

3. **Use meaningful bin codes** - Example:
   - `A-01-01` = Zone A, Rack 01, Position 01
   - `F-03-05` = Fast-pick Zone F, Rack 03, Position 05

4. **Link to purchase orders** - Include `purchase_order_id` for better tracking

---

## 🚀 **Next Steps**

1. **Commit the URL fix and redeploy:**
   ```bash
   git add frontend/src/pages/dashboard/wms.tsx
   git commit -m "fix: Remove duplicate /api/v1 in WMS endpoint URL"
   git push origin main
   ```

2. **Test the WMS intelligence endpoint:**
   - Navigate to `/dashboard/wms`
   - Click "Refresh Report"
   - Should now work without 404 error

3. **Create your first warehouse:**
   - Use Postman or create a simple form
   - POST to `/api/v1/wms/warehouses`

4. **Seed demo data (optional):**
   ```bash
   cd backend
   python seed_wms_demo.py
   ```

---

## ❓ **FAQs**

**Q: Does WMS replace the main inventory?**  
A: No! WMS **extends** inventory by adding warehouse locations. The main `items` table remains the source of truth.

**Q: Do I need to use bins?**  
A: Bins are optional but recommended for large warehouses. You can set `bin_id` to `null` if not using bins.

**Q: Can I have multiple warehouses?**  
A: Yes! Create as many as you need and track stock separately in each.

**Q: How does AI know when to reorder?**  
A: The AI analyzes:
- Historical demand (from `demand_history`)
- Current stock levels
- Average daily usage
- Lead times (configurable)

---

Need help with a specific integration? Let me know! 🚀
