import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

def migrate():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        print("Checking for payment_account_id in sales table...")
        
        columns = [col['name'] for col in inspector.get_columns("sales")]
        
        if "payment_account_id" not in columns:
            try:
                print("Adding payment_account_id column...")
                conn.execute(text("ALTER TABLE sales ADD COLUMN payment_account_id INTEGER REFERENCES payment_accounts(id)"))
                conn.commit()
                print("✅ Added payment_account_id column successfully.")
            except Exception as e:
                print(f"❌ Error adding payment_account_id: {e}")
                conn.rollback()
        else:
            print("ℹ️ payment_account_id column already exists.")

if __name__ == "__main__":
    migrate()
