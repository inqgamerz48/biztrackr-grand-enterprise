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
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='purchases' AND column_name='status'"))
            if result.fetchone():
                print("Column 'status' already exists in 'purchases' table.")
            else:
                print("Adding 'status' column to 'purchases' table...")
                connection.execute(text("ALTER TABLE purchases ADD COLUMN status VARCHAR DEFAULT 'Ordered'"))
                connection.commit()
                print("Column added successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
