from dotenv import load_dotenv
import os

# Load env vars before importing app modules
load_dotenv()

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def migrate():
    with engine.connect() as connection:
        try:
            # 1. Create branches table
            print("Creating 'branches' table...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS branches (
                    id SERIAL PRIMARY KEY,
                    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
                    name VARCHAR NOT NULL,
                    address VARCHAR,
                    phone VARCHAR,
                    is_main BOOLEAN DEFAULT FALSE
                )
            """))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_branches_id ON branches (id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_branches_name ON branches (name)"))
            connection.commit()
            print("'branches' table created.")

            # 2. Create Default "Main Branch" for each Tenant
            print("Creating default 'Main Branch' for existing tenants...")
            tenants = connection.execute(text("SELECT id FROM tenants")).fetchall()
            
            for tenant in tenants:
                tenant_id = tenant[0]
                # Check if main branch exists
                existing_main = connection.execute(text(f"SELECT id FROM branches WHERE tenant_id={tenant_id} AND is_main=TRUE")).fetchone()
                
                if not existing_main:
                    connection.execute(text(f"""
                        INSERT INTO branches (tenant_id, name, is_main) 
                        VALUES ({tenant_id}, 'Main Branch', TRUE)
                    """))
                    print(f"Created Main Branch for Tenant ID {tenant_id}")
            
            connection.commit()

            # 3. Add branch_id to tables
            tables_to_update = ['users', 'items', 'sales', 'purchases']
            
            for table in tables_to_update:
                print(f"Updating '{table}' table...")
                
                # Check if column exists
                result = connection.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='branch_id'"))
                if result.fetchone():
                    print(f"Column 'branch_id' already exists in '{table}'.")
                else:
                    print(f"Adding 'branch_id' column to '{table}'...")
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN branch_id INTEGER REFERENCES branches(id)"))
                    
                    # Assign existing records to the Main Branch of their tenant
                    # This is complex because we need to join with branches table
                    # Or simpler: for each tenant, update records where tenant_id matches
                    
                    for tenant in tenants:
                        tenant_id = tenant[0]
                        main_branch = connection.execute(text(f"SELECT id FROM branches WHERE tenant_id={tenant_id} AND is_main=TRUE")).fetchone()
                        if main_branch:
                            branch_id = main_branch[0]
                            connection.execute(text(f"UPDATE {table} SET branch_id={branch_id} WHERE tenant_id={tenant_id} AND branch_id IS NULL"))
                            print(f"Assigned existing records in '{table}' for Tenant {tenant_id} to Branch {branch_id}")
                    
                    connection.commit()
                    print(f"Column 'branch_id' added and populated for '{table}'.")

        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
