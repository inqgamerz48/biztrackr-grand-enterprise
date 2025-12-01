from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def truncate_password(password: str) -> str:
    """Truncate password to 72 bytes for bcrypt compatibility."""
    # Bcrypt has a 72 byte limit. We must truncate before hashing/verifying.
    # We encode to utf-8, slice to 72 bytes, then decode back to string (ignoring errors to be safe)
    # This ensures we don't pass > 72 bytes to passlib.
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        return password_bytes[:72].decode("utf-8", errors="ignore")
    return password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate input password to match hash generation logic
    plain_password = truncate_password(plain_password)
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    password = truncate_password(password)
    return pwd_context.hash(password)
