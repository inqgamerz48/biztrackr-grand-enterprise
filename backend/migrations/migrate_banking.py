from dotenv import load_dotenv
import os

load_dotenv()

from app.core.database import SessionLocal, engine, Base
from app.models.payment_account import PaymentAccount
from sqlalchemy import text

def migrate_payment_accounts():
    print("Creating payment_accounts table...")
    try:
        PaymentAccount.__table__.create(bind=engine)
        print("Created payment_accounts table.")
    except Exception as e:
        print(f"Table might already exist: {e}")
        
    print("Adding payment_account_id to sales and purchases...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE sales ADD COLUMN payment_account_id INTEGER REFERENCES payment_accounts(id)"))
            print("Added payment_account_id to sales.")
        except Exception as e:
            print(f"Column payment_account_id in sales might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE purchases ADD COLUMN payment_account_id INTEGER REFERENCES payment_accounts(id)"))
            print("Added payment_account_id to purchases.")
        except Exception as e:
            print(f"Column payment_account_id in purchases might already exist: {e}")
            
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_payment_accounts()
