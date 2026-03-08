from datetime import date, datetime, timezone
from typing import Annotated, Any

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field


# Custom type to coerce MongoDB ObjectId to str
PyObjectId = Annotated[str, BeforeValidator(str)]


class MongoBaseModel(BaseModel):
    """Base model that handles MongoDB's _id field."""

    id: PyObjectId | None = Field(default=None, alias="_id")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )


class FarmerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    clerk_id: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=100)
    national_id: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    gps_coordinates: str | None = Field(default=None, max_length=100)
    farm_size_hectares: float | None = Field(default=None, ge=0)
    primary_crop: str | None = Field(default=None, max_length=100)
    age: int | None = Field(default=None, ge=18, le=120)
    experience_years: int | None = Field(default=None, ge=0)
    tenure_years: int | None = Field(default=None, ge=0)
    irrigation_type: str | None = Field(default=None, max_length=100)
    soil_category: str | None = Field(default=None, max_length=100)
    machinery_type: str | None = Field(default=None, max_length=100)


class FarmerCreate(FarmerBase):
    pass


class FarmerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    clerk_id: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=100)
    national_id: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    gps_coordinates: str | None = Field(default=None, max_length=100)
    farm_size_hectares: float | None = Field(default=None, ge=0)
    primary_crop: str | None = Field(default=None, max_length=100)
    age: int | None = Field(default=None, ge=18, le=120)
    experience_years: int | None = Field(default=None, ge=0)
    tenure_years: int | None = Field(default=None, ge=0)
    irrigation_type: str | None = Field(default=None, max_length=100)
    soil_category: str | None = Field(default=None, max_length=100)
    machinery_type: str | None = Field(default=None, max_length=100)


class FarmerInDB(MongoBaseModel, FarmerBase):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Farmer(FarmerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    email: str = Field(..., max_length=255)
    clerk_id: str = Field(..., max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role: str | None = Field(default=None, max_length=50)
    birthday: date | None = Field(default=None)
    national_id: str | None = Field(default=None, max_length=50)
    experience_years: int | None = Field(default=None, ge=0)

class UserRoleUpdate(BaseModel):
    role: str = Field(..., max_length=50)
    email: str | None = Field(default=None, max_length=255)

class UserProfileUpdate(BaseModel):
    experience_years: int | None = Field(default=None, ge=0)
    birthday: date | None = Field(default=None)
    phone: str | None = Field(default=None, max_length=20)
    national_id: str | None = Field(default=None, max_length=50)

class UserCreate(UserBase):
    pass

class UserInDB(MongoBaseModel, UserBase):
    farms: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(UserBase):
    id: str
    farms: list[Farmer] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreditApplicationBase(BaseModel):
    clerk_id: str = Field(..., max_length=100)
    farmer_id: str = Field(...)  # This is the farm UUID
    crop_type: str = Field(..., max_length=100)
    region: str = Field(..., max_length=200)
    season: str = Field(..., max_length=100)
    amount_requested: float = Field(..., gt=0)
    loan_purpose: str | None = Field(default=None, max_length=100)
    has_insurance: bool | None = Field(default=False)
    insurance_type: str | None = Field(default=None, max_length=100)


class CreditApplicationCreate(CreditApplicationBase):
    pass


class CreditApplicationUpdate(BaseModel):
    status: str | None = Field(default=None)
    amount_approved: float | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=1000)


class CreditApplicationInDB(MongoBaseModel, CreditApplicationBase):
    status: str = Field(default="pending")
    amount_approved: float | None = None
    notes: str | None = None
    
    # AI Results
    risk_tier: str | None = None  # e.g., "LOW", "MEDIUM", "HIGH"
    bad_season_probability: float | None = None  # 0 to 100
    suggested_interest_rate: float | None = None
    expected_loss: float | None = None
    scenario_id: str | None = None
    
    # AI Reasoning
    rainfall_forecast: str | None = None
    yield_stability: str | None = None
    price_volatility: str | None = None
    model_confidence: str | None = None
    
    # Risk Drivers (percentage contribution)
    rainfall_anomaly_weight: float | None = None
    price_volatility_weight: float | None = None
    extreme_events_weight: float | None = None
    
    # Application details
    loan_purpose: str | None = None
    has_insurance: bool | None = None
    insurance_type: str | None = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CreditApplication(CreditApplicationBase):
    id: str
    status: str
    amount_approved: float | None
    notes: str | None
    
    risk_tier: str | None
    bad_season_probability: float | None
    suggested_interest_rate: float | None
    expected_loss: float | None
    scenario_id: str | None
    
    rainfall_forecast: str | None
    yield_stability: str | None
    price_volatility: str | None
    model_confidence: str | None
    
    rainfall_anomaly_weight: float | None
    price_volatility_weight: float | None
    extreme_events_weight: float | None
    
    loan_purpose: str | None
    has_insurance: bool | None
    insurance_type: str | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


def doc_to_dict(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert a MongoDB document, turning ObjectId fields into strings."""
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        else:
            result[key] = value
    return result
