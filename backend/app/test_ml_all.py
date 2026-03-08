import os
import sys
from pathlib import Path

# Fix 'ModuleNotFoundError: No module named app' 
# Insert the 'backend' dir into the system path so 'app.x' imports resolve
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_dir)

# Now we can import from app
from app.ml.pipeline import RealDataPipeline
from app.ml.model import AgricreditModel

def print_scenario_result(name: str, result: dict, features: dict):
    print(f"\n{'='*50}")
    print(f"[{name.upper()}]")
    print(f"{'='*50}")
    
    # Extract values
    pd_pct = result.get('pd', 0) * 100
    risk = result.get('risk_tier', 'UNKNOWN')
    loss = result.get('expected_loss', 0)
    
    yield_avg = features.get('yieldavg', 0)
    rain = features.get('rainfallpct', 100)
    
    print(f"PD: {pd_pct:.1f}%, Risk: {risk}, Loss: ${loss:,.0f}, Yield: {yield_avg:.2f} t/ha, Rain: {rain:.0f}% (NASA)")
    
    # Feature importance top 3
    importance = result.get('feature_importance', [])
    if importance:
        print("\nTop 3 Risk Drivers:")
        for idx, feat in enumerate(importance[:3]):
            print(f"  {idx+1}. {feat['name']}: {feat['value']} (Weight: {feat['weight']:.2f})")
    
    # Summary texts
    summary = result.get('farmer_summary', [])
    if summary:
        print("\nML Summary:")
        for line in summary:
            print(f"  - {line}")

def main():
    print("Initializing Data Pipeline & Loading Models...")
    # Because this is run from backend/app/ we need to ensure the pipeline path is correct
    # Pipeline defaults to 'backend/data' but if run from 'backend/app' CWD it might fail
    # Let's ensure pipeline reads from the actual absolute path to data
    data_dir = os.path.join(backend_dir, 'data')
    pipeline = RealDataPipeline(data_dir=data_dir)
    model = AgricreditModel()
    
    # We also need to hack model to use the pipeline instance if we want,
    # but AgricreditModel initializes its own DataLoader which initializes RealDataPipeline
    # Model's DataLoader doesn't take args, so we might need to rely on the model.predict_risk base_features injection
    
    # Define scenarios
    scenarios = [
        {
            "id": "ludhiana_rice_kharif",
            "farm_data": {
                "district": "Ludhiana", "crop": "rice", "season": "kharif",
                "farm_size_ha": 2.5, "irrigation": "canal", "experience": "experienced", "loan_amount": 50000
            }
        },
        {
            "id": "ludhiana_wheat_rabi",
            "farm_data": {
                "district": "Ludhiana", "crop": "wheat", "season": "rabi",
                "farm_size_ha": 3.0, "irrigation": "tubewell", "experience": "average", "loan_amount": 75000
            }
        },
        {
            "id": "drought_rice",
            "farm_data": {
                "district": "Ludhiana", "crop": "rice", "season": "kharif",
                "farm_size_ha": 1.5, "irrigation": "rainfed", "experience": "novice", "loan_amount": 25000
            },
            "force_weather_override": {"rainfallpctnormal": 45.0, "tempanomaly": 2.5}  # Bad conditions
        },
        {
            "id": "good_wheat",
            "farm_data": {
                "district": "Ludhiana", "crop": "wheat", "season": "rabi",
                "farm_size_ha": 5.0, "irrigation": "tubewell", "experience": "experienced", "loan_amount": 100000
            },
            "force_weather_override": {"rainfallpctnormal": 105.0, "tempanomaly": -0.5}  # Optimal conditions
        }
    ]
    
    for s in scenarios:
        farm_data = s["farm_data"]
        
        # 1. Get base features from pipeline
        try:
            base_features = pipeline.get_district_features(farm_data['district'], farm_data['crop'], farm_data['season'])
        except Exception as e:
            print(f"Pipeline error for {s['id']}: {e}")
            continue
            
        # 2. Inject forced weather if this is a synthetic drought/good scenario
        if "force_weather_override" in s:
            if "rainfallpctnormal" in s["force_weather_override"]:
                base_features["rainfallpct"] = s["force_weather_override"]["rainfallpctnormal"]
                base_features["speidrought"] = -1.5 if s["force_weather_override"]["rainfallpctnormal"] < 80 else 0.5
            if "tempanomaly" in s["force_weather_override"]:
                base_features["tempanomaly"] = s["force_weather_override"]["tempanomaly"]
                
        # 3. Predict via Model
        result = model.predict_risk(farm_data, base_features=base_features)
        
        # 4. Print
        print_scenario_result(s["id"], result, base_features)

if __name__ == "__main__":
    main()
