# 📊 BizTrackr V2 - Email + License System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BIZTRACKR EMAIL + LICENSE SYSTEM                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│                  │
│   Payment Flow   │
│                  │
└──────────────────┘

    User Payment (Instamojo/PayPal)
            │
            ▼
    ┌───────────────────┐
    │ Payment Provider  │
    │  (Instamojo/      │
    │   PayPal)         │
    └───────┬───────────┘
            │
            │ Webhook Event
            │
            ▼
    ┌────────────────────────────────────────┐
    │     BIZTRACKR BACKEND (FastAPI)       │
    │                                        │
    │  ┌──────────────────────────────────┐ │
    │  │   /webhook/instamojo             │ │
    │  │   /webhook/paypal                │ │
    │  │                                  │ │
    │  │  • Validate payload              │ │
    │  │  • Check idempotency             │ │
    │  │  • Generate license key          │ │
    │  │  • Store in PostgreSQL           │ │
    │  │  • Trigger emails                │ │
    │  └──────────┬──────────────┬────────┘ │
    │             │              │          │
    └─────────────┼──────────────┼──────────┘
                  │              │
         ┌────────┘              └────────┐
         │                                │
         ▼                                ▼
┌─────────────────┐            ┌──────────────────┐
│  LICENSE SERVICE│            │  EMAIL SERVICE   │
│                 │            │                  │
│ • generate_key()│            │ • send_email()   │
│ • create()      │            │ • send_event()   │
│ • activate()    │            │                  │
│ • verify()      │            │  ┌─────────────┐ │
│                 │            │  │  Templates  │ │
└────────┬────────┘            │  ├─────────────┤ │
         │                     │  │ • welcome   │ │
         │                     │  │ • license   │ │
         ▼                     │  │ • payment   │ │
┌─────────────────┐            │  │ • inventory │ │
│   PostgreSQL    │            │  │ • sale      │ │
│                 │            │  │ • invoice   │ │
│  ┌───────────┐  │            │  │ • pwd_reset │ │
│  │ licenses  │  │            │  │ • generic   │ │
│  ├───────────┤  │            │  └─────────────┘ │
│  │ • key     │  │            │                  │
│  │ • email   │  │            └────────┬─────────┘
│  │ • used    │  │                     │
│  │ • payment │  │                     │
│  │ • plan    │  │                     ▼
│  └───────────┘  │            ┌──────────────────┐
└─────────────────┘            │   RESEND API     │
                               │                  │
                               │  • Send emails   │
                               │  • Track status  │
                               │  • Analytics     │
                               └────────┬─────────┘
                                        │
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  User's Inbox    │
                               │                  │
                               │ 📧 License Key   │
                               │ 📧 Payment Conf. │
                               └──────────────────┘


┌──────────────────┐
│                  │
│  License Flow    │
│                  │
└──────────────────┘

    User Receives Email
            │
            ▼
    ┌────────────────────────┐
    │ GET /license/page/     │
    │     {payment_id}       │
    │                        │
    │ Beautiful Success Page │
    │ • Shows license key    │
    │ • Copy button          │
    │ • Payment details      │
    │ • Activation link      │
    └───────────┬────────────┘
                │
                │ User clicks "Activate"
                │
                ▼
    ┌──────────────────────────┐
    │ POST /license/activate   │
    │                          │
    │ {                        │
    │   email,                 │
    │   license_key            │
    │ }                        │
    └───────────┬──────────────┘
                │
                │ Validation
                │
                ▼
    ┌──────────────────────────┐
    │  License Service         │
    │                          │
    │  • Verify key exists     │
    │  • Check not used        │
    │  • Validate email match  │
    │  • Mark as used          │
    │  • Assign to user        │
    │  • Upgrade plan to PRO   │
    └───────────┬──────────────┘
                │
                ▼
    ┌──────────────────────────┐
    │  ✅ License Activated    │
    │                          │
    │  Account upgraded to PRO │
    └──────────────────────────┘


┌──────────────────┐
│                  │
│  Admin Features  │
│                  │
└──────────────────┘

    ┌──────────────────────────────────┐
    │  GET /license/admin/list         │
    │                                  │
    │  • View all licenses             │
    │  • Filter by email               │
    │  • Pagination support            │
    └──────────────────────────────────┘

    ┌──────────────────────────────────┐
    │  GET /license/admin/stats        │
    │                                  │
    │  • Total licenses                │
    │  • Used vs unused                │
    │  • Activation rate               │
    │  • Revenue tracking              │
    └──────────────────────────────────┘


┌──────────────────┐
│                  │
│  API Endpoints   │
│                  │
└──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PUBLIC ENDPOINTS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST   /webhook/instamojo                                 │
│         • Process Instamojo payment webhook                │
│                                                             │
│  POST   /webhook/paypal                                    │
│         • Process PayPal payment webhook                   │
│                                                             │
│  POST   /api/v1/license/activate                           │
│         • Activate license key                             │
│                                                             │
│  POST   /api/v1/license/verify                             │
│         • Verify active license                            │
│                                                             │
│  GET    /api/v1/license/{payment_id}                       │
│         • Get license by payment ID                        │
│                                                             │
│  GET    /api/v1/license/page/{payment_id}                  │
│         • Show beautiful success page                      │
│                                                             │
│  POST   /api/v1/license/trigger-event-email                │
│         • Trigger any event-based email                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATED ENDPOINTS                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GET    /api/v1/license/admin/list                         │
│         • List all licenses (admin only)                   │
│                                                             │
│  GET    /api/v1/license/admin/stats                        │
│         • License statistics (admin only)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌──────────────────┐
│                  │
│  Data Models     │
│                  │
└──────────────────┘

┌─────────────────────────────────────────┐
│            License Model                │
├─────────────────────────────────────────┤
│ • id: int (PK)                          │
│ • key: string (unique)                  │
│ • email: string                         │
│ • used: boolean                         │
│ • payment_id: string (unique)           │
│ • plan: string (default: "PRO")         │
│ • payment_provider: string              │
│ • payment_amount: string                │
│ • payment_currency: string              │
│ • user_id: int (FK → users)             │
│ • buyer_name: string                    │
│ • buyer_phone: string                   │
│ • created_at: timestamp                 │
│ • activated_at: timestamp               │
└─────────────────────────────────────────┘


┌──────────────────┐
│                  │
│  Email Templates │
│                  │
└──────────────────┘

┌─────────────────────────────────────────────────────┐
│                   Email Templates                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Welcome Email                                   │
│     • Sent on user registration                    │
│     • Quick start guide                            │
│     • Dashboard link                               │
│                                                     │
│  2. License Issued                                  │
│     • Sent after payment success                   │
│     • Displays license key prominently             │
│     • Activation instructions                      │
│                                                     │
│  3. Payment Success                                 │
│     • Payment confirmation                         │
│     • Receipt details                              │
│     • Plan information                             │
│                                                     │
│  4. Inventory Added                                 │
│     • Stock update notification                    │
│     • Item details                                 │
│     • View inventory link                          │
│                                                     │
│  5. Sale Made                                       │
│     • Congratulations message                      │
│     • Sale amount                                  │
│     • Invoice link                                 │
│                                                     │
│  6. Invoice Generated                               │
│     • Invoice details                              │
│     • Customer information                         │
│     • PDF download link                            │
│                                                     │
│  7. Password Reset                                  │
│     • Reset link (1 hour expiry)                   │
│     • Security notice                              │
│                                                     │
│  8. Generic Notification                            │
│     • Flexible template                            │
│     • Custom title/message                         │
│     • Optional CTA button                          │
│                                                     │
└─────────────────────────────────────────────────────┘


┌──────────────────┐
│                  │
│  Security        │
│                  │
└──────────────────┘

✅ Email Validation      • Ensures license matches email
✅ One-Time Use          • Keys can only be activated once
✅ Idempotency           • Webhooks handle duplicates
✅ Unique Keys           • Collision detection with retry
✅ Database Constraints  • Unique payment_id and keys
✅ Input Validation      • Pydantic models
✅ Error Handling        • Comprehensive try-catch
✅ Audit Logging         • Full operation trail


┌──────────────────┐
│                  │
│  Technologies    │
│                  │
└──────────────────┘

Backend:           FastAPI (Python)
Email:             Resend API
Database:          PostgreSQL (via SQLAlchemy)
Payment Webhooks:  Instamojo, PayPal
ORM:               SQLAlchemy (async)
Validation:        Pydantic v2
Migration:         Alembic
Logging:           Python logging
Error Tracking:    Sentry (optional)


┌──────────────────┐
│                  │
│  Deployment      │
│                  │
└──────────────────┘

1. Configure environment (.env)
2. Run database migrations
3. Deploy backend (Render/Vercel/AWS)
4. Configure webhooks in payment providers
5. Verify domain in Resend
6. Test email delivery
7. Monitor logs and errors

```

---

## Key Features

### 🎯 **Scalability**
- Async/await throughout
- Database connection pooling
- Efficient email queuing via Resend
- Horizontal scaling ready

### 🔒 **Security**
- Input validation on all endpoints
- Idempotent webhook processing
- One-time license use
- Email verification

### 📊 **Monitoring**
- Comprehensive logging
- License statistics
- Email delivery tracking
- Error tracking (Sentry ready)

### 🚀 **Performance**
- Async database queries
- Minimal blocking operations
- Efficient license key generation
- Cached email templates

---

## Success Metrics

- ✅ **Email Delivery Rate:** Track via Resend dashboard
- ✅ **License Activation Rate:** `/admin/stats` endpoint
- ✅ **Payment Success Rate:** Webhook success logs
- ✅ **Response Time:** FastAPI metrics
- ✅ **Error Rate:** Application logs

---

**System Status: ✅ PRODUCTION READY**
