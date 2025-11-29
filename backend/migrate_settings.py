from dotenv import load_dotenv
import os

# Load env vars before importing app modules
load_dotenv()

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def migrate_settings():
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
                print("Column 'tenant_id' added successfully.")
        except Exception as e:
            print(f"Migration for tenant_id failed: {e}")

        # Migrate new company details columns
        new_columns = [
            ("company_address", "VARCHAR"),
            ("company_phone", "VARCHAR"),
            ("company_email", "VARCHAR"),
            ("company_website", "VARCHAR"),
            ("footer_text", "VARCHAR DEFAULT 'Thank you for your business!'")
        ]

        for col_name, col_type in new_columns:
            try:
                result = connection.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='settings' AND column_name='{col_name}'"))
                if result.fetchone():
                    print(f"Column '{col_name}' already exists.")
                else:
                    print(f"Adding '{col_name}' column...")
                    connection.execute(text(f"ALTER TABLE settings ADD COLUMN {col_name} {col_type}"))
                    connection.commit()
                    print(f"Column '{col_name}' added successfully.")
            except Exception as e:
                print(f"Migration for {col_name} failed: {e}")
            except Exception as e:
                print(f"Migration for {col_name} failed: {e}")

if __name__ == "__main__":
    migrate_settings()
