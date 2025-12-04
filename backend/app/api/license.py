"""
BizTrackr V2 - License Management API
Endpoints for license activation, verification, and management
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.database import get_db
from app.services import license_service, email_service
from app.models.user import User
from app.core.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/license", tags=["license"])


class LicenseActivationRequest(BaseModel):
    """License activation request schema"""
    email: EmailStr
    license_key: str


class EventEmailRequest(BaseModel):
    """Event email trigger request schema"""
    event_type: str
    user_email: EmailStr
    metadata: dict


@router.post("/activate")
async def activate_license(
    request: LicenseActivationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Activate a license key
    
    Input:
    {
        "email": "user@example.com",
        "license_key": "INQ-BZTKR-XXXX-XXXX"
    }
    
    Logic:
    1. Check if key exists
    2. Check if not used
    3. Mark as used and assign to user
    4. Upgrade user plan to PRO
    5. Return success JSON
    """
    try:
        result = await license_service.activate_license(
            db=db,
            license_key=request.license_key,
            email=request.email
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # TODO: Upgrade user's tenant plan to PRO in the database
        # This would require updating the tenant model/service
        
        logger.info(f"License activated: {request.license_key} for {request.email}")
        
        return {
            "success": True,
            "message": result["message"],
            "license": {
                "key": result["license"].key,
                "plan": result["license"].plan,
                "activated_at": result["license"].activated_at
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"License activation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Activation failed: {str(e)}")


@router.post("/verify")
async def verify_license(
    email: EmailStr,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify if user has an active license
    
    Returns license details if found and activated
    """
    try:
        license_obj = await license_service.verify_license(db, email)
        
        if not license_obj:
            return {
                "success": False,
                "has_license": False,
                "message": "No active license found"
            }
        
        return {
            "success": True,
            "has_license": True,
            "license": {
                "key": license_obj.key,
                "plan": license_obj.plan,
                "activated_at": license_obj.activated_at,
                "created_at": license_obj.created_at
            }
        }
        
    except Exception as e:
        logger.error(f"License verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{payment_id}")
async def get_license_by_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get license key by payment ID
    
    Backend logic:
    - Fetch license key from database based on payment_id
    - If not generated yet → generate
    - Return license data
    """
    try:
        license_obj = await license_service.get_license_by_payment_id(db, payment_id)
        
        if not license_obj:
            raise HTTPException(
                status_code=404,
                detail="License not found for this payment ID"
            )
        
        return {
            "success": True,
            "license": {
                "key": license_obj.key,
                "email": license_obj.email,
                "plan": license_obj.plan,
                "used": license_obj.used,
                "created_at": license_obj.created_at,
                "activated_at": license_obj.activated_at,
                "payment_id": license_obj.payment_id,
                "payment_provider": license_obj.payment_provider
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching license: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/page/{payment_id}", response_class=HTMLResponse)
async def license_success_page(
    payment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    POST-PAYMENT SUCCESS PAGE
    
    Display clean HTML page with license key
    """
    try:
        license_obj = await license_service.get_license_by_payment_id(db, payment_id)
        
        if not license_obj:
            return """
            <!DOCTYPE html>
            <html>
            <head>
                <title>License Not Found - BizTrackr</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #1F2937 0%, #10B981 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        max-width: 500px;
                        text-align: center;
                    }
                    h1 { color: #EF4444; margin-bottom: 20px; }
                    p { color: #6B7280; line-height: 1.6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ License Not Found</h1>
                    <p>We couldn't find a license associated with this payment ID.</p>
                    <p>Please contact support if you believe this is an error.</p>
                </div>
            </body>
            </html>
            """
        
        activation_url = f"/activate?key={license_obj.key}&email={license_obj.email}"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Your BizTrackr Pro License - Payment Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background: linear-gradient(135deg, #1F2937 0%, #10B981 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                }}
                .container {{
                    background: white;
                    padding: 50px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                }}
                .success-icon {{
                    font-size: 64px;
                    margin-bottom: 20px;
                    animation: bounce 1s infinite;
                }}
                @keyframes bounce {{
                    0%, 100% {{ transform: translateY(0); }}
                    50% {{ transform: translateY(-10px); }}
                }}
                h1 {{
                    color: #1F2937;
                    font-size: 28px;
                    margin-bottom: 10px;
                }}
                .subtitle {{
                    color: #6B7280;
                    font-size: 16px;
                    margin-bottom: 30px;
                }}
                .license-box {{
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    padding: 30px;
                    border-radius: 12px;
                    margin: 30px 0;
                }}
                .license-label {{
                    color: white;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                    opacity: 0.9;
                }}
                .license-key {{
                    background: rgba(255,255,255,0.95);
                    padding: 20px;
                    border-radius: 8px;
                    font-size: 24px;
                    font-weight: 700;
                    color: #1F2937;
                    letter-spacing: 2px;
                    font-family: 'Courier New', monospace;
                    word-break: break-all;
                    margin-bottom: 15px;
                }}
                .copy-btn {{
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid white;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s;
                }}
                .copy-btn:hover {{
                    background: white;
                    color: #10B981;
                }}
                .info-box {{
                    background: #F3F4F6;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: left;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #E5E7EB;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .info-label {{
                    color: #6B7280;
                    font-size: 14px;
                }}
                .info-value {{
                    color: #1F2937;
                    font-weight: 600;
                    font-size: 14px;
                }}
                .activate-btn {{
                    display: inline-block;
                    background: #1F2937;
                    color: white;
                    text-decoration: none;
                    padding: 16px 40px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    margin-top: 20px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }}
                .activate-btn:hover {{
                    background: #374151;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                }}
                .note {{
                    color: #EF4444;
                    font-size: 13px;
                    margin-top: 20px;
                    line-height: 1.6;
                }}
                @media (max-width: 600px) {{
                    .container {{
                        padding: 30px 20px;
                    }}
                    .license-key {{
                        font-size: 18px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">🎉</div>
                <h1>Payment Successful!</h1>
                <p class="subtitle">Thank you for upgrading to BizTrackr Pro</p>
                
                <div class="license-box">
                    <div class="license-label">Your BizTrackr Pro License Key</div>
                    <div class="license-key" id="licenseKey">{license_obj.key}</div>
                    <button class="copy-btn" onclick="copyLicense()">📋 Copy License Key</button>
                </div>
                
                <div class="info-box">
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{license_obj.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Plan:</span>
                        <span class="info-value">{license_obj.plan}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment ID:</span>
                        <span class="info-value">{license_obj.payment_id}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value" style="color: {'#EF4444' if license_obj.used else '#10B981'};">
                            {'✅ Activated' if license_obj.used else '⏳ Pending Activation'}
                        </span>
                    </div>
                </div>
                
                <a href="{activation_url}" class="activate-btn">
                    Activate License Now →
                </a>
                
                <p class="note">
                    ⚠️ <strong>Important:</strong> This license key can only be used once. 
                    Please save it securely. A confirmation email has been sent to {license_obj.email}.
                </p>
            </div>
            
            <script>
                function copyLicense() {{
                    const licenseKey = document.getElementById('licenseKey').textContent;
                    navigator.clipboard.writeText(licenseKey).then(() => {{
                        const btn = document.querySelector('.copy-btn');
                        const originalText = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        setTimeout(() => {{
                            btn.textContent = originalText;
                        }}, 2000);
                    }});
                }}
            </script>
        </body>
        </html>
        """
        
    except Exception as e:
        logger.error(f"Error displaying license page: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger-event-email")
async def trigger_event_email(request: EventEmailRequest):
    """
    Trigger event-based email
    
    Body:
    {
        "event_type": "welcome_email",
        "user_email": "user@example.com",
        "metadata": {}
    }
    """
    try:
        result = email_service.send_event_email(
            event_type=request.event_type,
            user_email=request.user_email,
            metadata=request.metadata
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Email sending failed"))
        
        return {
            "success": True,
            "message": f"Email '{request.event_type}' sent to {request.user_email}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering event email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/list")
async def list_all_licenses(
    skip: int = 0,
    limit: int = 100,
    email: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin endpoint to list all licenses
    Requires authentication
    """
    try:
        # TODO: Add admin permission check
        
        licenses = await license_service.get_all_licenses(
            db=db,
            skip=skip,
            limit=limit,
            email_filter=email
        )
        
        return {
            "success": True,
            "count": len(licenses),
            "licenses": [
                {
                    "id": lic.id,
                    "key": lic.key,
                    "email": lic.email,
                    "used": lic.used,
                    "plan": lic.plan,
                    "payment_id": lic.payment_id,
                    "payment_provider": lic.payment_provider,
                    "created_at": lic.created_at,
                    "activated_at": lic.activated_at
                }
                for lic in licenses
            ]
        }
        
    except Exception as e:
        logger.error(f"Error listing licenses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/stats")
async def get_license_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin endpoint for license statistics
    """
    try:
        stats = await license_service.get_license_stats(db)
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error fetching license stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
