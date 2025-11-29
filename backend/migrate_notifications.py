from dotenv import load_dotenv
import os

# Load env vars before importing app modules
load_dotenv()

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def migrate():
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='notifications' AND column_name='tenant_id'"))
            if result.fetchone():
                print("Column 'tenant_id' already exists in 'notifications' table.")
            else:
                print("Adding 'tenant_id' column to 'notifications' table...")
                # Assuming default tenant_id=1 for existing notifications to avoid constraint violation
                connection.execute(text("ALTER TABLE notifications ADD COLUMN tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1"))
                connection.execute(text("ALTER TABLE notifications ALTER COLUMN tenant_id DROP DEFAULT"))
                connection.commit()
                print("Column 'tenant_id' added successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
