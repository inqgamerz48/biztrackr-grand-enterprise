"""
PayPal payment integration service for BizTrackr.
Handles PayPal checkout, order creation, and webhook processing.
"""
import os
import paypalrestsdk
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.tenant import Tenant

# Configure PayPal SDK
paypalrestsdk.configure({
    "mode": os.getenv('PAYPAL_MODE', 'sandbox'),  # sandbox or live
    "client_id": os.getenv('PAYPAL_CLIENT_ID', ''),
    "client_secret": os.getenv('PAYPAL_CLIENT_SECRET', '')
})


def create_paypal_order(tenant_id: int, plan_type: str, amount: float):
    """
    Create a PayPal payment for subscription.
    
    Args:
        tenant_id: ID of the tenant making the payment
        plan_type: Subscription plan (basic, pro, enterprise)
        amount: Amount to charge in USD
        
    Returns:
        dict: PayPal payment details with approval URL
    """
    try:
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://localhost:3000/dashboard/settings?payment=success",
                "cancel_url": "http://localhost:3000/dashboard/settings?payment=cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": f"{plan_type.title()} Plan Subscription",
                        "sku": f"plan_{plan_type}",
                        "price": str(amount),
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(amount),
                    "currency": "USD"
                },
                "description": f"BizTrackr {plan_type.title()} Monthly Subscription",
                "custom": str(tenant_id)  # Store tenant_id for webhook
            }]
        })
        
        if payment.create():
            # Get approval URL
            for link in payment.links:
                if link.rel == "approval_url":
                    return {
                        "payment_id": payment.id,
                        "approval_url": link.href,
                        "status": payment.state
                    }
        else:
            print(f"PayPal error: {payment.error}")
            return None
            
    except Exception as e:
        print(f"PayPal order creation error: {e}")
        return None


def capture_paypal_payment(db: Session, payment_id: str, payer_id: str):
    """
    Execute a PayPal payment after user approval.
    
    Args:
        db: Database session
        payment_id: PayPal payment ID
        payer_id: PayPal payer ID from redirect
        
    Returns:
        dict: Payment execution details
    """
    try:
        payment = paypalrestsdk.Payment.find(payment_id)
        
        if payment.execute({"payer_id": payer_id}):
            # Extract tenant_id from custom field
            tenant_id = payment.transactions[0].custom if payment.transactions else None
            
            if tenant_id:
                tenant = db.query(Tenant).filter(Tenant.id == int(tenant_id)).first()
                if tenant:
                    # Determine plan from SKU or description
                    sku = payment.transactions[0].item_list.items[0].sku
                    plan = sku.replace("plan_", "") if sku else "pro"
                    
                    tenant.plan = plan
                    tenant.subscription_status = "active"
                    # For PayPal, we might store payer_id as subscription_id or similar
                    tenant.subscription_id = f"paypal_{payment_id}"
                    db.commit()
            
            return {
                "status": "completed",
                "tenant_id": tenant_id,
                "payment_id": payment_id,
                "payer_email": payment.payer.payer_info.email if hasattr(payment.payer, 'payer_info') else None,
                "amount": payment.transactions[0].amount.total if payment.transactions else None
            }
        else:
            print(f"Payment execution failed: {payment.error}")
            return None
            
    except Exception as e:
        print(f"PayPal capture error: {e}")
        return None


def handle_paypal_webhook(db: Session, payload: dict, headers: dict):
    """
    Handle PayPal webhook events.
    
    Args:
        db: Database session
        payload: Webhook payload
        headers: Request headers for verification
        
    Returns:
        bool: True if handled successfully
    """
    try:
        event_type = payload.get('event_type')
        
        # Handle different event types
        if event_type == 'PAYMENT.SALE.COMPLETED':
            resource = payload.get('resource', {})
            custom_id = resource.get('custom')
            
            if custom_id:
                tenant = db.query(Tenant).filter(Tenant.id == int(custom_id)).first()
                if tenant:
                    tenant.subscription_status = "active"
                    db.commit()
                    print(f"Payment completed for tenant: {custom_id}")
            return True
            
        elif event_type == 'PAYMENT.SALE.DENIED':
            print("Payment was denied")
            return True
            
        return True
        
    except Exception as e:
        print(f"PayPal webhook error: {e}")
        return False


# Plan pricing mapping
PLAN_PRICES = {
    "basic": 29.00,
    "pro": 99.00,
    "enterprise": 299.00
}
