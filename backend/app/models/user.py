from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)

    # Social Auth
    social_provider = Column(String, nullable=True)  # e.g., 'google', 'github'
    social_id = Column(String, nullable=True)  # Provider's unique ID for the user
    
    # RBAC: Role-Based Access Control
    # Roles: 'admin', 'manager', 'cashier'
    role = Column(String, default="cashier", nullable=False)
    
    # Multi-tenancy
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="users")
