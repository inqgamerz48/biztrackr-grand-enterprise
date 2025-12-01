import logging
from sqlalchemy import text
from app.core.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    session = SessionLocal()
    try:
        logger.info("Starting migration: Add transactions table")
        
        # Check if table exists
        result = session.execute(text("SELECT to_regclass('public.transactions')"))
        if result.scalar():
            logger.info("Table 'transactions' already exists. Skipping.")
            return

        # Create transactions table
        session.execute(text("""
            CREATE TABLE transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                order_id VARCHAR UNIQUE,
                payment_id VARCHAR,
                amount FLOAT,
                currency VARCHAR DEFAULT 'INR',
                status VARCHAR DEFAULT 'PENDING',
                plan VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Create indices
        session.execute(text("CREATE INDEX ix_transactions_user_id ON transactions (user_id);"))
        session.execute(text("CREATE INDEX ix_transactions_order_id ON transactions (order_id);"))
        
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
