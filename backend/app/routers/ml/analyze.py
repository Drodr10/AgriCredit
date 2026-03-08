from fastapi import APIRouter
from pydantic import BaseModel
from app.ml.model import AgricreditModel

router = APIRouter(prefix="/ml", tags=["ml"])

class AnalysisRequest(BaseModel):
    season: str
    crop: str
    loan_amount: float

model = AgricreditModel()

@router.post("/analyze/{farm_id}")
async def analyze_farm(farm_id: str, request: AnalysisRequest):
    farm_data = {
        "district": "Ludhiana",  # Mock for now
        "crop": request.crop,
        "season": request.season,
        "farm_size_ha": 1.2,
        "irrigation": "canal",
        "experience": "experienced",
        "loan_amount": request.loan_amount
    }
    # Get features explicitly
    features = model.data.get_district_features(farm_data['district'], farm_data['crop'], farm_data['season'])
    
    result = model.predict_risk(farm_data, base_features=features)
    # Add features to the API response for the frontend
    result['district_features'] = features
    return result
