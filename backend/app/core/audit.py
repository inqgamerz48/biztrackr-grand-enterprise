from sqlalchemy import event
from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
import hashlib
import json
from datetime import datetime

def calculate_log_hash(log_entry: ActivityLog, previous_hash: str = "") -> str:
    """Calculates a SHA-256 hash for a log entry to ensure immutability."""
    payload = {
        "user_id": log_entry.user_id,
        "action": log_entry.action,
        "entity_type": log_entry.entity_type,
        "entity_id": log_entry.entity_id,
        "details": log_entry.details,
        "created_at": log_entry.created_at.isoformat() if log_entry.created_at else None,
        "previous_hash": previous_hash
    }
    encoded = json.dumps(payload, sort_keys=True).encode()
    return hashlib.sha256(encoded).hexdigest()

# Note: In a real enterprise system, we would use a SQLAlchemy listener 
# to automatically sign every mutation. 
# For this upgrade, we'll provide the utility and a middleware hook.
