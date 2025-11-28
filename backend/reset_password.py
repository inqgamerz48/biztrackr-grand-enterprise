from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash

db = SessionLocal()

email = "admin@biztrackr.com"
user = db.query(User).filter(User.email == email).first()

if user:
    print(f"User {email} found. Resetting password...")
    user.hashed_password = get_password_hash("admin123")
    db.commit()
    print("Password reset to 'admin123'")
else:
    print(f"User {email} not found. Creating...")
    user = User(
        email=email,
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        role="admin",
        is_active=True,
        is_superuser=True
    )
    db.add(user)
    db.commit()
    print("User created with password 'admin123'")

db.close()
