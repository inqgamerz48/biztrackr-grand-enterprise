from sqlalchemy import Column, Integer, String, Float, Boolean
from app.core.database import Base

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, default="My Company")
    currency_symbol = Column(String, default="$")
    tax_rate = Column(Float, default=0.10) # 10% default
    logo_url = Column(String, nullable=True)
    terms_and_conditions = Column(String, nullable=True)
    
    # Feature flags or other global configs can go here
    enable_notifications = Column(Boolean, default=True)
    
    # Local Storage Settings
    save_invoices_locally = Column(Boolean, default=True)
    local_invoice_path = Column(String, default="~/Desktop/Invoices")
