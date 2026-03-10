from datetime import datetime, timezone
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, status, Body
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.models.schemas import (
    User,
    UserCreate,
    UserInDB,
    Farmer,
    FarmerCreate,
    UserRoleUpdate,
    UserProfileUpdate,
    doc_to_dict,
)

router = APIRouter(prefix="/users", tags=["users"])

def _get_db() -> AsyncIOMotorDatabase:
    return get_database()

@router.get("/me", response_model=User)
async def get_current_user(clerk_id: str, email: str | None = None):
    db = _get_db()
    user_doc = await db.users.find_one({"clerk_id": clerk_id})
    if not user_doc:
        # Auto-create empty user profile if it doesn't exist yet
        now = datetime.now(timezone.utc)
        user_in_db = UserInDB(
            clerk_id=clerk_id, 
            email=email or "pending@user.com",
            role="farmer",
            created_at=now,
            updated_at=now
        )
        doc_dict = user_in_db.model_dump(by_alias=True, exclude={"id"})
        await db.users.insert_one(doc_dict)
        user_doc = await db.users.find_one({"clerk_id": clerk_id})
    elif email and user_doc.get("email") == "pending@user.com":
        # Update placeholder email with real one if provided
        await db.users.update_one({"clerk_id": clerk_id}, {"$set": {"email": email, "updated_at": datetime.now(timezone.utc)}})
        user_doc = await db.users.find_one({"clerk_id": clerk_id})
    
    d = doc_to_dict(user_doc)
    d["id"] = d.pop("_id", "")
    # Ensure role is explicitly farmer if missing for existing users
    if not d.get("role"):
        d["role"] = "farmer"
    return d

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate):
    db = _get_db()
    existing = await db.users.find_one({"clerk_id": payload.clerk_id})
    if existing:
        return await get_current_user(payload.clerk_id)
    
    now = datetime.now(timezone.utc)
    user_in_db = UserInDB(**payload.model_dump(), created_at=now, updated_at=now)
    doc_dict = user_in_db.model_dump(by_alias=True, exclude={"id"})
    
    result = await db.users.insert_one(doc_dict)
    created = await db.users.find_one({"_id": result.inserted_id})
    
    d = doc_to_dict(created)
    d["id"] = d.pop("_id", "")
    return d

@router.post("/me/farms", response_model=Farmer, status_code=status.HTTP_201_CREATED)
async def add_farm_to_user(clerk_id: str, payload: FarmerCreate):
    db = _get_db()
    user_doc = await db.users.find_one({"clerk_id": clerk_id})
    if not user_doc:
         # Initialize user if missing
         user_doc = await create_user(UserCreate(clerk_id=clerk_id, email="pending@user.com"))
         user_id = user_doc["id"]
    else:
         user_id = user_doc["_id"]

    now = datetime.now(timezone.utc)
    farm_id = str(uuid.uuid4())
    
    farm_dict = payload.model_dump()
    farm_dict["id"] = farm_id
    farm_dict["created_at"] = now
    farm_dict["updated_at"] = now
    
    update_fields: dict[str, Any] = {"updated_at": now}
    if payload.email and (not user_doc.get("email") or user_doc.get("email") == "pending@user.com"):
        update_fields["email"] = payload.email
    if payload.phone and not user_doc.get("phone"):
        update_fields["phone"] = payload.phone

    await db.users.update_one(
        {"clerk_id": clerk_id},
        {"$push": {"farms": farm_dict}, "$set": update_fields}
    )
    
    return farm_dict

@router.patch("/me/role", response_model=User)
async def update_user_role(clerk_id: str, payload: UserRoleUpdate):
    db = _get_db()
    user_doc = await db.users.find_one({"clerk_id": clerk_id})
    now = datetime.now(timezone.utc)
    
    if not user_doc:
        if not payload.email:
            raise HTTPException(status_code=400, detail="User not found and no email provided to create one")
        # Initialize user if missing
        user_in_db = UserInDB(
            clerk_id=clerk_id,
            email=payload.email,
            role=payload.role,
            created_at=now,
            updated_at=now
        )
        doc_dict = user_in_db.model_dump(by_alias=True, exclude={"id"})
        await db.users.insert_one(doc_dict)
    else:
        update_fields = {"role": payload.role, "updated_at": now}
        if payload.email and user_doc.get("email") == "pending@user.com":
            update_fields["email"] = payload.email
            
        await db.users.update_one(
            {"clerk_id": clerk_id},
            {"$set": update_fields}
        )
    
    updated = await db.users.find_one({"clerk_id": clerk_id})
    d = doc_to_dict(updated)
    d["id"] = d.pop("_id", "")
    return d


@router.patch("/me/profile", response_model=User)
async def update_user_profile(clerk_id: str, payload: UserProfileUpdate):
    db = _get_db()
    user_doc = await db.users.find_one({"clerk_id": clerk_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc)
    update_fields: dict[str, Any] = {"updated_at": now}

    for key, value in payload.model_dump().items():
        if value is not None:
            # Convert date objects to datetime for MongoDB
            if hasattr(value, 'isoformat') and not isinstance(value, datetime):
                update_fields[key] = datetime.combine(value, datetime.min.time())
            else:
                update_fields[key] = value

    if len(update_fields) <= 1:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    await db.users.update_one({"clerk_id": clerk_id}, {"$set": update_fields})

    updated = await db.users.find_one({"clerk_id": clerk_id})
    d = doc_to_dict(updated)
    d["id"] = d.pop("_id", "")
    return d


@router.patch("/me/farms/{farm_id}", response_model=Farmer)
async def update_farm(clerk_id: str, farm_id: str, payload: dict = Body(...)):
    db = _get_db()
    user_doc = await db.users.find_one({"clerk_id": clerk_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    farms = user_doc.get("farms", [])
    farm_index = next((i for i, f in enumerate(farms) if f.get("id") == farm_id), None)
    if farm_index is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    now = datetime.now(timezone.utc)
    allowed_fields = {"name", "location", "gps_coordinates", "farm_size_hectares", "soil_category",
                      "irrigation_type", "machinery_type"}
    
    update_ops: dict[str, Any] = {f"farms.{farm_index}.updated_at": now}
    for key, value in payload.items():
        if key in allowed_fields:
            update_ops[f"farms.{farm_index}.{key}"] = value
    
    if len(update_ops) <= 1:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.users.update_one({"clerk_id": clerk_id}, {"$set": update_ops})
    
    updated_user = await db.users.find_one({"clerk_id": clerk_id})
    updated_farm = next(f for f in updated_user["farms"] if f.get("id") == farm_id)
    return updated_farm


@router.delete("/me/farms/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(clerk_id: str, farm_id: str):
    db = _get_db()
    user_doc = await db.users.find_one({"clerk_id": clerk_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if farm exists for this user
    farms = user_doc.get("farms", [])
    if not any(f.get("id") == farm_id for f in farms):
        raise HTTPException(status_code=404, detail="Farm not found")

    # Remove the farm from the user's array
    result = await db.users.update_one(
        {"clerk_id": clerk_id},
        {"$pull": {"farms": {"id": farm_id}}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete farm from user profile")

    # Cascade delete all credit applications associated with this farm
    await db.credit_applications.delete_many({"farmer_id": farm_id, "clerk_id": clerk_id})

    return None
