from sqlalchemy import text
from app.core.database import engine

def migrate_social_auth():
    print("🔄 Checking for social auth columns...")
    with engine.connect() as conn:
        # Check if columns exist
        try:
            # PostgreSQL specific check
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='social_provider'"))
            if not result.fetchone():
                print("⚠️ 'social_provider' column missing. Adding it...")
                conn.execute(text("ALTER TABLE users ADD COLUMN social_provider VARCHAR"))
                conn.commit()
                print("✅ 'social_provider' column added.")
            else:
                print("✅ 'social_provider' column already exists.")

            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='social_id'"))
            if not result.fetchone():
                print("⚠️ 'social_id' column missing. Adding it...")
                conn.execute(text("ALTER TABLE users ADD COLUMN social_id VARCHAR"))
                conn.commit()
                print("✅ 'social_id' column added.")
            else:
                print("✅ 'social_id' column already exists.")
                
        except Exception as e:
            print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate_social_auth()
