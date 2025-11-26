"""
Payment Request service for managing bank transfers and manual payments.
"""
import secrets
import string
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.payment_request import PaymentRequest
from typing import List, Optional

# Company bank details (should come from settings in production)
COMPANY_BANK_DETAILS = {
    "bank_name": "Example Bank",
    "account_name": "BizTrackr PRO LLC",
    "account_number": "1234567890",
    "routing_number": "021000021",
    "swift_code": "BANKUS33",
    "ifsc_code": "BANK0001234",  # For Indian banks
    "branch": "Main Branch"
}

# Plan pricing
PLAN_PRICES = {
    "basic": 29.00,
    "pro": 99.00,
    "enterprise": 299.00
}


def generate_reference_number() -> str:
    """Generate a unique reference number for payment tracking"""
    timestamp = datetime.utcnow().strftime('%Y%m%d')
    random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    return f"BT{timestamp}{random_part}"


def create_payment_request(
    db: Session,
    tenant_id: int,
    plan_type: str,
    payment_method: str = "bank_transfer",
    notes: Optional[str] = None
) -> PaymentRequest:
    """
    Create a new payment request for manual processing.
    
    Args:
        db: Database session
        tenant_id: ID of the tenant
        plan_type: Subscription plan (basic, pro, enterprise)
        payment_method: Payment method (bank_transfer, check, cash)
        notes: Optional notes from user
        
    Returns:
        PaymentRequest: Created payment request
    """
    amount = PLAN_PRICES.get(plan_type.lower(), 29.00)
    reference_number = generate_reference_number()
    
    payment_request = PaymentRequest(
        tenant_id=tenant_id,
        amount=amount,
        currency="USD",
        plan_type=plan_type.lower(),
        payment_method=payment_method,
        status="pending",
        reference_number=reference_number,
        bank_details=COMPANY_BANK_DETAILS,
        notes=notes
    )
    
    db.add(payment_request)
    db.commit()
    db.refresh(payment_request)
    
    return payment_request


def get_payment_requests(
    db: Session,
    tenant_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[PaymentRequest]:
    """Get payment requests with optional filters"""
    query = db.query(PaymentRequest)
    
    if tenant_id:
        query = query.filter(PaymentRequest.tenant_id == tenant_id)
    
    if status:
        query = query.filter(PaymentRequest.status == status)
    
    return query.offset(skip).limit(limit).all()


def get_payment_request_by_id(db: Session, request_id: int) -> Optional[PaymentRequest]:
    """Get a specific payment request by ID"""
    return db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()


def get_payment_request_by_reference(db: Session, reference: str) -> Optional[PaymentRequest]:
    """Get a payment request by reference number"""
    return db.query(PaymentRequest).filter(PaymentRequest.reference_number == reference).first()


def approve_payment_request(
    db: Session,
    request_id: int,
    approved_by_user_id: int
) -> Optional[PaymentRequest]:
    """
    Approve a payment request (admin only).
    
    Args:
        db: Database session
        request_id: Payment request ID
        approved_by_user_id: ID of the admin approving
        
    Returns:
        PaymentRequest: Updated payment request
    """
    payment_request = get_payment_request_by_id(db, request_id)
    
    if not payment_request:
        return None
    
    payment_request.status = "approved"
    payment_request.approved_at = datetime.utcnow()
    payment_request.approved_by = approved_by_user_id
    
    db.commit()
    db.refresh(payment_request)
    
    return payment_request


def mark_as_paid(
    db: Session,
    request_id: int,
    payment_proof_url: Optional[str] = None
) -> Optional[PaymentRequest]:
    """
    Mark a payment request as paid (admin only).
    
    Args:
        db: Database session
        request_id: Payment request ID
        payment_proof_url: Optional URL to payment proof document
        
    Returns:
        PaymentRequest: Updated payment request
    """
    payment_request = get_payment_request_by_id(db, request_id)
    
    if not payment_request:
        return None
    
    payment_request.status = "paid"
    payment_request.paid_at = datetime.utcnow()
    
    if payment_proof_url:
        payment_request.payment_proof_url = payment_proof_url
    
    db.commit()
    db.refresh(payment_request)
    
    # TODO: Activate tenant subscription here
    # activate_tenant_subscription(payment_request.tenant_id, payment_request.plan_type)
    
    return payment_request


def reject_payment_request(
    db: Session,
    request_id: int,
    rejection_notes: Optional[str] = None
) -> Optional[PaymentRequest]:
    """
    Reject a payment request (admin only).
    
    Args:
        db: Database session
        request_id: Payment request ID
        rejection_notes: Reason for rejection
        
    Returns:
        PaymentRequest: Updated payment request
    """
    payment_request = get_payment_request_by_id(db, request_id)
    
    if not payment_request:
        return None
    
    payment_request.status = "rejected"
    
    if rejection_notes:
        current_notes = payment_request.notes or ""
        payment_request.notes = f"{current_notes}\n\nREJECTION: {rejection_notes}"
    
    db.commit()
    db.refresh(payment_request)
    
    return payment_request
