import logging
from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    session = SessionLocal()
    try:
        logger.info("Starting migration: Seed Superuser")
        
        # Use provided credentials or fallback to env vars
        email = "biztrackrsuperadmin@gmail.com"
        password = "SRIVATSA@OP"
        
        # Check if user exists
        user = session.query(User).filter(User.email == email).first()
        if not user:
            logger.info(f"Creating superuser: {email}")
            hashed_password = get_password_hash(password)
            
            new_user = User(
                email=email,
                hashed_password=hashed_password,
                full_name="Super Admin",
                role="super_admin",
                is_superuser=True,
                is_active=True
            )
            session.add(new_user)
            session.commit()
            logger.info("Superuser created successfully.")
        else:
            logger.info("Superuser already exists. Updating role/password if needed.")
            # Optional: Update password/role if they don't match (be careful with password hashing)
            if user.role != "super_admin":
                user.role = "super_admin"
                user.is_superuser = True
                session.commit()
                logger.info("Updated user role to super_admin.")
            
    except Exception as e:
        session.rollback()
        logger.error(f"Migration failed: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
