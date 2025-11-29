from typing import Optional
from pydantic import BaseModel

class SettingsBase(BaseModel):
    company_name: Optional[str] = "My Company"
    currency_symbol: Optional[str] = "$"
    tax_rate: Optional[float] = 0.10
    logo_url: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    
    # Company Details
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    footer_text: Optional[str] = "Thank you for your business!"
    
    enable_notifications: Optional[bool] = True

class SettingsCreate(SettingsBase):
    pass

class SettingsUpdate(SettingsBase):
    pass

class Settings(SettingsBase):
    id: int

    class Config:
        orm_mode = True
