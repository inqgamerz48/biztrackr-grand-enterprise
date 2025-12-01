from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.core import database
from app.services import paypal_service
from app.api.dependencies import require_admin  # Admin only for billing
from app.models import User

router = APIRouter()


# ==================== PAYPAL ENDPOINTS ====================

@router.post("/paypal/create-order")
def create_paypal_order(
    plan: str,
    current_user: User = Depends(require_admin),  # Admin only
):
    """Create a PayPal order for subscription payment"""
    # Get plan pricing
    amount = paypal_service.PLAN_PRICES.get(plan.lower(), 29.00)
    
    result = paypal_service.create_paypal_order(
        tenant_id=current_user.tenant_id,
        plan_type=plan,
        amount=amount
    )
    
    if not result:
        raise HTTPException(status_code=400, detail="PayPal order creation failed")
    
    return {
        "order_id": result["order_id"],
        "approval_url": result["approval_url"],
        "gateway": "paypal"
    }

@router.post("/paypal/capture-payment")
def capture_paypal_payment(
    payment_id: str,
    payer_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(database.get_db)
):
    """Capture a PayPal payment after user approval"""
    result = paypal_service.capture_paypal_payment(db, payment_id, payer_id)
    
    if not result or result["status"] != "completed":
        raise HTTPException(status_code=400, detail="Payment capture failed")
    
    # TODO: Update tenant subscription in database
    
    return {
        "status": "success",
        "payment_id": payment_id,
        "message": "Payment captured successfully"
    }

@router.post("/paypal/webhook")
async def paypal_webhook(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """Handle PayPal webhook events"""
    payload = await request.json()
    headers = dict(request.headers)
    
    success = paypal_service.handle_paypal_webhook(db, payload, headers)
    if not success:
        raise HTTPException(status_code=400, detail="Webhook processing failed")
    
    return {"status": "success"}

