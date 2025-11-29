from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
# Note: Role is imported as string "Role" in relationship to avoid circular imports


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
    # RBAC: Role-Based Access Control
    # Roles: 'admin', 'manager', 'cashier' (Legacy string role, kept for backward compatibility during migration)
    role = Column(String, default="cashier", nullable=False)
    
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role_obj = relationship("Role", back_populates="users")
    
    # Multi-tenancy
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="users")
    
    # Branch
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    branch = relationship("Branch")
