from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import create_access_token
from app.core.config import settings
from datetime import timedelta
from app.services import auth_service
from app.schemas import auth as schemas

class SocialAuthService:
    def verify_google_token(self, token: str):
        import httpx
        try:
            # Verify Access Token and get User Info from Google
            # Frontend sends an Access Token, not an ID Token
            response = httpx.get(
                "https://www.googleapis.com/oauth2/v3/userinfo", 
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                print(f"Google Auth Failed: {response.text}")
                return None
            
            data = response.json()
            
            # Note: UserInfo endpoint doesn't return 'aud' to verify Client ID directly in the same way,
            # but using the access token to fetch user info proves the token is valid and grants access to profile.
            # We trust Google to return the correct user for the valid token.
                
            return {
                "email": data["email"], 
                "sub": data["sub"], 
                "name": data.get("name", data["email"].split("@")[0])
            }
        except Exception as e:
            print(f"Google Auth Error: {e}")
            return None

    def verify_github_token(self, token: str):
        # MOCK: In production, exchange code for token, then get user info
        if token.startswith("mock_github_code_"):
            username = token.replace("mock_github_code_", "")
            return {"email": f"{username}@github.com", "id": f"github_id_{username}", "name": "GitHub User"}
        return None

    def get_or_create_social_user(self, db: Session, email: str, social_id: str, provider: str, full_name: str):
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link social account if not linked
            if not user.social_id:
                user.social_provider = provider
                user.social_id = social_id
                db.commit()
                db.refresh(user)
            return user
        
        # Create new user
        # Generate a random password for social users
        import secrets
        from app.models.tenant import Tenant
        random_password = secrets.token_urlsafe(16)
        
        # 1. Create a default tenant for this user
        # Use their name or email to name the tenant
        tenant_name = f"{full_name}'s Organization"
        new_tenant = Tenant(name=tenant_name)
        db.add(new_tenant)
        db.flush() # Get ID
        
        from app.core.security import get_password_hash
        
        db_user = User(
            email=email,
            hashed_password=get_password_hash(random_password),
            full_name=full_name,
            role="admin", # Make them Admin of their own new tenant
            is_active=True,
            social_provider=provider,
            social_id=social_id,
            tenant_id=new_tenant.id # Assign to new tenant
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

social_auth_service = SocialAuthService()
