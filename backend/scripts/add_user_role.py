#!/usr/bin/env python3
"""Database migration script to add role column to users table"""

from app.core.database import SessionLocal
from sqlalchemy import text

def add_role_column():
    """Add role column and set initial values based on is_superuser"""
    db = SessionLocal()
    
    try:
        # Check if column already exists
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result]
        
        if 'role' in columns:
            print("✅ Role column already exists")
            return
        
        # Add role column
        print("Adding role column...")
        db.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'cashier'"))
        
        # Set admin role for superusers
        print("Setting admin role for superusers...")
        db.execute(text("UPDATE users SET role = 'admin' WHERE is_superuser = 1"))
        
        # Set cashier for everyone else
        db.execute(text("UPDATE users SET role = 'cashier' WHERE is_superuser = 0"))
        
        db.commit()
        print("✅ Role column added successfully!")
        print("   - Superusers assigned 'admin' role")
        print("   - Other users assigned 'cashier' role")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_role_column()
