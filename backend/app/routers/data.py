import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/data", tags=["data"])

# Load data once at startup
try:
    crop_df = pd.read_csv("data/icrisat_district_data.csv")
except Exception as e:
    print(f"Error loading district crop data: {e}")
    crop_df = pd.DataFrame()

try:
    rain_df = pd.read_csv("data/district_rainfall_normal.csv")
    # Some older python/pandas versions struggle with leading/trailing spaces in CSV headers, clean them up
    rain_df.columns = rain_df.columns.str.strip()
except Exception as e:
    print(f"Error loading district rainfall data: {e}")
    rain_df = pd.DataFrame()

@router.get("/crop-yield")
async def get_crop_yield(crop: str, year: int):
    """
    Get crop yield (Kg per ha) for a given crop and year across all districts.
    """
    if crop_df.empty:
        raise HTTPException(status_code=500, detail="Data not available")
        
    if year not in crop_df['Year'].values:
        raise HTTPException(status_code=400, detail=f"Data for year {year} not available")
        
    # Map friendly crop names to dataset columns
    crop_col_map = {
        "rice": "RICE YIELD (Kg per ha)",
        "wheat": "WHEAT YIELD (Kg per ha)",
        "maize": "MAIZE YIELD (Kg per ha)",
        "cotton": "COTTON YIELD (Kg per ha)",
        "sugarcane": "SUGARCANE YIELD (Kg per ha)",
        "groundnut": "GROUNDNUT YIELD (Kg per ha)",
        "soyabean": "SOYABEAN YIELD (Kg per ha)",
        "sorghum": "SORGHUM YIELD (Kg per ha)",
        "pearl_millet": "PEARL MILLET YIELD (Kg per ha)",
        "chickpea": "CHICKPEA YIELD (Kg per ha)",
        "pigeonpea": "PIGEONPEA YIELD (Kg per ha)",
    }
    
    crop_key = crop.lower()
    if crop_key not in crop_col_map:
        raise HTTPException(status_code=400, detail=f"Crop '{crop}' not supported")
        
    yield_col = crop_col_map[crop_key]
    if yield_col not in crop_df.columns:
        raise HTTPException(status_code=500, detail=f"Column '{yield_col}' not found in dataset")
        
    # Filter by year
    year_df = crop_df[crop_df['Year'] == year]
    
    # Create a dictionary mapping District Name to Yield
    result = {}
    for _, row in year_df.iterrows():
        dist_name = str(row['Dist Name'])
        # Handle NA or missing values which might be represented as -1.0 or NaN
        val = row[yield_col]
        if pd.isna(val) or val < 0:
            continue
            
        result[dist_name] = float(val)
        
    return {
        "crop": crop,
        "year": year,
        "data": result
    }

@router.get("/rainfall")
async def get_rainfall():
    """
    Get annual normal rainfall (mm) across all districts.
    """
    if rain_df.empty:
        raise HTTPException(status_code=500, detail="Rainfall data not available")
        
    result = {}
    for _, row in rain_df.iterrows():
        # The column names typically look like STATE_UT_NAME, DISTRICT, JAN, FEB... ANNUAL
        # Use 'DISTRICT' or 'District' depending on exact case
        dist_col = 'DISTRICT' if 'DISTRICT' in rain_df.columns else 'District'
        annual_col = 'ANNUAL' if 'ANNUAL' in rain_df.columns else 'Annual'
        
        if pd.isna(row.get(dist_col)) or pd.isna(row.get(annual_col)):
            continue
            
        # Clean district string - sometimes they have special chars
        dist_name = str(row[dist_col]).strip()
        # Some are named "XYZ(ABC)" where ABC is an abbreviation. Let's just keep XYZ or the whole thing.
        # It's safest to leave it as-is and fuzzy match on frontend, or just clean slightly.
        # But we'll title case it so it matches nicely.
        dist_name = dist_name.title()

        val = row[annual_col]
        try:
            result[dist_name] = float(val)
        except ValueError:
            continue
            
    return {
        "data": result
    }
