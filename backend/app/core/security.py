from typing import Any

from clerk_backend_api import Clerk
from clerk_backend_api.security import AuthenticateRequestOptions
from fastapi import Depends, HTTPException, Request, status
from pymongo.database import Database

from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import UserInDB, doc_to_dict

# Initialize Clerk SDK
clerk = Clerk(
    bearer_auth=settings.clerk_secret_key,
)

def _get_db() -> Database:  # type: ignore[type-arg]
    return get_database()

async def get_current_user(request: Request, db: Database = Depends(_get_db)) -> dict[str, Any]:
    """
    Validates the Clerk session token from the Authorization header,
    fetches user details from Clerk if needed, and ensures the user
    exists in our local MongoDB 'users' collection.
    """
    # 1. Authenticate the request via Clerk SDK
    # We pass the raw ASGI request to the SDK (it knows how to extract headers)
    request_state = await clerk.authenticate_request(
        request, 
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key
        )
    )

    if not request_state.is_signed_in or not request_state.payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    clerk_id = request_state.payload.get("sub")
    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # 2. Look for the user in our local database
    user_doc = db.users.find_one({"clerk_id": clerk_id})
    
    # 3. If not found, create a placeholder record (Upsert pattern)
    if not user_doc:
        try:
            # We can optionally fetch more details from Clerk if we want the email
            clerk_user = await clerk.users.get(user_id=clerk_id)
            email = clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else "unknown@clerk.dev"
        except Exception:
            email = "unknown@clerk.dev"
            
        new_user = UserInDB(
            clerk_id=clerk_id,
            email=email,
            role="farmer" # Default role
        )
        doc_dict = new_user.model_dump(by_alias=True, exclude={"id"})
        result = db.users.insert_one(doc_dict)
        user_doc = db.users.find_one({"_id": result.inserted_id})
        
        if not user_doc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create local user")

    # 4. Return the user as a dict
    d = doc_to_dict(user_doc)
    d["id"] = d.pop("_id", "")
    return d
