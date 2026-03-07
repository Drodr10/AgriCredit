import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_workflow():
    print("--- Testing AgriCredit Backend Workflow ---")
    
    # 1. Create a Farmer
    farmer_data = {
        "name": "John Doe",
        "national_id": "ID12345",
        "phone": "+123456789",
        "location": "Punjab, India",
        "gps_coordinates": "31.1471, 75.3412",
        "farm_size_hectares": 5.5,
        "primary_crop": "Maize",
        "age": 35,
        "experience_years": 10,
        "irrigation_type": "Drip"
    }
    
    print("\n1. Creating Farmer...")
    res = requests.post(f"{BASE_URL}/farmers/", json=farmer_data)
    if res.status_code != 201:
        print(f"FAILED: {res.text}")
        return
    farmer = res.json()
    farmer_id = farmer["id"]
    print(f"SUCCESS: Created Farmer with ID {farmer_id}")
    
    # 2. Create a Credit Application (triggers AI logic)
    app_data = {
        "farmer_id": farmer_id,
        "crop_type": "Maize",
        "region": "Punjab",
        "season": "Kharif 2026",
        "amount_requested": 5000.0
    }
    
    print("\n2. Creating Credit Application (AI Analysis)...")
    res = requests.post(f"{BASE_URL}/credit-applications/", json=app_data)
    if res.status_code != 201:
        print(f"FAILED: {res.text}")
        return
    application = res.json()
    print(f"SUCCESS: Created Application with AI Risk Analysis:")
    print(f" - Risk Tier: {application.get('risk_tier')}")
    print(f" - Bad Season Prob: {application.get('bad_season_probability')}%")
    print(f" - Suggested Rate: {application.get('suggested_interest_rate')}%")
    print(f" - Scenario ID: {application.get('scenario_id')}")
    print(f" - Reasoning: {application.get('rainfall_forecast')}")

    # 3. List Applications
    print("\n3. Listing all applications...")
    res = requests.get(f"{BASE_URL}/credit-applications/")
    apps = res.json()
    print(f"SUCCESS: Found {len(apps)} applications.")

if __name__ == "__main__":
    # Ensure server is running or wait a bit
    try:
        test_workflow()
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend. Make sure the FastAPI server is running on port 8000.")
