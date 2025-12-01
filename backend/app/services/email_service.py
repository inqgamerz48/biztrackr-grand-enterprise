import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_email(to_email: str, subject: str, body: str):
    # Mock email sending if no SMTP config
    # In production, use settings.SMTP_SERVER, etc.
    print(f"========================================")
    print(f"SENDING EMAIL TO: {to_email}")
    print(f"SUBJECT: {subject}")
    print(f"BODY: {body}")
    print(f"========================================")
    return True

def send_upgrade_request_notification(admin_email: str, user_email: str, company_name: str, plan: str, request_id: int):
    subject = f"New Upgrade Request: {company_name}"
    approve_link = f"{settings.API_V1_STR}/super-admin/approve/{request_id}" # In real app, this would be a frontend link
    reject_link = f"{settings.API_V1_STR}/super-admin/reject/{request_id}"
    
    body = f"""
    User {user_email} from {company_name} has requested an upgrade to {plan}.
    
    Approve: {approve_link}
    Reject: {reject_link}
    """
    send_email(admin_email, subject, body)

def send_upgrade_status_email(user_email: str, status: str, plan: str):
    subject = f"Upgrade Request {status.capitalize()}"
    body = f"Your request to upgrade to {plan} has been {status}."
    send_email(user_email, subject, body)
