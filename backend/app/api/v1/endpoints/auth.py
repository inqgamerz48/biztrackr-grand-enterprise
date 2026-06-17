from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/register")
async def register():
    raise HTTPException(status_code=410, detail="Use Supabase Auth on the frontend directly.")

@router.post("/login/access-token")
async def login_access_token():
    raise HTTPException(status_code=410, detail="Use Supabase Auth on the frontend directly.")

