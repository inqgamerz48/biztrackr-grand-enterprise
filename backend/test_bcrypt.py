import sys
import os

try:
    print("Testing passlib + bcrypt compatibility...")
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Trigger backend initialization
    hash = pwd_context.hash("test")
    print(f"Hash generated: {hash}")
    
    # Test verification
    print(f"Verify: {pwd_context.verify('test', hash)}")
    
    print("Success!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
