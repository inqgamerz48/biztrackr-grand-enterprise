from dotenv import load_dotenv
import os

# Load env vars before importing app modules
load_dotenv()

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def migrate_roles():
    with engine.connect() as connection:
        try:
            # 1. Create tables
            print("Creating tables...")
            
            # Permissions
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS permissions (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR NOT NULL UNIQUE,
                    description VARCHAR
                )
            """))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_permissions_code ON permissions (code)"))
            
            # Roles
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    tenant_id INTEGER NOT NULL REFERENCES tenants(id)
                )
            """))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_roles_name ON roles (name)"))
            
            # Role Permissions
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS role_permissions (
                    role_id INTEGER REFERENCES roles(id),
                    permission_id INTEGER REFERENCES permissions(id)
                )
            """))
            
            # Add role_id to users if not exists
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id)"))
                print("Added role_id column to users table.")
            except Exception as e:
                print(f"role_id column might already exist: {e}")
                connection.rollback() # Rollback the failed alter, but continue with other steps if possible (or restart transaction)
                # In this simple script, we might need to be careful. 
                # Better check existence first.
            
            connection.commit()
            print("Tables created.")

            # 2. Seed Permissions
            print("Seeding permissions...")
            permissions = [
                ("view_dashboard", "View Dashboard"),
                ("view_sales", "View Sales"),
                ("create_sale", "Create Sale"),
                ("view_inventory", "View Inventory"),
                ("manage_inventory", "Create/Edit/Delete Inventory"),
                ("view_reports", "View Reports"),
                ("manage_users", "Manage Users"),
                ("manage_settings", "Manage Settings"),
                ("view_activity_logs", "View Activity Logs"),
                ("manage_branches", "Manage Branches"),
                ("manage_roles", "Manage Roles"),
            ]
            
            for code, desc in permissions:
                # Check if exists
                exists = connection.execute(text(f"SELECT id FROM permissions WHERE code='{code}'")).fetchone()
                if not exists:
                    connection.execute(text(f"INSERT INTO permissions (code, description) VALUES ('{code}', '{desc}')"))
            
            connection.commit()
            print("Permissions seeded.")

            # 3. Seed Roles and Migrate Users
            print("Seeding roles and migrating users...")
            tenants = connection.execute(text("SELECT id FROM tenants")).fetchall()
            
            # Define default role permissions
            role_defs = {
                "admin": ["view_dashboard", "view_sales", "create_sale", "view_inventory", "manage_inventory", "view_reports", "manage_users", "manage_settings", "view_activity_logs", "manage_branches", "manage_roles"],
                "manager": ["view_dashboard", "view_sales", "create_sale", "view_inventory", "manage_inventory", "view_reports", "manage_users"],
                "cashier": ["view_dashboard", "view_sales", "create_sale", "view_inventory"]
            }
            
            for tenant in tenants:
                tenant_id = tenant[0]
                
                for role_name, perms in role_defs.items():
                    # Check/Create Role
                    role_id = None
                    existing_role = connection.execute(text(f"SELECT id FROM roles WHERE tenant_id={tenant_id} AND name='{role_name}'")).fetchone()
                    
                    if existing_role:
                        role_id = existing_role[0]
                    else:
                        result = connection.execute(text(f"INSERT INTO roles (tenant_id, name) VALUES ({tenant_id}, '{role_name}') RETURNING id"))
                        role_id = result.fetchone()[0]
                        
                        # Assign permissions
                        for perm_code in perms:
                            perm_id = connection.execute(text(f"SELECT id FROM permissions WHERE code='{perm_code}'")).fetchone()[0]
                            connection.execute(text(f"INSERT INTO role_permissions (role_id, permission_id) VALUES ({role_id}, {perm_id})"))
                    
                    # Migrate Users
                    # Update users who have this string role to point to this role_id
                    connection.execute(text(f"UPDATE users SET role_id={role_id} WHERE tenant_id={tenant_id} AND role='{role_name}'"))
            
            connection.commit()
            print("Roles seeded and users migrated.")

        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate_roles()
