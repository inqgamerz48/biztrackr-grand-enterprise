from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ExportLog(Base):
    __tablename__ = "export_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    export_type = Column(String)   # PDF, CSV
    resource = Column(String)   # INVOICES, EXPENSES
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="export_logs")
