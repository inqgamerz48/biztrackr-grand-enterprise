from typing import List, Dict

# Permission Constants
class Permissions:
    # Inventory
    INVENTORY_READ = "inventory:read"
    INVENTORY_WRITE = "inventory:write"
    INVENTORY_DELETE = "inventory:delete"
    
    # Sales
    SALES_READ = "sales:read"
    SALES_CREATE = "sales:create"
    SALES_DELETE = "sales:delete"
    
    # Purchases
    PURCHASES_READ = "purchases:read"
    PURCHASES_CREATE = "purchases:create"
    PURCHASES_RECEIVE = "purchases:receive"
    
    # CRM
    CRM_READ = "crm:read"
    CRM_WRITE = "crm:write"
    
    # Reports
    REPORTS_READ = "reports:read"
    
    # Settings
    SETTINGS_READ = "settings:read"
    SETTINGS_WRITE = "settings:write"
    
    # Users
    USERS_READ = "users:read"
    USERS_WRITE = "users:write"

# Role to Permissions Mapping
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin": [
        Permissions.INVENTORY_READ, Permissions.INVENTORY_WRITE, Permissions.INVENTORY_DELETE,
        Permissions.SALES_READ, Permissions.SALES_CREATE, Permissions.SALES_DELETE,
        Permissions.PURCHASES_READ, Permissions.PURCHASES_CREATE, Permissions.PURCHASES_RECEIVE,
        Permissions.CRM_READ, Permissions.CRM_WRITE,
        Permissions.REPORTS_READ,
        Permissions.SETTINGS_READ, Permissions.SETTINGS_WRITE,
        Permissions.USERS_READ, Permissions.USERS_WRITE
    ],
    "manager": [
        Permissions.INVENTORY_READ, Permissions.INVENTORY_WRITE,
        Permissions.SALES_READ, Permissions.SALES_CREATE,
        Permissions.PURCHASES_READ, Permissions.PURCHASES_CREATE, Permissions.PURCHASES_RECEIVE,
        Permissions.CRM_READ, Permissions.CRM_WRITE,
        Permissions.REPORTS_READ,
        Permissions.SETTINGS_READ
    ],
    "cashier": [
        Permissions.INVENTORY_READ,
        Permissions.SALES_READ, Permissions.SALES_CREATE,
        Permissions.CRM_READ
    ]
}

def get_role_permissions(role: str) -> List[str]:
    return ROLE_PERMISSIONS.get(role, [])

# Plan Limits
PLAN_LIMITS = {
    "free": {
        "users": 1,
        "items": 100
    },
    "starter": {
        "users": 5,
        "items": float('inf')
    },
    "pro": {
        "users": float('inf'),
        "items": float('inf')
    }
}

def check_plan_limits(plan: str, resource: str, current_count: int) -> bool:
    """
    Check if the tenant has reached the limit for a specific resource based on their plan.
    Returns True if limit is NOT reached (action allowed), False otherwise.
    """
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    limit = limits.get(resource, 0)
    return current_count < limit
