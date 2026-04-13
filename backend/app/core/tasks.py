import taskiq_fastapi
from taskiq import RedisAsyncBroker
from taskiq.receiver import Receiver
from app.core.config import settings

# Initialize Redis Broker
broker = RedisAsyncBroker(url=settings.REDIS_URL)

# Initialize Taskiq App
# This will be used to track tasks across the application
app = taskiq_fastapi.TaskiqDepends(broker)

from app.services import email_service

@broker.task
async def send_transactional_email_task(to: str, subject: str, html: str, reply_to: str = None) -> None:
    """Background task to send emails via Resend."""
    email_service.send_email(to, subject, html, reply_to)

@broker.task
async def send_event_email_task(event_type: str, user_email: str, metadata: dict) -> None:
    """Background task to send event-based emails."""
    email_service.send_event_email(event_type, user_email, metadata)

@broker.task
async def send_upgrade_request_notification_task(admin_email: str, user_email: str, company_name: str, plan: str, request_id: int) -> None:
    """Background task for upgrade request notifications."""
    email_service.send_upgrade_request_notification(admin_email, user_email, company_name, plan, request_id)
