import sys
import os

# Add the parent directory to sys.path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant

def upgrade_user_plan(email: str, plan_name: str = "pro"):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"Found user: {user.email} (ID: {user.id})")
        
        # Update User Plan (if applicable, though usually tenant plan matters more)
        user.plan = plan_name
        print(f"Updated user plan to: {plan_name}")

        if user.tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
            if tenant:
                tenant.plan = plan_name
                print(f"Found tenant: {tenant.name} (ID: {tenant.id})")
                print(f"Updated tenant plan to: {plan_name}")
            else:
                print("Tenant not found for this user.")
        else:
            print("User does not belong to any tenant.")

        db.commit()
        print("Changes committed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    upgrade_user_plan("inqgamerz48@gmail.com", "pro")
