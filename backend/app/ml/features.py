from typing import Dict, Any

def engineer_features(farm_data: Dict[str, Any], base_features: Dict[str, float]) -> Dict[str, float]:
    """Convert raw data → ML-ready features"""
    
    features = base_features.copy()
    
    # Farm-specific adjustments
    irrigation_map = {'rainfed': 1.5, 'canal': 1.0, 'borewell': 0.8, 'mixed': 1.2}
    features['irrigation_factor'] = irrigation_map.get(farm_data.get('irrigation', 'mixed'), 1.0)
    
    features['farm_size_factor'] = farm_data.get('farm_size_ha', 1.0) / 1.5  # Punjab avg
    
    exp_map = {'beginner': 1.2, 'intermediate': 1.0, 'experienced': 0.8}
    features['experience_factor'] = exp_map.get(farm_data.get('experience', 'intermediate'), 1.0)
    
    return features
