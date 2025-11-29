from dotenv import load_dotenv
import os

load_dotenv()

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def migrate_purchase_tax():
    print("Adding tax_amount column...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE purchases ADD COLUMN tax_amount FLOAT DEFAULT 0.0"))
            print("Added tax_amount column.")
        except Exception as e:
            print(f"Column tax_amount might already exist: {e}")
            
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_purchase_tax()
