import os
import sys
import importlib.util
import glob
from app.core.database import engine, Base

def run_auto_migrations():
    """
    Automatically discovers and runs all 'migrate_*.py' scripts in the backend root.
    """
    print("🚀 Starting Automated Migration System...")
    
    # Get the backend root directory (where this script is running from or parent of app)
    # Assuming db_init.py is in app/core/, we need to go up two levels to reach backend root
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.abspath(os.path.join(current_dir, "../../"))
    
    # Add backend root to sys.path if not present
    if backend_root not in sys.path:
        sys.path.append(backend_root)
        
    # Find all migrate_*.py files in the backend/migrations directory
    migrations_dir = os.path.join(backend_root, "migrations")
    migration_files = glob.glob(os.path.join(migrations_dir, "migrate_*.py"))
    
    print(f"📂 Found {len(migration_files)} migration scripts.")
    
    for file_path in sorted(migration_files):
        filename = os.path.basename(file_path)
        module_name = os.path.splitext(filename)[0]
        
        print(f"   👉 Running {filename}...")
        
        try:
            # Dynamically import the module
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_name] = module
                spec.loader.exec_module(module)
                
                # Try to find a callable function
                # Priority 1: 'migrate()'
                # Priority 2: 'migrate_something()' (matching the filename pattern roughly)
                
                if hasattr(module, "migrate") and callable(module.migrate):
                    module.migrate()
                    print(f"      ✅ {filename} executed successfully.")
                else:
                    # Fallback: look for any function starting with 'migrate_'
                    found_func = False
                    for attr_name in dir(module):
                        if attr_name.startswith("migrate_") and callable(getattr(module, attr_name)):
                            getattr(module, attr_name)()
                            print(f"      ✅ {filename} executed successfully (via {attr_name}).")
                            found_func = True
                            break
                    
                    if not found_func:
                        print(f"      ⚠️  No 'migrate()' function found in {filename}. Skipped.")
                        
        except Exception as e:
            print(f"      ❌ FAILED to run {filename}: {e}")

def init_db():
    try:
        print("📌 Ensuring database tables...")
        Base.metadata.create_all(bind=engine)
        
        print("📌 Running migrations...")
        run_auto_migrations()
        
        print("✅ Database initialization completed.")
    except Exception as e:
        print(f"❌ DB INIT ERROR: {e}")
