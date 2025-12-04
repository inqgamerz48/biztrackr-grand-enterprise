import logging
from sqlalchemy import text
from app.core.database import engine
from app.models.payment_account import PaymentAccount

logger = logging.getLogger(__name__)

async def run_pending_migrations():
    """
    Run critical migrations on app startup.
    This is a safeguard to ensure schema consistency on deployments where
    external migration scripts might not have run.
    """
    logger.info("Checking for pending migrations...")
    
    # 1. Create PaymentAccount table if not exists
    try:
        async with engine.begin() as conn:
            await conn.run_sync(PaymentAccount.__table__.create)
            logger.info("Created payment_accounts table (if it didn't exist).")
    except Exception as e:
        # Table likely exists, which is fine
        logger.info(f"PaymentAccount table check: {e}")

    # 2. Add payment_account_id to Sales
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_account_id INTEGER REFERENCES payment_accounts(id)"))
            logger.info("Verified payment_account_id on sales.")
    except Exception as e:
        logger.error(f"Error checking payment_account_id on sales: {e}")

    # 3. Add payment_account_id to Purchases
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_account_id INTEGER REFERENCES payment_accounts(id)"))
            logger.info("Verified payment_account_id on purchases.")
    except Exception as e:
        logger.error(f"Error checking payment_account_id on purchases: {e}")
            
    logger.info("Startup migrations completed.")
