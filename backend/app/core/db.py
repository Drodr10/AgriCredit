def get_farm_profile(farm_id: str):
    if farm_id == "asha_rice_punjab":
        return {
            "farm_id": farm_id,
            "soil_type": "alluvial",
            "irrigation": True,
            "historical_yield": "high"
        }
    return None
