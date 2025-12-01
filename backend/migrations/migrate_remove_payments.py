import logging
from sqlalchemy import text, inspect
from app.core.database import SessionLocal, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    session = SessionLocal()
    try:
        logger.info("Starting migration: Remove Payment Gateways")
        
        inspector = inspect(engine)
        
        # 1. Drop transactions table if exists
        if "transactions" in inspector.get_table_names():
            logger.info("Dropping transactions table...")
            session.execute(text("DROP TABLE transactions CASCADE"))
            
        # 2. Remove columns from tenants table
        columns = [col['name'] for col in inspector.get_columns("tenants")]
        
        if "stripe_customer_id" in columns:
            logger.info("Dropping stripe_customer_id from tenants...")
            session.execute(text("ALTER TABLE tenants DROP COLUMN stripe_customer_id"))
            
        if "subscription_id" in columns:
            logger.info("Dropping subscription_id from tenants...")
            session.execute(text("ALTER TABLE tenants DROP COLUMN subscription_id"))
            
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
