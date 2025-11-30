from sqlalchemy import text, inspect
from app.core.database import engine

def migrate_add_razorpay_columns():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('tenants')]

    with engine.connect() as conn:
        try:
            if 'razorpay_customer_id' not in columns:
                conn.execute(text("ALTER TABLE tenants ADD COLUMN razorpay_customer_id VARCHAR"))
                print("Added razorpay_customer_id column to tenants table.")
            
            if 'razorpay_subscription_id' not in columns:
                conn.execute(text("ALTER TABLE tenants ADD COLUMN razorpay_subscription_id VARCHAR"))
                print("Added razorpay_subscription_id column to tenants table.")
                
            conn.commit()
            print("Migration for Razorpay columns completed successfully.")
        except Exception as e:
            print(f"Error during migration: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate_add_razorpay_columns()
