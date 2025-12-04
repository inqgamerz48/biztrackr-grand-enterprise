# 🎯 BizTrackr V2 - Google Analytics 4 + GTM Integration Guide

## ✅ IMPLEMENTATION COMPLETE!

Your BizTrackr V2 SaaS now has **Google Analytics 4** and **Google Tag Manager** fully integrated with production-grade best practices.

---

## 📊 **What's Implemented**

### **1. Google Analytics 4 (GA4)**
- **Measurement ID:** `G-GW8N42TF9G`
- **Auto-tracking:** Pageviews, sessions, engagement
- **Custom events:** BizTrackr-specific business events

### **2. Google Tag Manager (GTM)**
- **Container ID:** `GTM-XXXXXXX` (Update with your actual GTM ID)
- **DataLayer:** Globally available for advanced tracking
- **No-script fallback:** Included for non-JS browsers

### **3. Files Created**

```
frontend/src/
├── lib/
│   └── analytics.ts                      ← Core analytics module
├── components/
│   └── analytics/
│       ├── GoogleAnalytics.tsx           ← GA4 script component
│       └── GoogleTagManager.tsx          ← GTM script component
├── hooks/
│   └── useAnalytics.ts                   ← Auto pageview tracking hook
└── pages/
    └── _app.tsx                          ← Updated with analytics
```

---

## 🚀 **Automatic Tracking (Already Enabled)**

These metrics are tracked automatically:

✅ **Pageviews** - Every page navigation  
✅ **Sessions** - User sessions and duration  
✅ **Engagement time** - Time spent on site  
✅ **Scroll depth** - How far users scroll  
✅ **Outbound clicks** - External link clicks  
✅ **File downloads** - PDF, CSV downloads  
✅ **Site search** - Search queries  
✅ **Traffic source** - Where users come from  

---

## 🎯 **Custom Event Tracking (BizTrackr Events)**

### **How to Use Custom Events**

Import the analytics module:
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

### **1. Track Inventory Added**

When a user adds inventory:
```tsx
import { trackInventoryAdded } from '@/lib/analytics';

const handleAddInventory = async (data) => {
  // Your existing logic...
  await api.post('/inventory', data);
  
  // Track the event
  trackInventoryAdded({
    item: data.name,
    quantity: data.quantity,
    value: data.price * data.quantity,
    category: data.category
  });
};
```

**Example usage in your component:**
```tsx
// In your inventory add form
const onSubmit = async (formData) => {
  try {
    const response = await createInventory(formData);
    
    trackInventoryAdded({
      item: formData.item_name,
      quantity: formData.quantity,
      value: formData.unit_price * formData.quantity,
      category: formData.category
    });
    
    alert('Inventory added successfully!');
  } catch (error) {
    console.error(error);
  }
};
```

---

### **2. Track Sale Created**

When a sale is completed:
```tsx
import { trackSaleCreated } from '@/lib/analytics';

const handleCreateSale = async (saleData) => {
  const response = await api.post('/sales', saleData);
  
  trackSaleCreated({
    saleId: response.data.id,
    amount: saleData.total_amount,
    currency: 'INR',
    customer: saleData.customer_name,
    items: saleData.items.length
  });
};
```

---

### **3. Track Invoice Generated**

When invoice is created or downloaded:
```tsx
import { trackInvoiceGenerated } from '@/lib/analytics';

const handleGenerateInvoice = async (invoiceId) => {
  const invoice = await api.get(`/invoices/${invoiceId}`);
  
  trackInvoiceGenerated({
    invoiceId: invoice.invoice_number,
    amount: invoice.total_amount,
    customer: invoice.customer_name,
    format: 'PDF'
  });
  
  // Download PDF...
};
```

---

### **4. Track Customer Added**

When adding a new customer to CRM:
```tsx
import { trackCustomerAdded } from '@/lib/analytics';

const handleAddCustomer = async (customerData) => {
  const response = await api.post('/crm/customers', customerData);
  
  trackCustomerAdded({
    customerId: response.data.id,
    customerName: customerData.name,
    customerType: customerData.type // 'individual' or 'business'
  });
};
```

---

### **5. Track Report Exported**

When exporting analytics or reports:
```tsx
import { trackReportExported } from '@/lib/analytics';

const handleExportReport = async (reportType, format) => {
  await api.post('/reports/export', { type: reportType, format });
  
  trackReportExported({
    reportType: reportType, // 'analytics', 'sales', 'inventory'
    format: format, // 'CSV', 'PDF', 'Excel'
    dateRange: '2024-01-01 to 2024-12-31'
  });
};
```

---

### **6. Track Pro Upgrade Clicked**

When user clicks upgrade to pro:
```tsx
import { trackProUpgradeClicked } from '@/lib/analytics';

const handleUpgradeClick = () => {
  trackProUpgradeClicked({
    source: 'billing_page', // or 'dashboard', 'popup', etc.
    plan: 'PRO',
    price: 999
  });
  
  // Navigate to upgrade page
  router.push('/upgrade');
};
```

**Example in your billing component:**
```tsx
<button 
  onClick={() => {
    trackProUpgradeClicked({
      source: 'pricing_card',
      plan: 'PRO',
      price: plan.price
    });
    handleSubscribe('pro');
  }}
>
  Upgrade to PRO
</button>
```

---

## 🔍 **Additional Tracking Functions**

### **Track User Signup**
```tsx
import { trackUserSignup } from '@/lib/analytics';

const handleSignup = async (userData) => {
  const response = await api.post('/auth/register', userData);
  
  trackUserSignup({
    method: 'email', // or 'google', 'github'
    userId: response.data.id
  });
};
```

---

### **Track User Login**
```tsx
import { trackUserLogin } from '@/lib/analytics';

const handleLogin = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  trackUserLogin({
    method: 'email',
    userId: response.data.user_id
  });
};
```

---

### **Track Search**
```tsx
import { trackSearch } from '@/lib/analytics';

const handleSearch = async (searchTerm) => {
  const results = await api.get(`/search?q=${searchTerm}`);
  
  trackSearch(searchTerm, results.data.length);
};
```

---

### **Track File Download**
```tsx
import { trackFileDownload } from '@/lib/analytics';

const handleDownload = (fileName) => {
  const fileExtension = fileName.split('.').pop();
  
  trackFileDownload(fileName, fileExtension);
  
  // Trigger download...
};
```

---

### **Set User Properties (For Logged-In Users)**
```tsx
import { setUserProperties } from '@/lib/analytics';

// After user logs in
useEffect(() => {
  if (user) {
    setUserProperties({
      userId: user.id,
      userRole: user.role, // 'admin', 'user', etc.
      plan: user.subscription_plan, // 'free', 'pro'
      tenantId: user.tenant_id
    });
  }
}, [user]);
```

---

## 🧪 **Testing & Verification**

### **1. Real-time Testing (Immediate)**

1. **Open GA4 Realtime Report:**
   - Go to: https://analytics.google.com/
   - Navigate to: `Reports → Realtime`
   - You should see your test sessions

2. **Test Events:**
   ```tsx
   // In browser console or your app
   import { trackEvent } from '@/lib/analytics';
   
   trackEvent('test_event', { test: 'value' });
   ```

3. **Check DebugView:**
   - GA4 → Configure → DebugView
   - Enable debug mode in browser:
   ```tsx
   // Add to URL: ?debug_mode=true
   // Or set in analytics.ts:
   gtag('config', 'G-GW8N42TF9G', { debug_mode: true });
   ```

---

### **2. Google Tag Assistant**

1. Install Chrome extension: [Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Visit your site
3. Click Tag Assistant icon
4. Verify:
   - ✅ GA4 tag fires
   - ✅ GTM container loads
   - ✅ No errors

---

### **3. Check DataLayer (Manual)**

Open browser console and type:
```javascript
window.dataLayer
```

You should see an array with all tracked events.

---

### **4. Production Verification Checklist**

After deploying to production:

- [ ] GA4 Realtime shows live traffic
- [ ] Pageviews are tracked correctly
- [ ] Custom events appear in GA4
- [ ] GTM container is loaded
- [ ] No console errors
- [ ] No duplicate tracking
- [ ] DataLayer is populated
- [ ] User properties are set

---

## 🔧 **Configuration**

### **Update GTM Container ID**

**File:** `frontend/src/components/analytics/GoogleTagManager.tsx`

```tsx
// Replace this line:
const GTM_ID = 'GTM-XXXXXXX';

// With your actual GTM ID:
const GTM_ID = 'GTM-ABC1234';
```

Also update in:
- `frontend/src/lib/analytics.ts` (line 23)

---

### **Environment Variables (Optional)**

For multi-environment support:

**File:** `frontend/.env.local`
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-GW8N42TF9G
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Then update components to use:
```tsx
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-GW8N42TF9G';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXXXXX';
```

---

## 🎨 **Example: Complete Integration in a Component**

```tsx
import { useState } from 'react';
import { 
  trackInventoryAdded,
  trackSaleCreated,
  trackProUpgradeClicked 
} from '@/lib/analytics';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);

  const addInventory = async (item) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      
      const data = await response.json();
      
      // ✅ Track the event
      trackInventoryAdded({
        item: item.name,
        quantity: item.quantity,
        value: item.price * item.quantity,
        category: item.category
      });
      
      setInventory([...inventory, data]);
      alert('Inventory added successfully!');
    } catch (error) {
      console.error('Failed to add inventory', error);
    }
  };

  const makeSale = async (sale) => {
    const response = await fetch('/api/sales', {
      method: 'POST',
      body: JSON.stringify(sale)
    });
    
    const data = await response.json();
    
    // ✅ Track the sale
    trackSaleCreated({
      saleId: data.id,
      amount: sale.total,
      currency: 'INR',
      customer: sale.customer_name,
      items: sale.items.length
    });
  };

  return (
    <div>
      <h1>Inventory Management</h1>
      
      {/* Your UI */}
      <button onClick={addInventory}>Add Item</button>
      <button onClick={makeSale}>Create Sale</button>
      
      {/* Upgrade CTA with tracking */}
      <button 
        onClick={() => {
          trackProUpgradeClicked({
            source: 'inventory_page',
            plan: 'PRO'
          });
          window.location.href = '/upgrade';
        }}
      >
        Upgrade to Pro for Unlimited Inventory
      </button>
    </div>
  );
}
```

---

## 📈 **GA4 Dashboard Setup**

### **Recommended Custom Reports**

1. **BizTrackr Business Metrics:**
   - Total inventory_added events
   - Total sale_created events
   - Total invoice_generated events
   - Conversion rate to PRO

2. **User Engagement:**
   - Average session duration
   - Pages per session
   - Bounce rate by page

3. **Conversion Funnel:**
   - Visitors → Signup → Sale Created → Pro Upgrade

---

## 🔒 **GDPR Compliance (Optional)**

Enable consent mode:
```tsx
import { setAnalyticsConsent } from '@/lib/analytics';

// When user accepts cookies
setAnalyticsConsent(true);

// When user rejects
setAnalyticsConsent(false);
```

---

## 🎉 **You're All Set!**

### **What Happens Now:**

1. ✅ **All pageviews** are automatically tracked
2. ✅ **Custom BizTrackr events** are ready to use
3. ✅ **GA4 + GTM** work together without conflicts
4. ✅ **DataLayer** is globally available
5. ✅ **Production-ready** implementation

### **Next Steps:**

1. Replace `GTM-XXXXXXX` with your actual GTM Container ID
2. Deploy to production
3. Verify tracking in GA4 Realtime
4. Add custom events to your business logic
5. Create custom reports in GA4
6. Set up conversion goals

---

## 📞 **Need Help?**

- **GA4 Documentation:** https://support.google.com/analytics/answer/9304153
- **GTM Documentation:** https://support.google.com/tagmanager/answer/6103696
- **Tag Assistant:** https://tagassistant.google.com/

---

**✅ PRODUCTION-READY ANALYTICS INTEGRATION COMPLETE!** 🚀

**Your BizTrackr V2 now has enterprise-grade tracking!**
