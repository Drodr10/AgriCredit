import pandas as pd
import numpy as np
from typing import Dict, Any
from pathlib import Path

class RealDataPipeline:
    def __init__(self, data_dir: str = 'backend/data'):
        self.data_dir = Path(data_dir)
        self.yields: pd.DataFrame = pd.DataFrame()
        self.weather: Dict[str, float] = {}
        self.prices: Dict[str, float] = {}
        self._load_all()

    def _load_all(self):
        # ICRISAT robust
        icrisat_path = self.data_dir / 'icrisat_district_data.csv'
        if icrisat_path.exists():
            icrisat = pd.read_csv(icrisat_path)
            # Clean quoted cols if needed
            icrisat.columns = [col.strip('"') for col in icrisat.columns]
            punjab = icrisat[icrisat['State Name'].str.contains('Punjab', na=False)]
            ludhiana = icrisat[icrisat['Dist Name'].str.contains('Ludhiana', na=False)]
            if not punjab.empty:
                recent = punjab[['Year', 'RICE YIELD (Kg per ha)', 'WHEAT YIELD (Kg per ha)']].tail(5).copy()
            elif not ludhiana.empty:
                recent = ludhiana[['Year', 'RICE YIELD (Kg per ha)', 'WHEAT YIELD (Kg per ha)']].tail(5).copy()
            else:
                recent = icrisat[['Year', 'RICE YIELD (Kg per ha)', 'WHEAT YIELD (Kg per ha)']].tail(5).copy()  # Fallback
            recent['RICE YIELD (tha)'] = pd.to_numeric(recent['RICE YIELD (Kg per ha)'], errors='coerce') / 1000
            recent['WHEAT YIELD (tha)'] = pd.to_numeric(recent['WHEAT YIELD (Kg per ha)'], errors='coerce') / 1000
            self.yields = recent.dropna(subset=['RICE YIELD (tha)'])
        else:
            # Fallback dummy data
            self.yields = pd.DataFrame({
                'Year': [2018, 2019, 2020, 2021, 2022],
                'RICE YIELD (tha)': [4.2, 4.0, 3.8, 4.1, 4.5],
                'WHEAT YIELD (tha)': [3.9, 4.1, 4.2, 4.0, 3.8]
            })

        # NASA Ludhiana - PERFECT skiprows=12
        nasa_path = self.data_dir / 'nasa_power_ludhiana.csv'
        if nasa_path.exists():
            nasa = pd.read_csv(nasa_path, skiprows=12, header=0)
            print('NASA loaded:', nasa.shape, nasa.columns.tolist())  # Debug: (2190,6) ['YEAR','DOY',...]
            nasa['DATE'] = pd.to_datetime(nasa['YEAR'].astype(str) + '-' + nasa['DOY'].astype(str), format='%Y-%j')
            kharif_mask = nasa['DOY'].between(183, 273)  # Jul-Oct
            if kharif_mask.sum() == 0:
                kharif_mask = nasa['DOY'] >= 183  # Fallback if short file
            kharif_rain = nasa.loc[kharif_mask, 'PRECTOTCORR'].mean()
            kharif_temp = nasa.loc[kharif_mask, 'T2M'].mean()
            self.weather = {
                'rainfallpctnormal': max(50, min(150, (kharif_rain / 5.0) * 100)) if pd.notna(kharif_rain) else 100.0,  # Clamp realistic
                'tempanomaly': round(kharif_temp - 28.0, 2) if pd.notna(kharif_temp) else 0.0,
                'humiditypct': round(nasa['RH2M'].mean(), 1)
            }
        else:
            # Dummy fallback if file missing
            self.weather = {
                'rainfallpctnormal': 100.0,
                'tempanomaly': 0.0,
                'humiditypct': 60.0
            }

        # Mandi prices volatility (filter rice/wheat Punjab if avail)
        mandi_path = self.data_dir / 'mandi_prices.csv'
        if mandi_path.exists():
            mandi = pd.read_csv(mandi_path)
            rice_wheat = mandi[mandi['Commodity'].str.contains('rice|wheat', case=False, na=False)].copy()
            if not rice_wheat.empty:
                rice_wheat['volatility_pct'] = (rice_wheat['Max_x0020_Price'] - rice_wheat['Min_x0020_Price']) / rice_wheat['Modal_x0020_Price'] * 100
                self.prices = {'pricevolatilitypct': rice_wheat['volatility_pct'].mean()}
            else:
                self.prices = {'pricevolatilitypct': 15.0}  # Fallback
        else:
            self.prices = {'pricevolatilitypct': 15.0}  # Fallback dummy data

        # FAOSTAT Robust National Fallback (Rice & Wheat)
        faostat_path = self.data_dir / 'faostat_india.csv'
        if faostat_path.exists() and self.yields is not None:
            try:
                faostat = pd.read_csv(faostat_path)
                # Elements: 'Area harvested' (5312), 'Yield' (5412), 'Production' (5510)
                # Items: 'Rice', 'Wheat'
                
                for crop_name, target_col in [('Rice', 'RICE YIELD (tha)'), ('Wheat', 'WHEAT YIELD (tha)')]:
                    crop_data = faostat[(faostat['Element'] == 'Yield') & 
                                        (faostat['Item'].str.contains(crop_name, case=False, na=False))]
                    
                    if not crop_data.empty:
                        # FAOSTAT is kg/ha -> convert to t/ha
                        crop_data = crop_data[['Year', 'Value']].copy()
                        crop_data['Value'] = pd.to_numeric(crop_data['Value'], errors='coerce') / 1000
                        
                        # Merge onto existing yields where district data is missing/NaN
                        # We align by Year
                        self.yields = self.yields.merge(
                            crop_data.rename(columns={'Value': f'FAO_{crop_name}'}), 
                            on='Year', how='left'
                        )
                        # Fill NaNs in target_col with FAO values
                        self.yields[target_col] = self.yields[target_col].fillna(self.yields[f'FAO_{crop_name}'])
                        self.yields.drop(columns=[f'FAO_{crop_name}'], inplace=True)
                
                print(f'✅ FAOSTAT fallback integrated: {self.yields.columns.tolist()}')
            except Exception as e:
                print(f'⚠️ FAOSTAT fallback failed: {e}')

    def get_district_features(self, district: str, crop: str, season: str) -> Dict[str, float]:
        """Core: yieldavg/vol, speidrought proxy (low rain), pricevol, rainfallpct."""
        if district != 'Ludhiana' or crop not in ['rice', 'wheat'] or season not in ['kharif', 'rabi']:
            raise ValueError("Demo: Ludhiana rice/wheat only.")

        crop_col = f"{crop.upper()} YIELD (tha)" if crop == 'rice' else f"{crop.upper()} YIELD (tha)"
        yield_data = self.yields[crop_col].dropna()
        features = {
            'yieldavg': yield_data.mean(),
            'yieldvolatility': yield_data.std(),
            'speidrought': -0.8 if self.weather['rainfallpctnormal'] < 95 else 0.2,  # Proxy: low rain = drought
            'pricevolatility': self.prices['pricevolatilitypct'],
            'rainfallpct': self.weather['rainfallpctnormal'],
            'tempanomaly': self.weather['tempanomaly']
        }
        return features

# Test/Usage
if __name__ == "__main__":
    pipe = RealDataPipeline()
    feats = pipe.get_district_features('Ludhiana', 'rice', 'kharif')
    print("Real Features:", feats)
    # Feed to model.py: AgricreditModel().predict_risk({'features': feats, 'loanamount': 50000})
