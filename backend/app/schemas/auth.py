from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[int] = None
    role: Optional[str] = None  # Default to None so service can assign admin for new tenants
    tenant_name: Optional[str] = None # Required for creating new tenant
    is_superuser: bool = False

class UserUpdate(UserBase):
    password: Optional[str] = None
    role: Optional[str] = None  # Allow role updates

class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    role: str
    tenant_id: Optional[int] = None

    class Config:
        orm_mode = True
