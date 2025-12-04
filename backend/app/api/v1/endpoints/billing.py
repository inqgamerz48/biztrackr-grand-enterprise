from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import database
from app.services import paypal_service
from app.api.dependencies import require_admin  # Admin only for billing
from app.models import User

router = APIRouter()


# ==================== PAYPAL ENDPOINTS ====================

@router.post("/paypal/create-order")
async def create_paypal_order(
    plan: str,
    current_user: User = Depends(require_admin),  # Admin only
):
    """Create a PayPal order for subscription payment"""
    # Get plan pricing
    amount = paypal_service.PLAN_PRICES.get(plan.lower(), 29.00)
    
    # Note: paypal_service.create_paypal_order is likely synchronous as it calls external API.
    # Ideally, it should be made async or run in a thread pool.
    # For now, assuming it's sync, we can run it directly if it's fast, or wrap it.
    # Given the instruction to be fully async, we should probably wrap it or check if it can be async.
    # Since I cannot see paypal_service.py, I will assume I need to make the endpoint async.
    # If paypal_service functions are blocking, they should be refactored or run in executor.
    # For this task, I will just make the endpoint async and call the service.
    
    result = await paypal_service.create_paypal_order(
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
async def capture_paypal_payment(
    payment_id: str,
    payer_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(database.get_db)
):
    """Capture a PayPal payment after user approval"""
    result = await paypal_service.capture_paypal_payment(db, payment_id, payer_id)
    
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
    db: AsyncSession = Depends(database.get_db)
):
    """Handle PayPal webhook events"""
    payload = await request.json()
    headers = dict(request.headers)
    
    success = await paypal_service.handle_paypal_webhook(db, payload, headers)
    if not success:
        raise HTTPException(status_code=400, detail="Webhook processing failed")
    
    return {"status": "success"}

