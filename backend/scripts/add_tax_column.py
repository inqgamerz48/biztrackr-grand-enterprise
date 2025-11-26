from app.core.database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE sales ADD COLUMN tax_amount FLOAT DEFAULT 0.0"))
            print("Column 'tax_amount' added successfully.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    add_column()
