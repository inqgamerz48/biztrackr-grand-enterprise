"""
BizTrackr V2 - Instamojo Payment Webhook Handler
Processes Instamojo payment webhooks and triggers license generation + email sending
"""

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import license_service
from app.core.tasks import send_event_email_task
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhooks"])


@router.post("/instamojo")
async def instamojo_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Instamojo Payment Webhook Handler
    
    Flow:
    1. Parse webhook JSON
    2. If status == "Credit":
       - Get buyer_email
       - Generate unique license key
       - Store key in database
       - Trigger: send_event_email("license_issued", buyer_email, {"key": license})
       - Trigger: send_event_email("payment_success", buyer_email, payment_data)
    3. Return HTTP 200
    
    Webhook is idempotent (ignores duplicates via payment_id check)
    """
    try:
        # Parse webhook payload
        payload = await request.json()
        logger.info(f"Instamojo webhook received: {payload}")
        
        # Extract payment data
        status = payload.get("status", "")
        payment_id = payload.get("payment_id", "")
        buyer_email = payload.get("buyer", "")
        buyer_name = payload.get("buyer_name", "")
        buyer_phone = payload.get("buyer_phone", "")
        amount = payload.get("amount", "0.00")
        currency = payload.get("currency", "INR")
        
        # Validate required fields
        if not payment_id or not buyer_email:
            logger.error("Missing payment_id or buyer_email in webhook payload")
            raise HTTPException(status_code=400, detail="Invalid webhook payload")
        
        # Check if payment is successful
        if status != "Credit":
            logger.info(f"Payment status is not 'Credit': {status}. Skipping.")
            return {
                "success": True,
                "message": f"Payment status '{status}' received but not processed"
            }
        
        # Check if license already exists (idempotency)
        existing_license = await license_service.get_license_by_payment_id(db, payment_id)
        
        if existing_license:
            logger.info(f"License already exists for payment_id {payment_id}. Skipping duplicate.")
            return {
                "success": True,
                "message": "License already generated for this payment",
                "license_key": existing_license.key
            }
        
        # Generate license key
        license_obj = await license_service.create_license(
            db=db,
            email=buyer_email,
            payment_id=payment_id,
            payment_provider="instamojo",
            plan="PRO",
            payment_amount=amount,
            payment_currency=currency,
            buyer_name=buyer_name,
            buyer_phone=buyer_phone
        )
        
        logger.info(f"License created: {license_obj.key} for {buyer_email}")
        
        # Send license issued email (Background Task)
        await send_event_email_task.kiwi(
            event_type="license_issued",
            user_email=buyer_email,
            metadata={
                "key": license_obj.key,
                "plan": "PRO",
                "activation_url": f"https://biztrackr.com/activate?key={license_obj.key}"
            }
        )
        
        # Send payment success email (Background Task)
        await send_event_email_task.kiwi(
            event_type="payment_success",
            user_email=buyer_email,
            metadata={
                "amount": amount,
                "currency": currency,
                "payment_id": payment_id,
                "plan": "PRO"
            }
        )
        
        logger.info(f"Emails sent to {buyer_email}")
        
        return {
            "success": True,
            "message": "Payment processed successfully",
            "license_key": license_obj.key,
            "payment_id": payment_id
        }
        
    except Exception as e:
        logger.error(f"Instamojo webhook error: {str(e)}")
        # Return 200 to prevent Instamojo from retrying
        # Log error for manual investigation
        return {
            "success": False,
            "error": str(e),
            "message": "Webhook received but processing failed"
        }


@router.post("/paypal")
async def paypal_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    PayPal Payment Webhook Handler
    
    Similar flow to Instamojo but for PayPal IPN/Webhooks
    """
    try:
        payload = await request.json()
        logger.info(f"PayPal webhook received: {payload}")
        
        # PayPal webhook structure
        event_type = payload.get("event_type", "")
        resource = payload.get("resource", {})
        
        # Handle payment capture completed
        if event_type == "PAYMENT.CAPTURE.COMPLETED":
            payment_id = resource.get("id", "")
            payer = resource.get("payer", {})
            payer_email = payer.get("email_address", "")
            payer_name = payer.get("name", {})
            full_name = f"{payer_name.get('given_name', '')} {payer_name.get('surname', '')}".strip()
            
            amount_data = resource.get("amount", {})
            amount = amount_data.get("value", "0.00")
            currency = amount_data.get("currency_code", "USD")
            
            if not payment_id or not payer_email:
                raise HTTPException(status_code=400, detail="Invalid PayPal webhook payload")
            
            # Check idempotency
            existing_license = await license_service.get_license_by_payment_id(db, payment_id)
            
            if existing_license:
                logger.info(f"License already exists for PayPal payment_id {payment_id}")
                return {
                    "success": True,
                    "message": "License already generated",
                    "license_key": existing_license.key
                }
            
            # Create license
            license_obj = await license_service.create_license(
                db=db,
                email=payer_email,
                payment_id=payment_id,
                payment_provider="paypal",
                plan="PRO",
                payment_amount=amount,
                payment_currency=currency,
                buyer_name=full_name
            )
            
            logger.info(f"License created for PayPal: {license_obj.key}")
            
            # Send emails (Background Tasks)
            await send_event_email_task.kiwi(
                event_type="license_issued",
                user_email=payer_email,
                metadata={
                    "key": license_obj.key,
                    "plan": "PRO",
                    "activation_url": f"https://biztrackr.com/activate?key={license_obj.key}"
                }
            )
            
            await send_event_email_task.kiwi(
                event_type="payment_success",
                user_email=payer_email,
                metadata={
                    "amount": amount,
                    "currency": currency,
                    "payment_id": payment_id,
                    "plan": "PRO"
                }
            )
            
            return {
                "success": True,
                "message": "PayPal payment processed",
                "license_key": license_obj.key
            }
        
        else:
            logger.info(f"PayPal event type '{event_type}' not processed")
            return {
                "success": True,
                "message": f"Event type '{event_type}' acknowledged"
            }
            
    except Exception as e:
        logger.error(f"PayPal webhook error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Webhook received but processing failed"
        }
