import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

from app.core.database import engine
from app.models.payment_account import PaymentAccount
from sqlalchemy import text

async def migrate_payment_accounts():
    print("Creating payment_accounts table...")
    async with engine.begin() as conn:
        try:
            await conn.run_sync(PaymentAccount.__table__.create)
            print("Created payment_accounts table.")
        except Exception as e:
            print(f"Table might already exist: {e}")
            
        print("Adding payment_account_id to sales and purchases...")
        try:
            await conn.execute(text("ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_account_id INTEGER REFERENCES payment_accounts(id)"))
            print("Added payment_account_id to sales.")
        except Exception as e:
            print(f"Error adding payment_account_id to sales: {e}")

        try:
            await conn.execute(text("ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_account_id INTEGER REFERENCES payment_accounts(id)"))
            print("Added payment_account_id to purchases.")
        except Exception as e:
            print(f"Error adding payment_account_id to purchases: {e}")
            
    print("Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate_payment_accounts())
