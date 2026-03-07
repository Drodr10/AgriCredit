import pandas as pd
from backend.app.ml.pipeline import RealDataPipeline

def main():
    print("\n--- Initializing Pipeline ---")
    pipe = RealDataPipeline()
    print("Pipeline Loaded Successfully!")
    print("\n--- Fetching Features ---")
    
    district = 'Ludhiana'
    crop = 'rice'
    season = 'kharif'
    
    feats = pipe.get_district_features(district, crop, season)
    print("\n--- FINAL FEATURE DICTIONARY ---")
    for k, v in feats.items():
        print(f"'{k}': {v}")

if __name__ == "__main__":
    main()
