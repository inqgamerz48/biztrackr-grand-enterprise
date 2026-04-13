import sys
import os
import asyncio
import json
from datetime import datetime

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock environment variables for testing
os.environ["SECRET_KEY"] = "test_secret_key_32_chars_long_minimum"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://user:pass@localhost/db"

# Mock database engine to avoid asyncpg dependency in this environment
from unittest.mock import MagicMock
import sys
mock_db = MagicMock()
sys.modules["app.core.database"] = mock_db
mock_db.Base = MagicMock()

# Mock the entire activity_log model to avoid inheritance issues
mock_activity_log = MagicMock()
sys.modules["app.models.activity_log"] = mock_activity_log

from app.core.audit import calculate_log_hash
from app.core.websocket import manager

# Ensure ActivityLog fields are real values, not Mocks
class MockActivityLog:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

async def test_websocket_broadcast():
    print("Testing WebSocket ConnectionManager...")
    # Mock a websocket
    class MockWebSocket:
        def __init__(self):
            self.sent_messages = []
        async def accept(self): pass
        async def send_text(self, text): self.sent_messages.append(text)
    
    ws = MockWebSocket()
    tenant_id = "test_tenant_123"
    
    await manager.connect(ws, tenant_id)
    print(f"  - Connected mock WS to tenant {tenant_id}")
    
    payload = {"event": "SALE_CREATED", "amount": 500}
    await manager.broadcast_to_tenant(payload, tenant_id)
    print(f"  - Broadcasted message: {payload}")
    
    if len(ws.sent_messages) > 0 and json.loads(ws.sent_messages[0]) == payload:
        print("✅ WebSocket Broadcast: SUCCESS")
    else:
        print("❌ WebSocket Broadcast: FAILED")
    
    manager.disconnect(ws, tenant_id)

def test_immutable_audit_hashing():
    print("\nTesting Immutable Audit Hashing...")
    log = MockActivityLog(
        user_id=1,
        action="UPDATE_STOCK",
        entity_type="item",
        entity_id=42,
        details={"old": 10, "new": 5},
        created_at=datetime.now()
    )
    
    hash1 = calculate_log_hash(log, previous_hash="root_hash")
    print(f"  - Generated Hash 1: {hash1[:16]}...")
    
    # Verify tampering detection
    log.details["new"] = 500 # Tamper!
    hash2 = calculate_log_hash(log, previous_hash="root_hash")
    print(f"  - Generated Hash 2 (Tampered): {hash2[:16]}...")
    
    if hash1 != hash2:
        print("✅ Immutable Audit (Tamper detection): SUCCESS")
    else:
        print("❌ Immutable Audit (Tamper detection): FAILED")

async def main():
    await test_websocket_broadcast()
    test_immutable_audit_hashing()

if __name__ == "__main__":
    asyncio.run(main())
