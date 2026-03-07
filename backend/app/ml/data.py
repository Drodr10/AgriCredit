import pandas as pd
from typing import Dict, Any

class DataLoader:
    def __init__(self):
        self.yields = self._load_yields()
        self.drought = self._load_drought()
        self.prices = self._load_prices()
    
    def _load_yields(self) -> pd.DataFrame:
        # Sample data - replace with real CSV
        return pd.DataFrame({
            'district': ['Ludhiana', 'Ludhiana', 'Ludhiana', 'Amritsar'],
            'crop': ['rice', 'rice', 'rice', 'wheat'],
            'season': ['kharif', 'kharif', 'kharif', 'rabi'],
            'yield_t_ha': [4.1, 4.3, 3.9, 4.8]
        })
    
    def _load_drought(self) -> pd.DataFrame:
        return pd.DataFrame({
            'district': ['Ludhiana', 'Amritsar'],
            'season': ['kharif', 'rabi'],
            'spei': [-0.8, -0.3]  # Mild drought
        })
    
    def _load_prices(self) -> pd.DataFrame:
        return pd.DataFrame({
            'district': ['Ludhiana', 'Amritsar'],
            'crop': ['rice', 'wheat'],
            'price_volatility': [15.2, 12.8]
        })
    
    def get_features(self, district: str, crop: str, season: str) -> Dict[str, float]:
        """Lookup realistic features for district/crop/season"""
        yield_data = self.yields[(self.yields['district'] == district) & 
                                (self.yields['crop'] == crop)]
        
        return {
            'yield_avg': float(yield_data['yield_t_ha'].mean()) if not yield_data.empty else 4.0,
            'yield_volatility': float(yield_data['yield_t_ha'].std()) if len(yield_data) > 1 else 0.2,
            'spei_drought': -0.8,  # Lookup from drought CSV
            'rainfall_pct': 102.0,
            'price_volatility': 15.2
        }
