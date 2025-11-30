import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

def migrate():
    from sqlalchemy import inspect
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        print("Adding aging columns to sales table...")
        
        existing_columns = [col['name'] for col in inspector.get_columns("sales")]
        
        # Add payment_status
        if "payment_status" not in existing_columns:
            try:
                conn.execute(text("ALTER TABLE sales ADD COLUMN payment_status VARCHAR DEFAULT 'paid'"))
                print("Added payment_status column")
            except Exception as e:
                print(f"Error adding payment_status: {e}")
        else:
            print("payment_status column already exists")

        # Add due_date
        if "due_date" not in existing_columns:
            try:
                conn.execute(text("ALTER TABLE sales ADD COLUMN due_date TIMESTAMP WITH TIME ZONE"))
                print("Added due_date column")
            except Exception as e:
                print(f"Error adding due_date: {e}")
        else:
            print("due_date column already exists")

        # Add amount_paid
        if "amount_paid" not in existing_columns:
            try:
                conn.execute(text("ALTER TABLE sales ADD COLUMN amount_paid FLOAT DEFAULT 0.0"))
                print("Added amount_paid column")
            except Exception as e:
                print(f"Error adding amount_paid: {e}")
        else:
            print("amount_paid column already exists")
            
        # Update existing records
        print("Updating existing records...")
        try:
            conn.execute(text("UPDATE sales SET amount_paid = total_amount WHERE amount_paid = 0.0"))
            conn.execute(text("UPDATE sales SET payment_status = 'paid' WHERE payment_status IS NULL"))
            conn.commit()
            print("Migration complete!")
        except Exception as e:
            print(f"Error updating records: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
