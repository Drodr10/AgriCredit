from typing import Any

from clerk_backend_api import Clerk
from clerk_backend_api.security import AuthenticateRequestOptions
from fastapi import Depends, HTTPException, Request, status
from pymongo.database import Database

from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import FarmerInDB, doc_to_dict

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
    exists in our local MongoDB 'farmers' collection.
    """
    # 1. Authenticate the request via Clerk SDK
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

    # 2. Look for the user in our local 'farmers' database
    # We use clerk_id to track them across logins
    farmer_doc = db.farmers.find_one({"clerk_id": clerk_id})
    
    # 3. If not found, create a placeholder Farmer record (Upsert pattern)
    if not farmer_doc:
        try:
            # We can optionally fetch more details from Clerk if we want the email
            clerk_user = await clerk.users.get(user_id=clerk_id)
            email = clerk_user.email_addresses[0].email_address if clerk_user.email_addresses else "unknown@clerk.dev"
            name = email.split("@")[0] if "@" in email else "New Farmer"
        except Exception as e:
            print(f"Failed to fetch Clerk user details: {e}")
            email = "unknown@clerk.dev"
            name = "New Farmer"
            
        new_farmer = FarmerInDB(
            clerk_id=clerk_id,
            name=name,
            national_id="PENDING", # Required by FarmerBase but unknown at sign-up
            primary_crop="Unknown",
            contact_email=email
        )
        
        doc_dict = new_farmer.model_dump(by_alias=True, exclude={"id", "created_at", "updated_at"})
        # Add timestamps explicitly to avoid pydantic issues on insert
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        doc_dict["created_at"] = now
        doc_dict["updated_at"] = now
        
        result = db.farmers.insert_one(doc_dict)
        farmer_doc = db.farmers.find_one({"_id": result.inserted_id})
        
        if not farmer_doc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create local farmer profile")

    # 4. Return the farmer document as a dict
    d = doc_to_dict(farmer_doc)
    d["id"] = d.pop("_id", "")
    return d
