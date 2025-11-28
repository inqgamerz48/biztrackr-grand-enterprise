from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
import sys

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app.core.config import settings

# Database connection URL
DATABASE_URL = settings.DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    try:
        with engine.connect() as connection:
            # Check if columns exist
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND column_name='stripe_customer_id'"))
            if result.fetchone():
                print("Column 'stripe_customer_id' already exists.")
            else:
                print("Adding 'stripe_customer_id' column...")
                connection.execute(text("ALTER TABLE tenants ADD COLUMN stripe_customer_id VARCHAR"))
            
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND column_name='subscription_id'"))
            if result.fetchone():
                print("Column 'subscription_id' already exists.")
            else:
                print("Adding 'subscription_id' column...")
                connection.execute(text("ALTER TABLE tenants ADD COLUMN subscription_id VARCHAR"))
                
            connection.commit()
            print("Migration successful.")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
