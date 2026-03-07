from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.models.schemas import (
    CreditApplication,
    CreditApplicationCreate,
    CreditApplicationInDB,
    CreditApplicationUpdate,
    doc_to_dict,
)

router = APIRouter(prefix="/credit-applications", tags=["credit-applications"])


def _get_db() -> AsyncIOMotorDatabase:  # type: ignore[type-arg]
    return get_database()


@router.get("/", response_model=list[CreditApplication])
async def list_applications() -> list[Any]:
    db = _get_db()
    cursor = db.credit_applications.find()
    docs = await cursor.to_list(length=100)
    results = []
    for doc in docs:
        d = doc_to_dict(doc)
        d["id"] = d.pop("_id", d.get("id", ""))
        results.append(d)
    return results


@router.post(
    "/",
    response_model=CreditApplication,
    status_code=status.HTTP_201_CREATED,
)
async def create_application(payload: CreditApplicationCreate) -> Any:
    db = _get_db()
    now = datetime.now(timezone.utc)
    doc = CreditApplicationInDB(
        **payload.model_dump(),
        created_at=now,
        updated_at=now,
    )
    doc_dict = doc.model_dump(by_alias=True, exclude={"id"})
    result = await db.credit_applications.insert_one(doc_dict)
    created = await db.credit_applications.find_one({"_id": result.inserted_id})
    if created is None:
        raise HTTPException(status_code=500, detail="Failed to retrieve created document")
    d = doc_to_dict(created)
    d["id"] = d.pop("_id", "")
    return d


@router.get("/{application_id}", response_model=CreditApplication)
async def get_application(application_id: str) -> Any:
    db = _get_db()
    try:
        oid = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    doc = await db.credit_applications.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Application not found")
    d = doc_to_dict(doc)
    d["id"] = d.pop("_id", "")
    return d


@router.patch("/{application_id}", response_model=CreditApplication)
async def update_application(
    application_id: str, payload: CreditApplicationUpdate
) -> Any:
    db = _get_db()
    try:
        oid = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await db.credit_applications.update_one(
        {"_id": oid}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    doc = await db.credit_applications.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Application not found")
    d = doc_to_dict(doc)
    d["id"] = d.pop("_id", "")
    return d


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(application_id: str) -> None:
    db = _get_db()
    try:
        oid = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    result = await db.credit_applications.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
