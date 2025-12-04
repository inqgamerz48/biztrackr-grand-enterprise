# 🎯 BizTrackr Analytics - Quick Reference Card

## 📊 Configuration

**GA4 Measurement ID:** `G-GW8N42TF9G`  
**GTM Container ID:** `GTM-XXXXXXX` ⚠️ **Update This!**

---

## 🚀 Quick Usage Examples

### Import
```tsx
import {
  trackInventoryAdded,
  trackSaleCreated,
  trackInvoiceGenerated,
  trackCustomerAdded,
  trackReportExported,
  trackProUpgradeClicked
} from '@/lib/analytics';
```

---

### Inventory Added
```tsx
trackInventoryAdded({
  item: 'Laptop',
  quantity: 10,
  value: 35000,
  category: 'Electronics'
});
```

---

### Sale Created
```tsx
trackSaleCreated({
  saleId: 'SALE-001',
  amount: 5000,
  currency: 'INR',
  customer: 'John Doe',
  items: 3
});
```

---

### Invoice Generated
```tsx
trackInvoiceGenerated({
  invoiceId: 'INV-001',
  amount: 5000,
  customer: 'John Doe',
  format: 'PDF'
});
```

---

### Customer Added
```tsx
trackCustomerAdded({
  customerId: 'CUST-001',
  customerName: 'Acme Corp',
  customerType: 'business'
});
```

---

### Report Exported
```tsx
trackReportExported({
  reportType: 'sales_analytics',
  format: 'CSV',
  dateRange: '2024-01-01 to 2024-12-31'
});
```

---

### Pro Upgrade Clicked
```tsx
trackProUpgradeClicked({
  source: 'billing_page',
  plan: 'PRO',
  price: 999
});
```

---

## 🧪 Quick Test

### Browser Console:
```javascript
// Check if loaded
window.dataLayer

// Manual test event
gtag('event', 'test_event', { test: 'value' })
```

---

## ✅ Verification Checklist

- [ ] Update GTM Container ID in files
- [ ] GA4 Realtime shows traffic
- [ ] Custom events appear
- [ ] No console errors
- [ ] DataLayer populated

---

## 📂 Files to Update

1. `frontend/src/components/analytics/GoogleTagManager.tsx` - Line 7
2. `frontend/src/lib/analytics.ts` - Line 23

Replace `GTM-XXXXXXX` with your actual GTM ID.

---

## 🔗 Quick Links

- **GA4 Realtime:** https://analytics.google.com/
- **GTM Dashboard:** https://tagmanager.google.com/
- **Full Guide:** `frontend/ANALYTICS_INTEGRATION_GUIDE.md`

---

**Status:** ✅ Ready to deploy!
