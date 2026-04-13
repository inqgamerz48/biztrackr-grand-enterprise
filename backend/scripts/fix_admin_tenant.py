from app.core.database import SessionLocal
from app.models import User

db = SessionLocal()

email = "admin@biztrackr.com"
user = db.query(User).filter(User.email == email).first()

if user:
    print(f"User {email} found. Current TenantID: {user.tenant_id}")
    user.tenant_id = 6
    db.commit()
    print("TenantID updated to 6")
else:
    print("User not found")

db.close()
