import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Any

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

def generate_heatmap_data(pipeline: RealDataPipeline, model: AgricreditModel) -> List[Dict[str, Any]]:
    """Generate district-level risk heatmap data"""
    print("\n📊 Generating Regional Risk Heatmap Data...")
    
    # Sample major agricultural districts in India
    districts = [
        "Ludhiana", "Indore", "Akola", "Nashik", "Khanna",
        "Hisar", "Kota", "Belgaum", "Bijnor", "Meerut"
    ]
    
    crops = ["rice", "wheat"]
    seasons = ["kharif", "rabi"]
    
    heatmap_data = []
    
    for district in districts:
        for crop in crops:
            for season in seasons:
                try:
                    features = pipeline.get_district_features(district, crop, season)
                    farm_data = {
                        "district": district,
                        "crop": crop,
                        "season": season,
                        "farm_size_ha": 2.5,
                        "irrigation": "canal",
                        "experience": "average",
                        "loan_amount": 50000
                    }
                    result = model.predict_risk(farm_data, base_features=features)
                    
                    pd = result.get('pd', 0)
                    risk_tier = result.get('risk_tier', 'MEDIUM')
                    
                    # Convert PD to risk score (0-100)
                    risk_score = min(100, max(0, pd * 100))
                    
                    # Determine risk color
                    if risk_score < 40:
                        risk_level = "LOW"
                    elif risk_score < 65:
                        risk_level = "MEDIUM"
                    else:
                        risk_level = "HIGH"
                    
                    heatmap_data.append({
                        "district": district,
                        "crop": crop,
                        "season": season,
                        "risk_score": round(risk_score, 1),
                        "risk_level": risk_level,
                        "probability_of_default": round(pd * 100, 1),
                        "yield_potential": round(features.get('yieldavg', 0), 2),
                        "rainfall_pct": round(features.get('rainfallpct', 100), 1)
                    })
                except Exception as e:
                    print(f"  ⚠️  Skipped {district}/{crop}/{season}: {str(e)[:30]}")
                    continue
    
    return heatmap_data

def generate_seasonal_trend_data(pipeline: RealDataPipeline, model: AgricreditModel) -> List[Dict[str, Any]]:
    """Generate seasonal trend analysis showing performance across seasons"""
    print("\n📈 Generating Seasonal Trend Data...")
    
    # Focus on Ludhiana for detailed seasonal breakdown
    district = "Ludhiana"
    crops = ["rice", "wheat"]
    seasons = ["kharif", "rabi"]
    
    seasonal_data = []
    
    for crop in crops:
        crop_seasons = []
        for season in seasons:
            try:
                features = pipeline.get_district_features(district, crop, season)
                farm_data = {
                    "district": district,
                    "crop": crop,
                    "season": season,
                    "farm_size_ha": 2.5,
                    "irrigation": "canal",
                    "experience": "experienced",
                    "loan_amount": 50000
                }
                result = model.predict_risk(farm_data, base_features=features)
                
                pd = result.get('pd', 0)
                yield_potential = features.get('yieldavg', 0)
                
                crop_seasons.append({
                    "season": season.capitalize(),
                    "probability_of_default": round(pd * 100, 1),
                    "yield_potential": round(yield_potential, 2),
                    "rainfall_pct": round(features.get('rainfallpct', 100), 1)
                })
            except Exception:
                continue
        
        if crop_seasons:
            seasonal_data.append({
                "crop": crop.capitalize(),
                "seasons": crop_seasons
            })
    
    return seasonal_data

def generate_portfolio_risk_distribution(heatmap_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate portfolio risk distribution analysis"""
    print("\n📊 Generating Portfolio Risk Distribution...")
    
    # Count risk tiers
    low_count = sum(1 for item in heatmap_data if item['risk_level'] == 'LOW')
    medium_count = sum(1 for item in heatmap_data if item['risk_level'] == 'MEDIUM')
    high_count = sum(1 for item in heatmap_data if item['risk_level'] == 'HIGH')
    
    total = len(heatmap_data)
    
    portfolio_data = {
        "summary": {
            "total_assessments": total,
            "low_risk_count": low_count,
            "medium_risk_count": medium_count,
            "high_risk_count": high_count,
            "low_risk_pct": round((low_count / total * 100) if total > 0 else 0, 1),
            "medium_risk_pct": round((medium_count / total * 100) if total > 0 else 0, 1),
            "high_risk_pct": round((high_count / total * 100) if total > 0 else 0, 1),
        },
        "by_crop": {},
        "by_season": {},
        "distribution": [
            {"name": "Low Risk", "value": low_count, "percentage": round((low_count / total * 100) if total > 0 else 0, 1)},
            {"name": "Medium Risk", "value": medium_count, "percentage": round((medium_count / total * 100) if total > 0 else 0, 1)},
            {"name": "High Risk", "value": high_count, "percentage": round((high_count / total * 100) if total > 0 else 0, 1)},
        ]
    }
    
    # Risk by crop
    for crop in set(item['crop'] for item in heatmap_data):
        crop_items = [item for item in heatmap_data if item['crop'] == crop]
        crop_low = sum(1 for item in crop_items if item['risk_level'] == 'LOW')
        crop_medium = sum(1 for item in crop_items if item['risk_level'] == 'MEDIUM')
        crop_high = sum(1 for item in crop_items if item['risk_level'] == 'HIGH')
        portfolio_data["by_crop"][crop] = {
            "low": crop_low,
            "medium": crop_medium,
            "high": crop_high
        }
    
    # Risk by season
    for season in set(item['season'] for item in heatmap_data):
        season_items = [item for item in heatmap_data if item['season'] == season]
        season_low = sum(1 for item in season_items if item['risk_level'] == 'LOW')
        season_medium = sum(1 for item in season_items if item['risk_level'] == 'MEDIUM')
        season_high = sum(1 for item in season_items if item['risk_level'] == 'HIGH')
        portfolio_data["by_season"][season] = {
            "low": season_low,
            "medium": season_medium,
            "high": season_high
        }
    
    return portfolio_data

def save_graph_data(heatmap_data: List[Dict], seasonal_data: List[Dict], portfolio_data: Dict):
    """Save all graph data to JSON files in frontend-accessible location"""
    output_dir = os.path.join(backend_dir, '..', 'frontend', 'public', 'graphs')
    os.makedirs(output_dir, exist_ok=True)
    
    # Save heatmap data
    with open(os.path.join(output_dir, 'heatmap.json'), 'w') as f:
        json.dump({"data": heatmap_data}, f, indent=2)
    print(f"✅ Saved heatmap data ({len(heatmap_data)} items)")
    
    # Save seasonal data
    with open(os.path.join(output_dir, 'seasonal.json'), 'w') as f:
        json.dump({"data": seasonal_data}, f, indent=2)
    print(f"✅ Saved seasonal trend data ({len(seasonal_data)} crops)")
    
    # Save portfolio data
    with open(os.path.join(output_dir, 'portfolio.json'), 'w') as f:
        json.dump(portfolio_data, f, indent=2)
    print(f"✅ Saved portfolio risk distribution")
    
    print(f"\n📁 All graph data saved to: {output_dir}")


def main():
    print("Initializing Data Pipeline & Loading Models...")
    # Because this is run from backend/app/ we need to ensure the pipeline path is correct
    # Pipeline defaults to 'backend/data' but if run from 'backend/app' CWD it might fail
    # Let's ensure pipeline reads from the actual absolute path to data
    data_dir = os.path.join(backend_dir, 'data')
    pipeline = RealDataPipeline(data_dir=data_dir)
    model = AgricreditModel()
    
    print("✅ Pipeline and Model loaded successfully\n")
    
    # ═══════════════════════════════════════════════════════════
    # GENERATE GRAPH DATA FOR LANDING PAGE
    # ═══════════════════════════════════════════════════════════
    
    heatmap_data = generate_heatmap_data(pipeline, model)
    seasonal_data = generate_seasonal_trend_data(pipeline, model)
    portfolio_data = generate_portfolio_risk_distribution(heatmap_data)
    
    # Save all data as JSON files for frontend
    save_graph_data(heatmap_data, seasonal_data, portfolio_data)
    
    print("\n" + "="*70)
    print("📊 GRAPH DATA SUMMARY")
    print("="*70)
    print(f"Heatmap Districts:     {len(set(item['district'] for item in heatmap_data))} districts")
    print(f"Heatmap Total Entries: {len(heatmap_data)}")
    print(f"Seasonal Trends:       {len(seasonal_data)} crops")
    print(f"Portfolio Distribution: {portfolio_data['summary']['total_assessments']} assessments")
    print(f"  - Low Risk:    {portfolio_data['summary']['low_risk_count']} ({portfolio_data['summary']['low_risk_pct']}%)")
    print(f"  - Medium Risk: {portfolio_data['summary']['medium_risk_count']} ({portfolio_data['summary']['medium_risk_pct']}%)")
    print(f"  - High Risk:   {portfolio_data['summary']['high_risk_count']} ({portfolio_data['summary']['high_risk_pct']}%)")
    print("="*70)
    
    # ═══════════════════════════════════════════════════════════
    # OPTIONAL: Run scenario tests for detailed diagnosis
    # ═══════════════════════════════════════════════════════════
    
    print("\n" + "="*70)
    print("🔍 SCENARIO-BASED PREDICTIONS (Optional)")
    print("="*70)
    
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
