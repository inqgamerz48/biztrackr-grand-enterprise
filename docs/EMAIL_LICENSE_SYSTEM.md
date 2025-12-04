# 📧 BizTrackr V2 - Complete Email + License System

## 🎯 Overview

A complete, production-ready transactional email and license key management system for BizTrackr SaaS, featuring:

- ✅ **Resend API Integration** - No SMTP, pure API-based email sending
- ✅ **Automatic License Generation** - Unique keys in `INQ-BZTKR-XXXX-XXXX` format
- ✅ **Payment Webhooks** - Instamojo & PayPal integration
- ✅ **8 Beautiful HTML Email Templates** - Responsive and modern designs
- ✅ **Event-Based Email System** - Centralized email dispatcher
- ✅ **Idempotent Webhook Processing** - Prevents duplicate license generation
- ✅ **License Activation Flow** - Complete user journey from payment to activation
- ✅ **Admin Dashboard** - License statistics and management

---

## 📁 Project Structure

```
/backend
├── /app
│   ├── /api
│   │   ├── license.py              # License API endpoints
│   │   └── webhooks.py             # Payment webhook handlers
│   ├── /services
│   │   ├── email_service.py        # Resend email service + templates
│   │   └── license_service.py      # License generation & management
│   ├── /models
│   │   └── license.py              # License database model
│   └── main.py                     # FastAPI app (updated with new routes)
├── requirements.txt                # Updated with resend, pymongo, firebase-admin
└── .env.license                    # Environment variables documentation
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://biztrackr.com
BACKEND_URL=https://api.biztrackr.com
```

**Get your Resend API Key:** https://resend.com/api-keys

### 3. Verify Domain in Resend

1. Go to https://resend.com/domains
2. Add your domain (e.g., `biztrackr.com`)
3. Update DNS records
4. Verify domain
5. Update sender email in `email_service.py` if needed

### 4. Run Database Migration

```bash
# Create migration for License model
alembic revision --autogenerate -m "Add license model"

# Apply migration
alembic upgrade head
```

### 5. Start the Server

```bash
uvicorn app.main:app --reload
```

---

## 📧 Email Templates

### Available Email Types

| Event Type | Description | Trigger |
|------------|-------------|---------|
| `welcome_email` | Welcome new users | User registration |
| `license_issued` | Send license key | Payment success |
| `payment_success` | Payment confirmation | Payment webhook |
| `inventory_added` | Inventory update notification | Inventory added |
| `sale_made` | New sale notification | Sale recorded |
| `invoice_generated` | Invoice created | Invoice generation |
| `password_reset` | Password reset link | Password reset request |
| `generic_notification` | Custom notifications | Any event |

### Template Preview

All templates feature:
- 📱 **Mobile Responsive** - Perfect on all devices
- 🎨 **BizTrackr Branding** - Consistent colors (#1F2937, #10B981)
- ✨ **Modern Design** - Gradients, shadows, clean typography
- 🔗 **Call-to-Action Buttons** - Clear next steps
- 📝 **Professional Formatting** - Well-structured content

---

## 🔑 License Key System

### License Format

```
INQ-BZTKR-XXXX-XXXX
```

Example: `INQ-BZTKR-A8K9-P3M7`

### Features

- ✅ Unique key generation with collision detection
- ✅ Excludes confusing characters (O, 0, I, 1, L)
- ✅ Database-backed with full tracking
- ✅ One-time use enforcement
- ✅ Email validation on activation
- ✅ Automatic plan upgrade on activation

### Database Schema

```sql
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    key VARCHAR UNIQUE NOT NULL,
    email VARCHAR NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    payment_id VARCHAR UNIQUE NOT NULL,
    plan VARCHAR DEFAULT 'PRO',
    payment_provider VARCHAR NOT NULL,
    payment_amount VARCHAR,
    payment_currency VARCHAR,
    user_id INTEGER REFERENCES users(id),
    buyer_name VARCHAR,
    buyer_phone VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP
);
```

---

## 🔌 API Endpoints

### 1. Activate License

**POST** `/api/v1/license/activate`

```json
{
  "email": "user@example.com",
  "license_key": "INQ-BZTKR-XXXX-XXXX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "License activated successfully! Welcome to BizTrackr PRO!",
  "license": {
    "key": "INQ-BZTKR-XXXX-XXXX",
    "plan": "PRO",
    "activated_at": "2024-12-05T00:00:00Z"
  }
}
```

---

### 2. Verify License

**POST** `/api/v1/license/verify?email=user@example.com`

**Response:**
```json
{
  "success": true,
  "has_license": true,
  "license": {
    "key": "INQ-BZTKR-XXXX-XXXX",
    "plan": "PRO",
    "activated_at": "2024-12-05T00:00:00Z",
    "created_at": "2024-12-04T00:00:00Z"
  }
}
```

---

### 3. Get License by Payment ID

**GET** `/api/v1/license/{payment_id}`

**Response:**
```json
{
  "success": true,
  "license": {
    "key": "INQ-BZTKR-XXXX-XXXX",
    "email": "user@example.com",
    "plan": "PRO",
    "used": false,
    "created_at": "2024-12-05T00:00:00Z",
    "payment_id": "PAY123456",
    "payment_provider": "instamojo"
  }
}
```

---

### 4. License Success Page (HTML)

**GET** `/api/v1/license/page/{payment_id}`

Returns a beautiful HTML page showing:
- ✅ Payment success message
- 🔑 License key (with copy button)
- 📧 Email confirmation
- 💰 Payment details
- 🔗 "Activate License" button

Perfect for redirecting users after payment!

---

### 5. Trigger Event Email

**POST** `/api/v1/license/trigger-event-email`

```json
{
  "event_type": "welcome_email",
  "user_email": "user@example.com",
  "metadata": {
    "name": "John Doe",
    "dashboard_url": "https://biztrackr.com/dashboard"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email 'welcome_email' sent to user@example.com"
}
```

---

### 6. Admin: List All Licenses

**GET** `/api/v1/license/admin/list?skip=0&limit=100&email=user@example.com`

**Requires:** Authentication

**Response:**
```json
{
  "success": true,
  "count": 25,
  "licenses": [...]
}
```

---

### 7. Admin: License Statistics

**GET** `/api/v1/license/admin/stats`

**Requires:** Authentication

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_licenses": 100,
    "used_licenses": 75,
    "unused_licenses": 25,
    "activation_rate": 75.0
  }
}
```

---

## 💳 Payment Webhooks

### Instamojo Webhook

**POST** `/webhook/instamojo`

**Webhook URL:** `https://api.biztrackr.com/webhook/instamojo`

**Expected Payload:**
```json
{
  "status": "Credit",
  "payment_id": "MOJO123456",
  "buyer": "user@example.com",
  "buyer_name": "John Doe",
  "buyer_phone": "+91XXXXXXXXXX",
  "amount": "999.00",
  "currency": "INR"
}
```

**Flow:**
1. ✅ Validates required fields
2. ✅ Checks payment status == "Credit"
3. ✅ Checks idempotency (prevents duplicates)
4. ✅ Generates unique license key
5. ✅ Stores in database
6. ✅ Sends "license_issued" email
7. ✅ Sends "payment_success" email
8. ✅ Returns 200 OK

---

### PayPal Webhook

**POST** `/webhook/paypal`

**Webhook URL:** `https://api.biztrackr.com/webhook/paypal`

**Expected Event:** `PAYMENT.CAPTURE.COMPLETED`

**Flow:** Same as Instamojo, adapted for PayPal event structure

---

## 🎨 Email Template Examples

### 1. License Issued Email

```python
email_service.send_event_email(
    event_type="license_issued",
    user_email="user@example.com",
    metadata={
        "key": "INQ-BZTKR-A8K9-P3M7",
        "plan": "PRO",
        "activation_url": "https://biztrackr.com/activate"
    }
)
```

### 2. Payment Success Email

```python
email_service.send_event_email(
    event_type="payment_success",
    user_email="user@example.com",
    metadata={
        "amount": "999.00",
        "currency": "INR",
        "payment_id": "MOJO123456",
        "plan": "PRO"
    }
)
```

### 3. Welcome Email

```python
email_service.send_event_email(
    event_type="welcome_email",
    user_email="user@example.com",
    metadata={
        "name": "John Doe",
        "dashboard_url": "https://biztrackr.com/dashboard"
    }
)
```

### 4. Password Reset Email

```python
email_service.send_event_email(
    event_type="password_reset",
    user_email="user@example.com",
    metadata={
        "reset_link": "https://biztrackr.com/reset-password?token=xxxxx"
    }
)
```

---

## 🔄 Complete Payment Flow

```
┌─────────────────┐
│  User Payment   │
│  (Instamojo/    │
│   PayPal)       │
└────────┬────────┘
         │
         │ Payment Success
         ▼
┌─────────────────┐
│ Payment Provider│
│ Sends Webhook   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  /webhook/instamojo or /paypal  │
│                                 │
│  1. Validate payment            │
│  2. Check idempotency           │
│  3. Generate license key        │
│  4. Store in database           │
│  5. Send emails                 │
└────────┬────────────────────────┘
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌─────────────┐
│ License Issued │  │   Payment    │  │  Success    │
│     Email      │  │ Success Email│  │    Page     │
└────────────────┘  └──────────────┘  └─────────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  User Receives   │
                  │  License Key     │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ User Activates   │
                  │ via /activate    │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Account Upgraded │
                  │    to PRO        │
                  └──────────────────┘
```

---

## 🧪 Testing

### Test Email Sending

```python
from app.services import email_service

# Test basic email
result = email_service.send_email(
    to="test@example.com",
    subject="Test Email",
    html="<h1>Hello World!</h1>"
)

print(result)  # {'success': True, 'response': {...}}
```

### Test License Generation

```python
from app.services import license_service

# Generate license
license_key = license_service.generate_license_key()
print(license_key)  # INQ-BZTKR-XXXX-XXXX
```

### Test Webhook (Using curl)

```bash
curl -X POST https://api.biztrackr.com/webhook/instamojo \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Credit",
    "payment_id": "TEST123",
    "buyer": "test@example.com",
    "buyer_name": "Test User",
    "amount": "999.00",
    "currency": "INR"
  }'
```

### Test License Activation

```bash
curl -X POST https://api.biztrackr.com/api/v1/license/activate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "license_key": "INQ-BZTKR-XXXX-XXXX"
  }'
```

---

## 🔐 Security Features

- ✅ **Email Validation** - Ensures license matches email
- ✅ **One-Time Use** - Prevents license key reuse
- ✅ **Idempotent Webhooks** - Prevents duplicate processing
- ✅ **Unique Key Generation** - Collision detection with retry
- ✅ **Database Constraints** - Unique payment_id and license key
- ✅ **Input Validation** - Pydantic models for all requests
- ✅ **Error Handling** - Comprehensive try-catch blocks
- ✅ **Logging** - Full audit trail of all operations

---

## 📊 Database Migration

Create and apply the migration:

```bash
# Generate migration
alembic revision --autogenerate -m "Add licenses table with payment tracking"

# Review the migration file in /migrations

# Apply migration
alembic upgrade head

# Verify
psql -U postgres -d biztrackr -c "SELECT * FROM licenses LIMIT 1;"
```

---

## 🎯 Production Checklist

- [ ] ✅ Resend domain verified
- [ ] ✅ RESEND_API_KEY configured
- [ ] ✅ Database migrated
- [ ] ✅ Instamojo webhook configured
- [ ] ✅ PayPal webhook configured
- [ ] ✅ Frontend URLs updated in .env
- [ ] ✅ Email templates tested
- [ ] ✅ License activation flow tested
- [ ] ✅ Error monitoring enabled (Sentry)
- [ ] ✅ Webhook endpoints secured (HTTPS)
- [ ] ✅ Rate limiting configured
- [ ] ✅ Backup strategy in place

---

## 🆘 Troubleshooting

### Email Not Sending

1. Check RESEND_API_KEY is set correctly
2. Verify domain in Resend dashboard
3. Check sender email matches verified domain
4. Review logs for API errors

### License Not Generated

1. Check webhook payload format
2. Verify payment status == "Credit"
3. Check database connection
4. Review logs for errors

### Activation Failing

1. Verify email matches license email
2. Check if license already used
3. Ensure license key format is correct
4. Check database for license existence

---

## 📚 Additional Resources

- **Resend Docs:** https://resend.com/docs
- **Instamojo Webhooks:** https://docs.instamojo.com/docs/webhooks
- **PayPal Webhooks:** https://developer.paypal.com/docs/api-basics/notifications/webhooks/
- **FastAPI Docs:** https://fastapi.tiangolo.com/

---

## 🎉 You're All Set!

Your BizTrackr email + license system is now **production-ready**! 

For support, create an issue or contact the development team.

**Built with ❤️ for BizTrackr V2**
