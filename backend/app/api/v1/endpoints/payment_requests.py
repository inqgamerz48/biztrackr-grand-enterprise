"""
Payment Request API endpoints for bank transfer and manual payment processing.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.services import payment_request_service
from app.api.dependencies import require_admin, get_current_user
from app.models import User

router = APIRouter()


# Pydantic schemas
class PaymentRequestCreate(BaseModel):
    plan_type: str  # basic, pro, enterprise
    payment_method: str = "bank_transfer"  # bank_transfer, check, cash
    notes: Optional[str] = None


class PaymentRequestResponse(BaseModel):
    id: int
    tenant_id: int
    amount: float
    currency: str
    plan_type: str
    payment_method: str
    status: str
    reference_number: str
    bank_details: dict
    notes: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


@router.post("/", response_model=PaymentRequestResponse, status_code=status.HTTP_201_CREATED)
def create_payment_request(
    request_data: PaymentRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new payment request for bank transfer or manual payment.
    User submits intent to pay via bank transfer.
    """
    payment_request = payment_request_service.create_payment_request(
        db=db,
        tenant_id=current_user.tenant_id,
        plan_type=request_data.plan_type,
        payment_method=request_data.payment_method,
        notes=request_data.notes
    )
    
    return {
        **payment_request.__dict__,
        "created_at": payment_request.created_at.isoformat()
    }


@router.get("/", response_model=List[PaymentRequestResponse])
def list_payment_requests(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all payment requests (admin only).
    Can filter by status.
    """
    requests = payment_request_service.get_payment_requests(
        db=db,
        status=status_filter
    )
    
    return [{
        **req.__dict__,
        "created_at": req.created_at.isoformat()
    } for req in requests]


@router.get("/my-requests", response_model=List[PaymentRequestResponse])
def get_my_payment_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payment requests for the current user's tenant"""
    requests = payment_request_service.get_payment_requests(
        db=db,
        tenant_id=current_user.tenant_id
    )
    
    return [{
        **req.__dict__,
        "created_at": req.created_at.isoformat()
    } for req in requests]


@router.get("/{request_id}", response_model=PaymentRequestResponse)
def get_payment_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific payment request"""
    payment_request = payment_request_service.get_payment_request_by_id(db, request_id)
    
    if not payment_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    # Check if user has access (admin or owner)
    if current_user.role != "admin" and payment_request.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        **payment_request.__dict__,
        "created_at": payment_request.created_at.isoformat()
    }


@router.put("/{request_id}/approve")
def approve_payment_request(
    request_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Approve a payment request (admin only)"""
    payment_request = payment_request_service.approve_payment_request(
        db=db,
        request_id=request_id,
        approved_by_user_id=current_user.id
    )
    
    if not payment_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    return {"message": "Payment request approved", "status": payment_request.status}


@router.put("/{request_id}/mark-paid")
def mark_payment_as_paid(
    request_id: int,
    payment_proof_url: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Mark a payment request as paid (admin only)"""
    payment_request = payment_request_service.mark_as_paid(
        db=db,
        request_id=request_id,
        payment_proof_url=payment_proof_url
    )
    
    if not payment_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    return {"message": "Payment marked as paid", "status": payment_request.status}


@router.put("/{request_id}/reject")
def reject_payment_request(
    request_id: int,
    rejection_notes: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Reject a payment request (admin only)"""
    payment_request = payment_request_service.reject_payment_request(
        db=db,
        request_id=request_id,
        rejection_notes=rejection_notes
    )
    
    if not payment_request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    return {"message": "Payment request rejected", "status": payment_request.status}
