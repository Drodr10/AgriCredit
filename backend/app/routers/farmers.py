from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, status
from pymongo.database import Database

from app.core.database import get_database
from app.models.schemas import (
    Farmer,
    FarmerCreate,
    FarmerInDB,
    FarmerUpdate,
    doc_to_dict,
)
from app.core.security import get_current_user
from fastapi import Depends

router = APIRouter(prefix="/farmers", tags=["farmers"], dependencies=[Depends(get_current_user)])


def _get_db() -> Database:  # type: ignore[type-arg]
    return get_database()


@router.get("/", response_model=list[Farmer])
def list_farmers() -> list[Any]:
    db = _get_db()
    cursor = db.farmers.find()
    docs = list(cursor.limit(100))
    results = []
    for doc in docs:
        d = doc_to_dict(doc)
        d["id"] = d.pop("_id", d.get("id", ""))
        results.append(d)
    return results


@router.post("/", response_model=Farmer, status_code=status.HTTP_201_CREATED)
def create_farmer(payload: FarmerCreate) -> Any:
    db = _get_db()
    now = datetime.now(timezone.utc)
    doc = FarmerInDB(**payload.model_dump(), created_at=now, updated_at=now)
    doc_dict = doc.model_dump(by_alias=True, exclude={"id"})
    result = db.farmers.insert_one(doc_dict)
    created = db.farmers.find_one({"_id": result.inserted_id})
    if created is None:
        raise HTTPException(status_code=500, detail="Failed to retrieve created document")
    d = doc_to_dict(created)
    d["id"] = d.pop("_id", "")
    return d


@router.get("/{farmer_id}", response_model=Farmer)
def get_farmer(farmer_id: str) -> Any:
    db = _get_db()
    try:
        oid = ObjectId(farmer_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid farmer ID")
    doc = db.farmers.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Farmer not found")
    d = doc_to_dict(doc)
    d["id"] = d.pop("_id", "")
    return d


@router.patch("/{farmer_id}", response_model=Farmer)
def update_farmer(farmer_id: str, payload: FarmerUpdate) -> Any:
    db = _get_db()
    try:
        oid = ObjectId(farmer_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid farmer ID")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.farmers.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Farmer not found")
    doc = db.farmers.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Farmer not found")
    d = doc_to_dict(doc)
    d["id"] = d.pop("_id", "")
    return d


@router.delete("/{farmer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farmer(farmer_id: str) -> None:
    db = _get_db()
    try:
        oid = ObjectId(farmer_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid farmer ID")
    result = db.farmers.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Farmer not found")
