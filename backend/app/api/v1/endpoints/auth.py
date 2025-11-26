from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security, database
from app.services import auth_service
from app.schemas import auth as schemas
from app.core.ratelimit import limiter
from app.services.security_service import security_service
from app.models.security import SecurityEventType

router = APIRouter()

@router.post("/register", response_model=schemas.User)
@limiter.limit("5/minute")
def register(request: Request, user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    user = auth_service.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = auth_service.create_user(db, user=user_in)
    return user

@router.post("/login/access-token", response_model=schemas.Token)
@limiter.limit("10/minute")
def login_access_token(request: Request, db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Get client IP
    client_ip = request.client.host
    
    # 1. Check if IP is banned
    if security_service.is_ip_blocked(db, client_ip):
        raise HTTPException(status_code=403, detail="Access denied. IP is blocked.")

    user = auth_service.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        # 2. Log failed attempt
        security_service.log_event(
            db, 
            event_type=SecurityEventType.LOGIN_FAILED, 
            ip_address=client_ip, 
            description=f"Failed login for {form_data.username}",
            severity="medium"
        )
        
        # 3. Check threshold and ban if necessary
        if security_service.check_login_failures(db, client_ip):
             raise HTTPException(status_code=403, detail="Too many failed attempts. IP blocked.")
             
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }
