"""
BizTrackr V2 - License Key Generation & Management Service
Handles license key generation, validation, and activation
"""

import random
import string
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.license import License


def generate_license_key() -> str:
    """
    Generate a unique license key in format:
    INQ-BZTKR-XXXX-XXXX
    
    Returns:
        Formatted license key string
    """
    def random_segment(length: int = 4) -> str:
        """Generate random alphanumeric segment"""
        chars = string.ascii_uppercase + string.digits
        # Exclude confusing characters: O, 0, I, 1, L
        chars = ''.join(c for c in chars if c not in ['O', '0', 'I', '1', 'L'])
        return ''.join(random.choice(chars) for _ in range(length))
    
    segment1 = random_segment(4)
    segment2 = random_segment(4)
    
    return f"INQ-BZTKR-{segment1}-{segment2}"


async def create_license(
    db: AsyncSession,
    email: str,
    payment_id: str,
    payment_provider: str,
    plan: str = "PRO",
    payment_amount: Optional[str] = None,
    payment_currency: Optional[str] = None,
    buyer_name: Optional[str] = None,
    buyer_phone: Optional[str] = None
) -> License:
    """
    Create a new license key and store in database
    
    Args:
        db: Database session
        email: User email
        payment_id: Payment transaction ID
        payment_provider: Payment provider name (instamojo, paypal, stripe)
        plan: License plan type
        payment_amount: Payment amount
        payment_currency: Payment currency
        buyer_name: Buyer's name
        buyer_phone: Buyer's phone number
        
    Returns:
        Created License object
    """
    # Check if license already exists for this payment_id (idempotency)
    result = await db.execute(
        select(License).where(License.payment_id == payment_id)
    )
    existing_license = result.scalar_one_or_none()
    
    if existing_license:
        return existing_license
    
    # Generate unique license key
    max_attempts = 10
    for _ in range(max_attempts):
        key = generate_license_key()
        
        # Check if key already exists
        result = await db.execute(
            select(License).where(License.key == key)
        )
        if result.scalar_one_or_none() is None:
            break
    else:
        raise Exception("Failed to generate unique license key")
    
    # Create license
    license_obj = License(
        key=key,
        email=email,
        used=False,
        payment_id=payment_id,
        plan=plan,
        payment_provider=payment_provider,
        payment_amount=payment_amount,
        payment_currency=payment_currency,
        buyer_name=buyer_name,
        buyer_phone=buyer_phone
    )
    
    db.add(license_obj)
    await db.commit()
    await db.refresh(license_obj)
    
    return license_obj


async def get_license_by_payment_id(db: AsyncSession, payment_id: str) -> Optional[License]:
    """
    Fetch license by payment ID
    
    Args:
        db: Database session
        payment_id: Payment transaction ID
        
    Returns:
        License object or None
    """
    result = await db.execute(
        select(License).where(License.payment_id == payment_id)
    )
    return result.scalar_one_or_none()


async def get_license_by_key(db: AsyncSession, license_key: str) -> Optional[License]:
    """
    Fetch license by key
    
    Args:
        db: Database session
        license_key: License key string
        
    Returns:
        License object or None
    """
    result = await db.execute(
        select(License).where(License.key == license_key)
    )
    return result.scalar_one_or_none()


async def activate_license(
    db: AsyncSession,
    license_key: str,
    email: str,
    user_id: Optional[int] = None
) -> dict:
    """
    Activate a license key
    
    Args:
        db: Database session
        license_key: License key string
        email: User email (must match)
        user_id: Optional user ID to assign
        
    Returns:
        Activation result dict
    """
    # Fetch license
    license_obj = await get_license_by_key(db, license_key)
    
    if not license_obj:
        return {
            "success": False,
            "error": "Invalid license key"
        }
    
    # Check if email matches
    if license_obj.email.lower() != email.lower():
        return {
            "success": False,
            "error": "License key does not match the provided email"
        }
    
    # Check if already used
    if license_obj.used:
        return {
            "success": False,
            "error": "License key has already been activated",
            "activated_at": license_obj.activated_at
        }
    
    # Activate license
    license_obj.used = True
    license_obj.activated_at = datetime.utcnow()
    
    if user_id:
        license_obj.user_id = user_id
    
    await db.commit()
    await db.refresh(license_obj)
    
    return {
        "success": True,
        "license": license_obj,
        "message": f"License activated successfully! Welcome to BizTrackr {license_obj.plan}!"
    }


async def verify_license(db: AsyncSession, email: str) -> Optional[License]:
    """
    Verify if user has an active license
    
    Args:
        db: Database session
        email: User email
        
    Returns:
        Active License object or None
    """
    result = await db.execute(
        select(License).where(
            License.email == email,
            License.used == True
        )
    )
    return result.scalar_one_or_none()


async def get_all_licenses(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    email_filter: Optional[str] = None
) -> list[License]:
    """
    Get all licenses with optional filtering
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        email_filter: Optional email filter
        
    Returns:
        List of License objects
    """
    query = select(License)
    
    if email_filter:
        query = query.where(License.email.ilike(f"%{email_filter}%"))
    
    query = query.offset(skip).limit(limit).order_by(License.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


async def get_license_stats(db: AsyncSession) -> dict:
    """
    Get license statistics
    
    Args:
        db: Database session
        
    Returns:
        Statistics dict
    """
    total_result = await db.execute(select(License))
    total_licenses = len(total_result.scalars().all())
    
    used_result = await db.execute(
        select(License).where(License.used == True)
    )
    used_licenses = len(used_result.scalars().all())
    
    unused_licenses = total_licenses - used_licenses
    
    return {
        "total_licenses": total_licenses,
        "used_licenses": used_licenses,
        "unused_licenses": unused_licenses,
        "activation_rate": (used_licenses / total_licenses * 100) if total_licenses > 0 else 0
    }
