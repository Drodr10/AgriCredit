import random
import uuid
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, status
from pymongo.database import Database

from app.core.database import get_database
from app.models.schemas import (
    CreditApplication,
    CreditApplicationCreate,
    CreditApplicationInDB,
    CreditApplicationUpdate,
    doc_to_dict,
)
from app.core.security import get_current_user
from fastapi import Depends

router = APIRouter(prefix="/credit-applications", tags=["credit_applications"], dependencies=[Depends(get_current_user)])


def _get_db() -> Database:  # type: ignore[type-arg]
    return get_database()


def _generate_mock_ai_results(amount: float) -> dict[str, Any]:
    """Generates Figma-inspired mock AI analysis data."""
    risk_tiers = ["LOW", "MEDIUM", "HIGH"]
    weights = [0.7, 0.2, 0.1]
    tier = random.choices(risk_tiers, weights=weights)[0]
    
    prob = random.uniform(5, 25) if tier == "LOW" else random.uniform(26, 60) if tier == "MEDIUM" else random.uniform(61, 95)
    rate = 8.0 if tier == "LOW" else 12.5 if tier == "MEDIUM" else 18.0
    
    return {
        "risk_tier": tier,
        "bad_season_probability": round(prob, 1),
        "suggested_interest_rate": rate,
        "expected_loss": round(amount * (prob / 100), 2),
        "scenario_id": f"SC-{datetime.now().year}-{uuid.uuid4().hex[:4].upper()}",
        
        "rainfall_forecast": "Rainfall forecast within normal range." if tier == "LOW" else "Slightly below average rainfall expected.",
        "yield_stability": "Historical yield variability is low." if tier == "LOW" else "Moderate yield fluctuations in recent years.",
        "price_volatility": "Price volatility is moderate and trending stable." if tier == "LOW" else "High market price sensitivity detected.",
        "model_confidence": "high" if tier == "LOW" else "medium",
        
        "rainfall_anomaly_weight": 25.0,
        "price_volatility_weight": 15.0,
        "extreme_events_weight": 10.0
    }


@router.get("/", response_model=list[CreditApplication])
def list_applications() -> list[Any]:
    db = _get_db()
    cursor = db.credit_applications.find()
    docs = list(cursor.limit(100))
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
def create_application(payload: CreditApplicationCreate) -> Any:
    db = _get_db()
    
    # 1. Verify farmer exists
    try:
        farmer_oid = ObjectId(payload.farmer_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid farmer ID")
    
    farmer = db.farmers.find_one({"_id": farmer_oid})
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # 2. Generate AI analysis
    ai_results = _generate_mock_ai_results(payload.amount_requested)
    
    # 3. Save application
    now = datetime.now(timezone.utc)
    doc = CreditApplicationInDB(
        **payload.model_dump(),
        **ai_results,
        created_at=now,
        updated_at=now,
    )
    doc_dict = doc.model_dump(by_alias=True, exclude={"id"})
    result = db.credit_applications.insert_one(doc_dict)
    
    created = db.credit_applications.find_one({"_id": result.inserted_id})
    if created is None:
        raise HTTPException(status_code=500, detail="Failed to retrieve created document")
        
    d = doc_to_dict(created)
    d["id"] = d.pop("_id", "")
    return d


@router.get("/{application_id}", response_model=CreditApplication)
def get_application(application_id: str) -> Any:
    db = _get_db()
    try:
        oid = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    doc = db.credit_applications.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Application not found")
    d = doc_to_dict(doc)
    d["id"] = d.pop("_id", "")
    return d


@router.patch("/{application_id}", response_model=CreditApplication)
def update_application(
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
    result = db.credit_applications.update_one(
        {"_id": oid}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    doc = db.credit_applications.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Application not found")
    d = doc_to_dict(doc)
    d["id"] = d.pop("_id", "")
    return d


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: str) -> None:
    db = _get_db()
    try:
        oid = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid application ID")
    result = db.credit_applications.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
