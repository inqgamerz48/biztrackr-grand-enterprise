from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import create_access_token
from app.core.config import settings
from datetime import timedelta
from app.services import auth_service
from app.schemas import auth as schemas

class SocialAuthService:
    def verify_google_token(self, token: str):
        # MOCK: In production, verify with Google API
        # https://oauth2.googleapis.com/tokeninfo?id_token={token}
        if token.startswith("mock_google_token_"):
            email = token.replace("mock_google_token_", "") + "@gmail.com"
            return {"email": email, "sub": f"google_id_{email}", "name": "Google User"}
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
        random_password = secrets.token_urlsafe(16)
        
        user_in = schemas.UserCreate(
            email=email,
            password=random_password,
            full_name=full_name,
            role="manager" # Default role for social signup? Or maybe just user? Let's say manager for now as they are likely signing up for a new tenant
        )
        
        # We need to handle tenant creation or assignment here. 
        # For now, let's assume they are creating a new tenant implicitly or we leave it null and force them to create one later.
        # But UserCreate requires tenant logic in auth_service.create_user usually.
        # Let's use auth_service.create_user but we might need to adjust it to handle social fields.
        
        # Actually, let's just create the user directly here to control the fields
        from app.core.security import get_password_hash
        
        db_user = User(
            email=email,
            hashed_password=get_password_hash(random_password),
            full_name=full_name,
            role="manager", # Default to manager
            is_active=True,
            social_provider=provider,
            social_id=social_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

social_auth_service = SocialAuthService()
