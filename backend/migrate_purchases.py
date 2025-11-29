from dotenv import load_dotenv
import os

load_dotenv()

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def migrate_purchases():
    db = SessionLocal()
    try:
        # Check if columns exist
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='purchases'"))
        columns = [row[0] for row in result]
        
        if 'payment_status' not in columns:
            print("Adding payment_status column...")
            db.execute(text("ALTER TABLE purchases ADD COLUMN payment_status VARCHAR DEFAULT 'pending'"))
            
        if 'amount_paid' not in columns:
            print("Adding amount_paid column...")
            db.execute(text("ALTER TABLE purchases ADD COLUMN amount_paid FLOAT DEFAULT 0.0"))
            
        if 'due_date' not in columns:
            print("Adding due_date column...")
            db.execute(text("ALTER TABLE purchases ADD COLUMN due_date TIMESTAMP WITH TIME ZONE"))
            
        if 'payment_method' not in columns:
            print("Adding payment_method column...")
            db.execute(text("ALTER TABLE purchases ADD COLUMN payment_method VARCHAR"))
            
        db.commit()
        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_purchases()
