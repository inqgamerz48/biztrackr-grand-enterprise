from app.core.database import engine, Base
# Import all migration functions
# Note: These imports depend on the backend root being in sys.path
try:
    from migrate_social_auth import migrate_social_auth
    from migrate_notifications import migrate_notifications
    from migrate_settings import migrate_settings
    from migrate_branches import migrate_branches
    from migrate_roles import migrate_roles
    from migrate_purchases import migrate_purchases
    from migrate_banking import migrate_payment_accounts
    from migrate_purchase_tax import migrate_purchase_tax
    from migrate_sales_aging import migrate as migrate_sales_aging
except ImportError:
    # Fallback for when running from different context, though in prod it should work
    import sys
    import os
    sys.path.append(os.getcwd())
    from migrate_social_auth import migrate_social_auth
    from migrate_notifications import migrate_notifications
    from migrate_settings import migrate_settings
    from migrate_branches import migrate_branches
    from migrate_roles import migrate_roles
    from migrate_purchases import migrate_purchases
    from migrate_banking import migrate_payment_accounts
    from migrate_purchase_tax import migrate_purchase_tax
    from migrate_sales_aging import migrate as migrate_sales_aging

def init_db():
    try:
        print("📌 Ensuring database tables...")
        Base.metadata.create_all(bind=engine)
        
        print("📌 Running migrations...")
        migrate_social_auth()
        migrate_notifications()
        migrate_settings()
        migrate_branches()
        migrate_roles()
        migrate_purchases()
        migrate_payment_accounts()
        migrate_purchase_tax()
        migrate_sales_aging()
        
        print("✅ Database initialization completed.")
    except Exception as e:
        print(f"❌ DB INIT ERROR: {e}")
