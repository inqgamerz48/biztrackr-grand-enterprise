import logging
from sqlalchemy import text
from app.core.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    session = SessionLocal()
    try:
        logger.info("Starting migration: Multi-role system updates")
        
        # 1. Update User table
        # Check if columns exist
        result = session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='plan'"))
        if not result.scalar():
            logger.info("Adding plan and plan_expiry columns to users table")
            session.execute(text("ALTER TABLE users ADD COLUMN plan VARCHAR DEFAULT 'free'"))
            session.execute(text("ALTER TABLE users ADD COLUMN plan_expiry TIMESTAMP WITH TIME ZONE"))
        
        # 2. Update Settings table
        result = session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name='owner_qr'"))
        if not result.scalar():
            logger.info("Adding owner_qr column to settings table")
            session.execute(text("ALTER TABLE settings ADD COLUMN owner_qr VARCHAR"))

        # 3. Create UpgradeRequests table
        result = session.execute(text("SELECT to_regclass('public.upgrade_requests')"))
        if not result.scalar():
            logger.info("Creating upgrade_requests table")
            session.execute(text("""
                CREATE TABLE upgrade_requests (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    company_id INTEGER REFERENCES tenants(id),
                    plan_requested VARCHAR NOT NULL,
                    screenshot_url VARCHAR,
                    payment_ref VARCHAR,
                    status VARCHAR DEFAULT 'pending',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                );
            """))
            session.execute(text("CREATE INDEX ix_upgrade_requests_user_id ON upgrade_requests (user_id);"))
            session.execute(text("CREATE INDEX ix_upgrade_requests_company_id ON upgrade_requests (company_id);"))
            session.execute(text("CREATE INDEX ix_upgrade_requests_status ON upgrade_requests (status);"))
        
        session.commit()
        logger.info("Migration completed successfully.")
        
    except Exception as e:
        session.rollback()
        logger.error(f"Migration failed: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
