from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.ml.model import AgricreditModel

router = APIRouter(prefix="/ml", tags=["ml"])

class AnalysisRequest(BaseModel):
    season: str
    crop: str
    loan_amount: float

model = AgricreditModel()  # Global singleton

@router.post("/analyze/{farm_id}")
async def analyze_farm(farm_id: str, request: AnalysisRequest):
    # Mock farm lookup (replace with your DB)
    farm_data = {
        "district": "Ludhiana",
        "crop": request.crop,
        "season": request.season,
        "farm_size_ha": 1.2,
        "irrigation": "canal",
        "experience": "experienced",
        "loan_amount": request.loan_amount
    }
    
    result = model.predict_risk(farm_data)
    return result
