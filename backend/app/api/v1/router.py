from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, 
    users, 
    inventory, 
    sales, 
    crm, 
    expenses, 
    reports, 
    settings, 
    ai, 
    billing,
    notifications,
    dashboard,
    payment_requests,
    seed
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(crm.router, prefix="/crm", tags=["crm"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(payment_requests.router, prefix="/payment-requests", tags=["payment-requests"])
api_router.include_router(seed.router, prefix="/seed", tags=["seed"])
