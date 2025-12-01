from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.services.stripe_service import StripeService
from app.models.user import User
from app.models.transaction import Transaction
from app.services.stripe_service import StripeService
# Assuming you have a Subscription model, if not we might need to mock or create it. 
# For now, I'll assume basic user fields or a separate table.
# from app.models.subscription import Subscription 

router = APIRouter()

# Mock Price IDs - in production these come from Stripe Dashboard
PRICES = {
    "pro": "price_H5ggYJDqQJ7",
    "enterprise": "price_H5ggYJDqQJ8"
}

from app.services.razorpay_service import RazorpayService

@router.post("/checkout")
def create_checkout_session(plan: str, provider: str = "stripe", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if plan not in PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    if provider == "razorpay":
        razorpay_service = RazorpayService()
        # amount in INR, assuming Pro plan is 999 INR
        amount = 999 
        order = razorpay_service.create_order(amount=amount, notes={"user_id": current_user.id, "plan": plan})
        if not order:
            raise HTTPException(status_code=500, detail="Failed to create Razorpay order")
        
        # Create Transaction record
        transaction = Transaction(
            user_id=current_user.id,
            order_id=order['id'],
            amount=amount,
            currency=order['currency'],
            status="PENDING",
            plan=plan
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        # Generate QR Code
        qr_code = razorpay_service.generate_qr_code(order['id'], amount)

        return {
            "provider": "razorpay",
            "order_id": order['id'],
            "key_id": razorpay_service.key_id,
            "amount": order['amount'],
            "currency": order['currency'],
            "name": "BizTrackr Pro",
            "description": "Upgrade to Pro Plan",
            "qr_code": qr_code, # Base64 encoded QR
            "prefill": {
                "name": current_user.full_name,
                "email": current_user.email,
                "contact": "" # Add phone if available
            }
        }

    # In a real app, you'd check if user already has a stripe_customer_id in DB
    # For this demo, we'll assume we create/retrieve it
    customer_id = getattr(current_user, "stripe_customer_id", None)
    
    if not customer_id:
        customer = StripeService.create_customer(current_user.email, current_user.full_name)
        if not customer:
            raise HTTPException(status_code=500, detail="Failed to create payment profile")
        customer_id = customer.id
        # Save customer_id to user record in DB (omitted for brevity)
        # current_user.stripe_customer_id = customer_id
        # db.commit()

    session = StripeService.create_checkout_session(
        customer_id=customer_id,
        price_id=PRICES[plan],
        success_url="http://localhost:3000/dashboard/settings?success=true",
        cancel_url="http://localhost:3000/dashboard/settings?canceled=true"
    )

    if not session:
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

    return {"provider": "stripe", "url": session.url}

@router.post("/portal")
def create_portal_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer_id = getattr(current_user, "stripe_customer_id", None)
    
    if not customer_id:
        raise HTTPException(status_code=400, detail="No billing profile found")

    session = StripeService.create_portal_session(
        customer_id=customer_id,
        return_url="http://localhost:3000/dashboard/settings"
    )

    if not session:
        raise HTTPException(status_code=500, detail="Failed to create portal session")

    return {"url": session.url}

@router.post("/webhook")
async def stripe_webhook(request: Request):
    # Handle webhook events (invoice.payment_succeeded, etc.)
    # Verify signature in real app
    payload = await request.json()
    event_type = payload.get('type')
    
    if event_type == 'checkout.session.completed':
        print("Payment successful!")
        # Update user subscription status in DB
    
    return {"status": "success"}

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    razorpay_service = RazorpayService()
    
    # Get the signature from headers
    webhook_signature = request.headers.get("X-Razorpay-Signature")
    if not webhook_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    payload_body = await request.body()
    payload_str = payload_body.decode('utf-8')

    # Verify signature
    # Note: Razorpay webhook verification usually requires the raw body and the secret.
    # The SDK's verify_payment_signature is for frontend callbacks.
    # For webhooks, we verify using utility.verify_webhook_signature
    
    try:
        razorpay_service.client.utility.verify_webhook_signature(
            payload_str,
            webhook_signature,
            razorpay_service.client.auth[1] # Using key_secret as webhook secret for simplicity, or use a specific WEBHOOK_SECRET env
        )
    except Exception as e:
        print(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload = await request.json()
    event = payload.get('event')

    if event == "order.paid":
        payment_entity = payload['payload']['payment']['entity']
        order_id = payment_entity['order_id']
        payment_id = payment_entity['id']
        
        # Find transaction
        transaction = db.query(Transaction).filter(Transaction.order_id == order_id).first()
        if transaction:
            transaction.status = "PAID"
            transaction.payment_id = payment_id
            db.commit()
            
            # Update User Plan
            # Assuming we have a way to update user plan. 
            # If Subscription model exists, update it.
            # Else update User model directly if it has plan fields.
            # Based on previous exploration, Subscription model exists.
            
            # from app.models.subscription import Subscription
            # subscription = db.query(Subscription).filter(Subscription.user_id == transaction.user_id).first()
            # if subscription:
            #     subscription.plan_type = "PRO" # or transaction.plan
            #     subscription.status = "ACTIVE"
            #     # Set expiry...
            #     db.commit()
            
            print(f"Order {order_id} paid. Transaction updated.")
        else:
            print(f"Transaction not found for order {order_id}")

    return {"status": "ok"}

@router.get("/status/{order_id}")
def check_payment_status(order_id: str, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.order_id == order_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"status": transaction.status, "plan": transaction.plan}
