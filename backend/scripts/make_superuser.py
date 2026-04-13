from dotenv import load_dotenv
import os

load_dotenv()

from app.core.database import SessionLocal
from app.models.user import User

def make_superuser(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found.")
            return
        
        user.is_superuser = True
        db.commit()
        print(f"Successfully granted superuser privileges to {email}.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    make_superuser("admin@biztrackr.com")
