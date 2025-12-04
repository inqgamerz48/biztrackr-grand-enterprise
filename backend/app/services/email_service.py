"""
BizTrackr V2 - Transactional Email Service using Resend API
Complete email module with HTML templates and event-based sending
"""

import os
from typing import Dict, Optional
import resend
from app.core.config import settings

# Initialize Resend API
resend.api_key = os.getenv("RESEND_API_KEY", "")

# Email sender configuration
# VENDOR CONFIGURATION REQUIRED:
# Set EMAIL_FROM in .env to your verified email/domain
# Examples:
#   - Resend test: "onboarding@resend.dev"
#   - Custom domain: "noreply@yourdomain.com"
#   - Gmail SMTP: "your-email@gmail.com" (requires SMTP setup)
# See GMAIL_EMAIL_SETUP.md for configuration options
SENDER_EMAIL = os.getenv("EMAIL_FROM", "BizTrackr <noreply@yourdomain.com>")
BIZTRACKR_COLORS = {
    "dark_gray": "#1F2937",
    "green": "#10B981",
    "light_gray": "#F3F4F6",
    "white": "#FFFFFF",
    "accent": "#3B82F6"
}


def send_email(to: str, subject: str, html: str, reply_to: Optional[str] = None) -> Dict:
    """
    Core email sending function using Resend API
    
    Args:
        to: Recipient email address
        subject: Email subject line
        html: HTML content
        reply_to: Optional reply-to address
        
    Returns:
        Response from Resend API
    """
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        
        if reply_to:
            params["reply_to"] = reply_to
            
        response = resend.Emails.send(params)
        print(f"✅ Email sent to {to}: {subject}")
        return {"success": True, "response": response}
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        return {"success": False, "error": str(e)}


def send_event_email(event_type: str, user_email: str, metadata: Dict) -> Dict:
    """
    Event-based email dispatcher
    Routes to appropriate template based on event type
    
    Args:
        event_type: Type of event (welcome_email, license_issued, etc.)
        user_email: Recipient email
        metadata: Event-specific data
        
    Returns:
        Email sending result
    """
    template_map = {
        "welcome_email": generate_welcome_email,
        "license_issued": generate_license_issued_email,
        "payment_success": generate_payment_success_email,
        "inventory_added": generate_inventory_added_email,
        "sale_made": generate_sale_made_email,
        "invoice_generated": generate_invoice_generated_email,
        "password_reset": generate_password_reset_email,
        "generic_notification": generate_generic_notification_email,
    }
    
    template_function = template_map.get(event_type)
    
    if not template_function:
        return {"success": False, "error": f"Unknown event type: {event_type}"}
    
    subject, html = template_function(metadata)
    return send_email(user_email, subject, html)


# ==========================================
# HTML TEMPLATE GENERATORS
# ==========================================

def get_email_base_template(content: str, title: str = "BizTrackr") -> str:
    """Base email template with consistent styling"""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: {BIZTRACKR_COLORS['light_gray']};">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: {BIZTRACKR_COLORS['white']}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, {BIZTRACKR_COLORS['dark_gray']} 0%, {BIZTRACKR_COLORS['green']} 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: {BIZTRACKR_COLORS['white']}; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                📊 BizTrackr
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                                Professional Business Management Platform
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: {BIZTRACKR_COLORS['light_gray']}; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #6B7280;">
                                © 2024 BizTrackr. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                                You received this email because you are a BizTrackr user.<br>
                                If you have questions, reply to this email or visit our support center.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def generate_welcome_email(metadata: Dict) -> tuple:
    """Welcome email for new users"""
    name = metadata.get("name", "there")
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        Welcome to BizTrackr! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Hi {name},
    </p>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Thank you for choosing BizTrackr! We're excited to help you streamline your business operations and take your business to the next level.
    </p>
    
    <div style="background-color: {BIZTRACKR_COLORS['light_gray']}; border-left: 4px solid {BIZTRACKR_COLORS['green']}; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 12px; color: {BIZTRACKR_COLORS['dark_gray']}; font-weight: 600; font-size: 16px;">
            🚀 Quick Start Guide:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">Set up your business profile</li>
            <li style="margin-bottom: 8px;">Add your first inventory items</li>
            <li style="margin-bottom: 8px;">Create your first invoice</li>
            <li style="margin-bottom: 8px;">Track your sales and expenses</li>
        </ul>
    </div>
    
    <a href="{metadata.get('dashboard_url', '#')}" style="display: inline-block; background-color: {BIZTRACKR_COLORS['green']}; color: {BIZTRACKR_COLORS['white']}; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0;">
        Go to Dashboard →
    </a>
    
    <p style="margin: 24px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
        Need help? Our support team is here for you 24/7.
    </p>
    """
    
    return ("Welcome to BizTrackr! 🎉", get_email_base_template(content, "Welcome to BizTrackr"))


def generate_license_issued_email(metadata: Dict) -> tuple:
    """Email sent when a license key is generated"""
    license_key = metadata.get("key", "")
    plan = metadata.get("plan", "PRO")
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        Your BizTrackr {plan} License Key 🔑
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Thank you for upgrading to BizTrackr {plan}! Your license key has been successfully generated.
    </p>
    
    <div style="background: linear-gradient(135deg, {BIZTRACKR_COLORS['green']} 0%, {BIZTRACKR_COLORS['accent']} 100%); padding: 30px; margin: 24px 0; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 10px; color: {BIZTRACKR_COLORS['white']}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            Your License Key
        </p>
        <div style="background-color: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 8px; margin: 10px 0;">
            <code style="color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px; font-weight: 700; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                {license_key}
            </code>
        </div>
        <p style="margin: 10px 0 0; color: {BIZTRACKR_COLORS['white']}; font-size: 12px;">
            Please save this key in a secure location
        </p>
    </div>
    
    <div style="background-color: {BIZTRACKR_COLORS['light_gray']}; border-left: 4px solid {BIZTRACKR_COLORS['accent']}; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 12px; color: {BIZTRACKR_COLORS['dark_gray']}; font-weight: 600;">
            📝 Next Steps:
        </p>
        <ol style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">Log in to your BizTrackr account</li>
            <li style="margin-bottom: 8px;">Go to Settings → License</li>
            <li style="margin-bottom: 8px;">Enter your license key</li>
            <li style="margin-bottom: 8px;">Enjoy all {plan} features!</li>
        </ol>
    </div>
    
    <a href="{metadata.get('activation_url', '#')}" style="display: inline-block; background-color: {BIZTRACKR_COLORS['dark_gray']}; color: {BIZTRACKR_COLORS['white']}; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0;">
        Activate License Now →
    </a>
    
    <p style="margin: 24px 0 0; color: #EF4444; font-size: 13px; line-height: 1.6;">
        ⚠️ Important: This license key can only be used once. Keep it confidential and do not share it with others.
    </p>
    """
    
    return (f"Your BizTrackr {plan} License Key", get_email_base_template(content, "License Key Issued"))


def generate_payment_success_email(metadata: Dict) -> tuple:
    """Payment confirmation email"""
    amount = metadata.get("amount", "0.00")
    currency = metadata.get("currency", "USD")
    payment_id = metadata.get("payment_id", "")
    plan = metadata.get("plan", "PRO")
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        Payment Successful ✅
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Your payment has been processed successfully. Thank you for your purchase!
    </p>
    
    <div style="background-color: {BIZTRACKR_COLORS['light_gray']}; padding: 24px; margin: 24px 0; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Amount Paid:</td>
                <td style="padding: 8px 0; color: {BIZTRACKR_COLORS['dark_gray']}; font-weight: 600; text-align: right;">{currency} {amount}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Plan:</td>
                <td style="padding: 8px 0; color: {BIZTRACKR_COLORS['dark_gray']}; font-weight: 600; text-align: right;">BizTrackr {plan}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Payment ID:</td>
                <td style="padding: 8px 0; color: #6B7280; font-size: 12px; font-family: monospace; text-align: right;">{payment_id}</td>
            </tr>
        </table>
    </div>
    
    <div style="background-color: #ECFDF5; border: 1px solid {BIZTRACKR_COLORS['green']}; padding: 16px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0; color: #065F46; font-size: 14px;">
            🎉 Your license key has been sent in a separate email. Please check your inbox.
        </p>
    </div>
    
    <p style="margin: 24px 0 0; color: #6B7280; font-size: 14px;">
        A receipt has been generated for your records.
    </p>
    """
    
    return ("Payment Successful - BizTrackr", get_email_base_template(content, "Payment Successful"))


def generate_inventory_added_email(metadata: Dict) -> tuple:
    """Notification when inventory is added"""
    item_name = metadata.get("item_name", "Item")
    quantity = metadata.get("quantity", 0)
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        Inventory Updated 📦
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        New inventory items have been added to your stock.
    </p>
    
    <div style="background-color: {BIZTRACKR_COLORS['light_gray']}; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px;">Item Added:</p>
        <p style="margin: 0; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 18px; font-weight: 600;">
            {item_name} (Qty: {quantity})
        </p>
    </div>
    
    <a href="{metadata.get('inventory_url', '#')}" style="display: inline-block; background-color: {BIZTRACKR_COLORS['green']}; color: {BIZTRACKR_COLORS['white']}; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 16px 0;">
        View Inventory →
    </a>
    """
    
    return ("Inventory Updated - BizTrackr", get_email_base_template(content, "Inventory Updated"))


def generate_sale_made_email(metadata: Dict) -> tuple:
    """Notification when a sale is made"""
    amount = metadata.get("amount", "0.00")
    customer = metadata.get("customer", "Customer")
    invoice_no = metadata.get("invoice_no", "")
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        New Sale Recorded! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Congratulations! A new sale has been successfully recorded in your system.
    </p>
    
    <div style="background: linear-gradient(135deg, {BIZTRACKR_COLORS['green']} 0%, #059669 100%); padding: 24px; margin: 24px 0; border-radius: 12px; color: {BIZTRACKR_COLORS['white']};">
        <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.9;">Sale Amount</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700;">${amount}</p>
        <p style="margin: 16px 0 0; font-size: 14px; opacity: 0.9;">Invoice #{invoice_no}</p>
    </div>
    
    <div style="background-color: {BIZTRACKR_COLORS['light_gray']}; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; color: #6B7280; font-size: 14px;">Customer: <strong style="color: {BIZTRACKR_COLORS['dark_gray']};">{customer}</strong></p>
    </div>
    
    <a href="{metadata.get('invoice_url', '#')}" style="display: inline-block; background-color: {BIZTRACKR_COLORS['dark_gray']}; color: {BIZTRACKR_COLORS['white']}; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 16px 0;">
        View Invoice →
    </a>
    """
    
    return ("New Sale Recorded - BizTrackr", get_email_base_template(content, "New Sale"))


def generate_invoice_generated_email(metadata: Dict) -> tuple:
    """Email when invoice is generated"""
    invoice_no = metadata.get("invoice_no", "")
    customer = metadata.get("customer", "Customer")
    amount = metadata.get("amount", "0.00")
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        Invoice Generated 📄
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        A new invoice has been generated for your customer.
    </p>
    
    <div style="background-color: {BIZTRACKR_COLORS['light_gray']}; padding: 24px; margin: 24px 0; border-radius: 8px;">
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #6B7280;">Invoice Number:</td>
                <td style="padding: 8px 0; color: {BIZTRACKR_COLORS['dark_gray']}; font-weight: 600; text-align: right;">#{invoice_no}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6B7280;">Customer:</td>
                <td style="padding: 8px 0; color: {BIZTRACKR_COLORS['dark_gray']}; font-weight: 600; text-align: right;">{customer}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6B7280;">Amount:</td>
                <td style="padding: 8px 0; color: {BIZTRACKR_COLORS['green']}; font-weight: 700; font-size: 18px; text-align: right;">${amount}</td>
            </tr>
        </table>
    </div>
    
    <a href="{metadata.get('pdf_url', '#')}" style="display: inline-block; background-color: {BIZTRACKR_COLORS['accent']}; color: {BIZTRACKR_COLORS['white']}; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 16px 0;">
        Download PDF →
    </a>
    """
    
    return (f"Invoice #{invoice_no} Generated - BizTrackr", get_email_base_template(content, "Invoice Generated"))


def generate_password_reset_email(metadata: Dict) -> tuple:
    """Password reset email"""
    reset_link = metadata.get("reset_link", "#")
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        Reset Your Password 🔒
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        We received a request to reset your BizTrackr password. Click the button below to create a new password.
    </p>
    
    <a href="{reset_link}" style="display: inline-block; background-color: {BIZTRACKR_COLORS['green']}; color: {BIZTRACKR_COLORS['white']}; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">
        Reset Password →
    </a>
    
    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #991B1B; font-size: 14px;">
            ⚠️ This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
    </div>
    
    <p style="margin: 24px 0 0; color: #6B7280; font-size: 13px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="{reset_link}" style="color: {BIZTRACKR_COLORS['accent']}; word-break: break-all;">{reset_link}</a>
    </p>
    """
    
    return ("Reset Your Password - BizTrackr", get_email_base_template(content, "Password Reset"))


def generate_generic_notification_email(metadata: Dict) -> tuple:
    """Generic notification email"""
    title = metadata.get("title", "Notification")
    message = metadata.get("message", "")
    action_text = metadata.get("action_text", "")
    action_url = metadata.get("action_url", "#")
    
    content = f"""
    <h2 style="margin: 0 0 20px; color: {BIZTRACKR_COLORS['dark_gray']}; font-size: 24px;">
        {title}
    </h2>
    
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        {message}
    </p>
    """
    
    if action_text and action_url:
        content += f"""
        <a href="{action_url}" style="display: inline-block; background-color: {BIZTRACKR_COLORS['green']}; color: {BIZTRACKR_COLORS['white']}; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 16px 0;">
            {action_text} →
        </a>
        """
    
    return (f"{title} - BizTrackr", get_email_base_template(content, title))
