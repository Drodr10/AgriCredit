import os
from typing import Dict, Any
from .pipeline import RealDataPipeline

class DataLoader:
    def __init__(self):
        # Always resolve data_dir correctly relative to data.py location (app/ml/data.py -> app/ml -> app -> backend -> data)
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        data_dir = os.path.join(base_dir, 'data')
        self.pipeline = RealDataPipeline(data_dir=data_dir)  # Real CSVs!

    def get_district_features(self, district: str, crop: str, season: str) -> Dict[str, float]:
        return self.pipeline.get_district_features(district, crop, season)
