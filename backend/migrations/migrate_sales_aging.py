import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Adding aging columns to sales table...")
        
        # Add payment_status
        try:
            conn.execute(text("ALTER TABLE sales ADD COLUMN payment_status VARCHAR DEFAULT 'paid'"))
            print("Added payment_status column")
        except Exception as e:
            conn.rollback()
            print(f"payment_status column might already exist: {e}")

        # Add due_date
        try:
            conn.execute(text("ALTER TABLE sales ADD COLUMN due_date TIMESTAMP WITH TIME ZONE"))
            print("Added due_date column")
        except Exception as e:
            conn.rollback()
            print(f"due_date column might already exist: {e}")

        # Add amount_paid
        try:
            conn.execute(text("ALTER TABLE sales ADD COLUMN amount_paid FLOAT DEFAULT 0.0"))
            print("Added amount_paid column")
        except Exception as e:
            conn.rollback()
            print(f"amount_paid column might already exist: {e}")
            
        # Update existing records
        print("Updating existing records...")
        conn.execute(text("UPDATE sales SET amount_paid = total_amount WHERE amount_paid = 0.0"))
        conn.execute(text("UPDATE sales SET payment_status = 'paid' WHERE payment_status IS NULL"))
        
        conn.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
