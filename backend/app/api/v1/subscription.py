from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.services.stripe_service import StripeService
from app.models.user import User
# Assuming you have a Subscription model, if not we might need to mock or create it. 
# For now, I'll assume basic user fields or a separate table.
# from app.models.subscription import Subscription 

router = APIRouter()

# Mock Price IDs - in production these come from Stripe Dashboard
PRICES = {
    "pro": "price_H5ggYJDqQJ7",
    "enterprise": "price_H5ggYJDqQJ8"
}

@router.post("/checkout")
def create_checkout_session(plan: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if plan not in PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
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

    return {"url": session.url}

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
