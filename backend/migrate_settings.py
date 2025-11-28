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
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name='tenant_id'"))
            if result.fetchone():
                print("Column 'tenant_id' already exists in 'settings' table.")
            else:
                print("Adding 'tenant_id' column to 'settings' table...")
                connection.execute(text("ALTER TABLE settings ADD COLUMN tenant_id INTEGER REFERENCES tenants(id)"))
                
                # Ideally we should populate this for existing settings, but since settings are usually single-row per app in the old model,
                # we might need to handle migration carefully.
                # For now, let's assume the existing settings belong to the first tenant or admin's tenant.
                # But to be safe and simple for this task, we just add the column.
                
                connection.commit()
                print("Column added successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
