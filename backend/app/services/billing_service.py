import stripe
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.tenant import Tenant

stripe.api_key = settings.STRIPE_API_KEY

def create_checkout_session(tenant_id: int, plan_type: str):
    # Map plan_type to Stripe Price ID
    price_id = "price_1Q..." # Replace with actual Stripe Price ID from env or config
    if plan_type == "pro":
        price_id = "price_1Q..." # Replace with actual Stripe Price ID
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f'{settings.SERVER_HOST}/dashboard/settings?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.SERVER_HOST}/dashboard/settings',
            metadata={
                "tenant_id": str(tenant_id),
                "plan": plan_type
            }
        )
        return checkout_session.url
    except Exception as e:
        print(f"Stripe Checkout Error: {e}")
        return None

def create_portal_session(tenant_id: int, stripe_customer_id: str):
    try:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=f'{settings.SERVER_HOST}/dashboard/settings',
        )
        return session.url
    except Exception as e:
        print(f"Stripe Portal Error: {e}")
        return None

def handle_webhook(db: Session, payload, sig_header):
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        return False
    except stripe.error.SignatureVerificationError as e:
        return False

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        tenant_id = session.get('metadata', {}).get('tenant_id')
        plan = session.get('metadata', {}).get('plan')
        stripe_customer_id = session.get('customer')
        subscription_id = session.get('subscription')

        if tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == int(tenant_id)).first()
            if tenant:
                tenant.stripe_customer_id = stripe_customer_id
                tenant.subscription_id = subscription_id
                tenant.plan = plan
                tenant.subscription_status = "active"
                db.commit()
                print(f"Subscription activated for tenant {tenant_id}")

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        # Find tenant by subscription_id or customer_id
        stripe_customer_id = subscription.get('customer')
        status = subscription.get('status')
        
        tenant = db.query(Tenant).filter(Tenant.stripe_customer_id == stripe_customer_id).first()
        if tenant:
            tenant.subscription_status = status
            db.commit()
            print(f"Subscription updated for tenant {tenant.id} to {status}")

    return True
