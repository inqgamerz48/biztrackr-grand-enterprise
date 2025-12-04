# 🎯 VENDOR SETUP GUIDE - BizTrackr V2

## ✅ System Status: Ready for Sale/Distribution

This BizTrackr system has been prepared for vendor customization. All payment and email functionality is **ready to use** but **configured as placeholders** for easy customization.

═══════════════════════════════════════════════════════════════
📦 WHAT'S INCLUDED & READY
═══════════════════════════════════════════════════════════════

✅ **Complete Email System**
   - Resend API integration
   - 8 professional HTML email templates
   - Event-based email dispatcher
   - Ready for vendor email configuration

✅ **License Key Management**
   - Auto-generation: INQ-BZTKR-XXXX-XXXX format
   - Database tracking
   - Activation system
   - Admin dashboard

✅ **Payment Webhooks (Backend Ready)**
   - Instamojo webhook handler
   - PayPal webhook handler
   - Automatic license generation on payment
   - Automatic email triggers

✅ **Frontend (Payment UI Hidden)**
   - Billing page shows plans
   - Payment buttons replaced with "Contact Sales"
   - Vendor notice displayed
   - Easy to re-enable after configuration

═══════════════════════════════════════════════════════════════
🔧 VENDOR CONFIGURATION REQUIRED
═══════════════════════════════════════════════════════════════

## 1. EMAIL CONFIGURATION

**File:** `backend/.env`

```env
# Option A: Use Resend (Recommended)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=YourBrand <noreply@yourdomain.com>

# Option B: Use Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=YourBrand <your-email@gmail.com>
```

**Steps:**
1. Get Resend API key: https://resend.com/api-keys
2. Verify your domain: https://resend.com/domains
3. Update `EMAIL_FROM` in .env
4. Test email sending

**OR use Gmail SMTP** (See: `backend/GMAIL_EMAIL_SETUP.md`)

---

## 2. PAYMENT PROVIDER CONFIGURATION

### Option A: Stripe (Credit Cards)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Setup:**
1. Create Stripe account: https://stripe.com
2. Get API keys from Dashboard → API Keys
3. Configure webhook endpoint: `https://yourapi.com/billing/stripe/webhook`
4. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`

### Option B: PayPal

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=live  # or 'sandbox' for testing
```

**Setup:**
1. Create PayPal app: https://developer.paypal.com/dashboard/applications
2. Get credentials
3. Configure webhook: `https://yourapi.com/webhook/paypal`
4. Subscribe to: `PAYMENT.CAPTURE.COMPLETED`

### Option C: Instamojo (India)

```env
INSTAMOJO_API_KEY=your_api_key
INSTAMOJO_AUTH_TOKEN=your_auth_token
INSTAMOJO_WEBHOOK_SECRET=your_secret
```

**Setup:**
1. Create Instamojo account: https://instamojo.com
2. Get API credentials from Settings
3. Configure webhook: `https://yourapi.com/webhook/instamojo`

---

## 3. ENABLE PAYMENT UI (FRONTEND)

**File:** `frontend/src/pages/dashboard/billing.tsx`

**Uncomment the payment handlers** (around line 30-60):

```tsx
// REMOVE THE COMMENT MARKERS:
/* VENDOR: Uncomment these handlers after configuring payment providers
const handleSubscribe = async (plan: string) => {
    ...
};
*/

// SHOULD BECOME:
const handleSubscribe = async (plan: string) => {
    ...
};
```

**Replace "Contact Sales" buttons** with payment buttons (lines 143-150 and 171-178):

```tsx
// BEFORE:
<button className="..." disabled>
    <Lock className="h-4 w-4" />
    Contact Sales
</button>

// AFTER:
<button onClick={() => handleSubscribe('starter')} className="...">
    Upgrade with Card
</button>
```

**Remove the vendor notice** (lines 195-207) - delete entire notice div

---

## 4. BRANDING CUSTOMIZATION

### Email Templates
**File:** `backend/app/services/email_service.py`

**Update colors** (line 22):
```python
BIZTRACKR_COLORS = {
    "dark_gray": "#YOUR_COLOR",
    "green": "#YOUR_COLOR",
    "light_gray": "#YOUR_COLOR",
    "white": "#FFFFFF",
    "accent": "#YOUR_COLOR"
}
```

**Update sender name** (line 21):
```python
SENDER_EMAIL = os.getenv("EMAIL_FROM", "YourBrand <noreply@yourdomain.com>")
```

### Frontend Branding
- Update logo in `frontend/public/`
- Update company name in templates
- Update color scheme in Tailwind config

---

## 5. LICENSE KEY FORMAT (Optional)

**File:** `backend/app/services/license_service.py`

**Current format:** `INQ-BZTKR-XXXX-XXXX`

**To customize:**
```python
def generate_license_key() -> str:
    prefix1 = "YOUR"      # Replace "INQ"
    prefix2 = "BRAND"     # Replace "BZTKR"
    
    segment1 = random_segment(4)
    segment2 = random_segment(4)
    
    return f"{prefix1}-{prefix2}-{segment1}-{segment2}"
```

---

## 6. DATABASE MIGRATION

After configuration, run migrations:

```bash
cd backend
alembic revision --autogenerate -m "Add licenses table"
alembic upgrade head
```

---

## 7. TESTING CHECKLIST

Before going live:

- [ ] Send test email (use trigger-event-email endpoint)
- [ ] Test payment webhook (use provider test mode)
- [ ] Verify license generation
- [ ] Test license activation
- [ ] Check license success page
- [ ] Verify email templates look good
- [ ] Test admin dashboard

---

═══════════════════════════════════════════════════════════════
🚀 QUICK VENDOR SETUP (3 STEPS)
═══════════════════════════════════════════════════════════════

### 1. Configure Email & Payment

Create `backend/.env` file:

```env
# Email
RESEND_API_KEY=your_resend_key
EMAIL_FROM=YourBrand <noreply@yourdomain.com>

# Payment (choose one or more)
STRIPE_SECRET_KEY=your_stripe_key
# OR
PAYPAL_CLIENT_ID=your_paypal_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
# OR
INSTAMOJO_API_KEY=your_instamojo_key
INSTAMOJO_AUTH_TOKEN=your_token

# App URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### 2. Uncomment Payment Handlers

Edit `frontend/src/pages/dashboard/billing.tsx`:
- Uncomment the payment handler functions (line 30-60)
- Replace "Contact Sales" buttons with actual payment buttons
- Remove vendor notice

### 3. Deploy & Test

```bash
# Backend
cd backend
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run build
npm run start
```

═══════════════════════════════════════════════════════════════
📋 FILES TO CUSTOMIZE
═══════════════════════════════════════════════════════════════

**Required:**
1. `backend/.env` - Add API keys
2. `frontend/src/pages/dashboard/billing.tsx` - Enable payments
3. `backend/app/services/email_service.py` - Update sender email

**Optional (Branding):**
4. `backend/app/services/email_service.py` - Change colors
5. `backend/app/services/license_service.py` - Change license format
6. Email templates - Update company name/branding
7. Frontend - Logo, colors, company name

═══════════════════════════════════════════════════════════════
📚 DOCUMENTATION FOR CUSTOMERS
═══════════════════════════════════════════════════════════════

After vendor setup, provide customers with:

1. **API Documentation:** `docs/EMAIL_LICENSE_SYSTEM.md`
2. **Architecture:** `docs/SYSTEM_ARCHITECTURE.md`
3. **Deployment:** `DEPLOYMENT_SUMMARY.md`
4. **Email Setup:** `backend/GMAIL_EMAIL_SETUP.md`

═══════════════════════════════════════════════════════════════
🔒 SECURITY NOTES
═══════════════════════════════════════════════════════════════

- Never commit `.env` files to version control
- Use environment variables for all secrets
- Enable HTTPS for production
- Verify webhook signatures
- Use strong API keys
- Regularly update dependencies

═══════════════════════════════════════════════════════════════
✅ SYSTEM STATUS
═══════════════════════════════════════════════════════════════

**READY FOR SALE:** ✅

- Email system: ✅ Ready (needs configuration)
- License system: ✅ Ready (working)
- Payment webhooks: ✅ Ready (needs credentials)
- Frontend UI: ✅ Ready (payment buttons hidden)
- Documentation: ✅ Complete
- Database: ✅ Ready (migrations included)

**Configuration Time:** ~30-60 minutes
**Maintenance:** Low (all systems automated)

═══════════════════════════════════════════════════════════════
📞 VENDOR SUPPORT
═══════════════════════════════════════════════════════════════

All configuration is documented in:
- This file: `VENDOR_SETUP_GUIDE.md`
- Email setup: `backend/GMAIL_EMAIL_SETUP.md`
- Full docs: `docs/EMAIL_LICENSE_SYSTEM.md`

═══════════════════════════════════════════════════════════════

**System prepared for:** Production Sale/Distribution
**Last updated:** 2024-12-05
**Version:** 2.0 - Vendor Ready

═══════════════════════════════════════════════════════════════
