import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_API_KEY

def create_checkout_session(tenant_id: int, plan_type: str):
    # Map plan_type to Stripe Price ID
    price_id = "price_H5ggYwtDq4fbrJ" # Example
    if plan_type == "pro":
        price_id = "price_H5ggYwtDq4fbrJ_pro"
    
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
            success_url='http://localhost:3000/dashboard/settings?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/dashboard/settings',
            metadata={
                "tenant_id": str(tenant_id)
            }
        )
        return checkout_session.url
    except Exception as e:
        return None

def handle_webhook(payload, sig_header):
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
        # Update tenant subscription status in DB
        # db_update_tenant_status(tenant_id, "active")
        print(f"Subscription active for tenant {tenant_id}")

    return True
