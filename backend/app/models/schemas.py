from datetime import datetime, timezone
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
    national_id: str = Field(..., min_length=1, max_length=50)
    phone: str | None = Field(default=None, max_length=20)
    location: str | None = Field(default=None, max_length=200)
    farm_size_hectares: float | None = Field(default=None, ge=0)
    primary_crop: str | None = Field(default=None, max_length=100)


class FarmerCreate(FarmerBase):
    pass


class FarmerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    location: str | None = Field(default=None, max_length=200)
    farm_size_hectares: float | None = Field(default=None, ge=0)
    primary_crop: str | None = Field(default=None, max_length=100)


class FarmerInDB(MongoBaseModel, FarmerBase):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Farmer(FarmerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreditApplicationBase(BaseModel):
    farmer_id: str = Field(...)
    amount_requested: float = Field(..., gt=0)
    purpose: str = Field(..., min_length=1, max_length=500)
    repayment_period_months: int = Field(..., ge=1, le=360)


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CreditApplication(CreditApplicationBase):
    id: str
    status: str
    amount_approved: float | None
    notes: str | None
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
