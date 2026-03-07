import pandas as pd
from typing import Dict, Any
from backend.app.ml.pipeline import RealDataPipeline

class DataLoader:
    def __init__(self):
        """
        Loads dataset using RealDataPipeline.
        """
        self.pipeline = RealDataPipeline()
    
    def get_district_features(self, district: str, crop: str, season: str) -> Dict[str, float]:
        """
        Lookup realistic features for given district/crop/season.
        Returns dict ready for ML model.
        """
        return self.pipeline.get_district_features(district, crop, season)
