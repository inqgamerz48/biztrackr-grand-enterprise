# BizTrackr V2 - Gmail Email Configuration Guide

## 📧 Using srivatsananduri4@gmail.com for Sending Emails

You've configured the system to send emails from **srivatsananduri4@gmail.com**.

---

## ⚠️ IMPORTANT: Resend API Limitation

**Resend API requires domain verification**, which means:

❌ **You CANNOT directly send from Gmail addresses** (gmail.com is not your domain)

### ✅ **Solution Options:**

---

## **Option 1: Use Resend with Your Own Domain (RECOMMENDED)**

### Setup Steps:

1. **Get a Custom Domain** (if you don't have one)
   - Purchase from: Namecheap, GoDaddy, Google Domains
   - Example: `biztrackr.com`

2. **Verify Domain in Resend**
   - Go to: https://resend.com/domains
   - Add your domain
   - Add DNS records (MX, TXT, DKIM)
   - Wait for verification

3. **Update Sender Email**
   - Use: `BizTrackr <noreply@yourdomain.com>`
   - Or: `BizTrackr <hello@yourdomain.com>`

4. **Keep Gmail as Reply-To**
   - Users can reply to your Gmail
   - You receive responses in Gmail inbox

### Code Update:
```python
# In email_service.py
SENDER_EMAIL = "BizTrackr <noreply@yourdomain.com>"

# In send_email function
params = {
    "from": SENDER_EMAIL,
    "to": [to],
    "subject": subject,
    "html": html,
    "reply_to": "srivatsananduri4@gmail.com"  # Replies go to your Gmail
}
```

---

## **Option 2: Use Gmail SMTP Directly (Not Resend)**

If you want to keep using Gmail address, switch from Resend to Gmail SMTP.

### Requirements:
- Enable 2-Factor Authentication on Gmail
- Generate App Password

### Setup:

1. **Enable 2FA:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - App: "Mail"
   - Device: "Custom (BizTrackr)"
   - Copy the 16-character password

3. **Update .env:**
```env
# Remove Resend
# RESEND_API_KEY=...

# Add Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=srivatsananduri4@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM=BizTrackr <srivatsananduri4@gmail.com>
```

4. **Update email_service.py:**
```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to: str, subject: str, html: str):
    """Send email using Gmail SMTP"""
    msg = MIMEMultipart('alternative')
    msg['From'] = os.getenv("SMTP_FROM")
    msg['To'] = to
    msg['Subject'] = subject
    
    msg.attach(MIMEText(html, 'html'))
    
    with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as server:
        server.starttls()
        server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
        server.send_message(msg)
    
    return {"success": True}
```

**⚠️ Gmail Limits:**
- **500 emails/day** (free Gmail)
- **2,000 emails/day** (Google Workspace)

---

## **Option 3: Use Resend Test Domain (FOR TESTING ONLY)**

For development/testing, use Resend's sandbox:

```python
SENDER_EMAIL = "BizTrackr <onboarding@resend.dev>"
```

**Note:** Emails will have `via resend.dev` in headers.

---

## **Option 4: SendGrid with Gmail Address**

SendGrid allows single-sender verification without domain verification.

### Setup:

1. **Sign up:** https://sendgrid.com
2. **Verify Single Sender:**
   - Settings → Sender Authentication
   - Verify `srivatsananduri4@gmail.com`
   - Click verification link in email
3. **Get API Key**
4. **Use SendGrid Python Library**

```bash
pip install sendgrid
```

```python
import sendgrid
from sendgrid.helpers.mail import Mail

def send_email(to, subject, html):
    sg = sendgrid.SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))
    
    message = Mail(
        from_email='srivatsananduri4@gmail.com',
        to_emails=to,
        subject=subject,
        html_content=html
    )
    
    response = sg.send(message)
    return {"success": True}
```

**SendGrid Free Tier:** 100 emails/day

---

## **RECOMMENDED SOLUTION FOR PRODUCTION:**

### **Use Option 1 (Custom Domain + Resend)**

**Why?**
- ✅ Professional appearance
- ✅ Better deliverability
- ✅ No daily limits (Resend: 100 emails/day free, then paid)
- ✅ Better email tracking
- ✅ Dedicated IP option
- ✅ Replies can still go to Gmail

### **Quick Setup:**

1. Buy domain: `biztrackr.in` or `biztrackr.com` (~$10-15/year)
2. Add to Resend and verify DNS
3. Send from: `hello@biztrackr.com`
4. Reply-to: `srivatsananduri4@gmail.com`

**Users will see:**
- From: `BizTrackr <hello@biztrackr.com>`
- Reply goes to: `srivatsananduri4@gmail.com`

---

## **Current Configuration**

Your system is currently set to:

```python
SENDER_EMAIL = "BizTrackr <srivatsananduri4@gmail.com>"
```

**This will FAIL with Resend** until you verify a domain.

### **Quick Fix for Immediate Testing:**

Add to `.env`:
```env
EMAIL_FROM=BizTrackr <onboarding@resend.dev>
```

This uses Resend's test domain and will work immediately.

---

## **How to Update**

### **For Testing (Right Now):**
```bash
cd backend
echo 'EMAIL_FROM=BizTrackr <onboarding@resend.dev>' >> .env
```

### **For Production (After Domain Verification):**
```bash
cd backend
echo 'EMAIL_FROM=BizTrackr <hello@yourdomain.com>' >> .env
```

---

## **Environment Variable Priority**

The system checks in this order:
1. `.env` file: `EMAIL_FROM` variable
2. Default in code: `srivatsananduri4@gmail.com`

So you can override by setting `EMAIL_FROM` in your `.env` file.

---

## **Summary**

| Option | Cost | Setup Time | Email Limit | Deliverability |
|--------|------|------------|-------------|----------------|
| Custom Domain + Resend | $10-15/year | 1-2 hours | 100/day free | ⭐⭐⭐⭐⭐ |
| Gmail SMTP | Free | 10 mins | 500/day | ⭐⭐⭐ |
| SendGrid | Free-$20/mo | 30 mins | 100/day free | ⭐⭐⭐⭐ |
| Resend Test Domain | Free | 2 mins | 100/day | ⭐⭐ (testing only) |

---

## **Recommendation**

1. **For immediate testing:** Use Resend test domain
2. **For production:** Get a custom domain (~$12/year)
3. **Quick alternative:** Use Gmail SMTP (but has limits)

---

## **Need Help?**

- Resend Docs: https://resend.com/docs
- Gmail SMTP Guide: https://support.google.com/mail/answer/7126229
- SendGrid Docs: https://docs.sendgrid.com

---

**Current Status:** ⚠️ Email configured but needs domain verification or SMTP setup to work.
