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
from app.ml.model import AgricreditModel

router = APIRouter(prefix="/credit-applications", tags=["credit_applications"])

# Instantiate model once at module level
_model = AgricreditModel()


def _get_db() -> Database:  # type: ignore[type-arg]
    return get_database()


def _run_ai_analysis(payload: CreditApplicationCreate, farm: dict, user_doc: dict) -> dict[str, Any]:
    """Run the real AgricreditModel and map outputs to DB schema fields."""
    # Map experience_years from user profile to experience level
    exp_years = user_doc.get("experience_years", 0) or 0
    if exp_years >= 5:
        experience = "experienced"
    elif exp_years >= 2:
        experience = "intermediate"
    else:
        experience = "beginner"

    farm_data = {
        "district": "Ludhiana",  # Demo: hardcoded to Ludhiana
        "crop": payload.crop_type.lower(),
        "season": payload.season.lower(),
        "farm_size_ha": farm.get("farm_size_hectares", 1.0) or 1.0,
        "irrigation": (farm.get("irrigation_type") or "mixed").lower(),
        "experience": experience,
        "loan_amount": payload.amount_requested,
    }

    result = _model.predict_risk(farm_data)

    # Extract feature importance weights for the top risk drivers
    importance = result.get("feature_importance", [])
    rainfall_w = next((f["weight"] for f in importance if "Rainfall" in f["name"] or "SPEI" in f["name"]), 0.25)
    price_w = next((f["weight"] for f in importance if "Price" in f["name"]), 0.15)
    extreme_w = next((f["weight"] for f in importance if "Yield" in f["name"]), 0.10)

    # Extract farmer_summary list
    summary = result.get("farmer_summary", [])
    model_comp = result.get("model_comparison", {})

    scenario_id_str = str(uuid.uuid4().hex)[:4].upper()

    return {
        "risk_tier": result["risk_tier"],
        "bad_season_probability": round(result["pd"] * 100, 1),
        "suggested_interest_rate": round(result["suggested_rate"] * 100, 1),
        "expected_loss": round(result["expected_loss"], 2),
        "scenario_id": f"SC-{datetime.now().year}-{scenario_id_str}",

        "rainfall_forecast": summary[0] if len(summary) > 0 else "Rainfall data unavailable.",
        "yield_stability": summary[1] if len(summary) > 1 else "Yield data unavailable.",
        "price_volatility": summary[2] if len(summary) > 2 else "Price data unavailable.",
        "model_confidence": model_comp.get("model", "unknown"),

        "rainfall_anomaly_weight": round(rainfall_w * 100, 1),
        "price_volatility_weight": round(price_w * 100, 1),
        "extreme_events_weight": round(extreme_w * 100, 1),
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


@router.get("/by-farm/{farm_id}", response_model=list[CreditApplication])
def list_applications_by_farm(farm_id: str) -> list[Any]:
    db = _get_db()
    cursor = db.credit_applications.find({"farmer_id": farm_id}).sort("created_at", -1)
    docs = list(cursor.limit(50))
    results = []
    for doc in docs:
        d = doc_to_dict(doc)
        d["id"] = d.pop("_id", d.get("id", ""))
        results.append(d)
    return results


@router.get("/by-user/{clerk_id}", response_model=list[CreditApplication])
def list_applications_by_user(clerk_id: str) -> list[Any]:
    db = _get_db()
    user_doc = db.users.find_one({"clerk_id": clerk_id})
    if not user_doc:
        return []
    farm_ids = [f.get("id") for f in user_doc.get("farms", []) if f.get("id")]
    if not farm_ids:
        return []
    cursor = db.credit_applications.find({"farmer_id": {"$in": farm_ids}}).sort("created_at", -1)
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
    
    # 1. Verify farm exists in user's profile
    user_doc = db.users.find_one({"clerk_id": payload.clerk_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    farms = user_doc.get("farms", [])
    farm = next((f for f in farms if f.get("id") == payload.farmer_id), None)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found in user profile")

    # 2. Run real AI analysis
    try:
        ai_results = _run_ai_analysis(payload, farm, user_doc)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"AI analysis failed: {str(e)}")
    
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
