// Sample SPEI (Standardized Precipitation-Evapotranspiration Index) drought data
// per Indian state. Values range from -3 (extreme drought) to +3 (extremely wet).
// Source reference: Zenodo Drought Atlas of India (https://zenodo.org/records/8280551)
// These are representative sample values for demonstration.

export interface DroughtData {
  state: string;
  spei: number;       // SPEI index value
  category: string;   // Human-readable drought category
}

// SPEI value → drought category
export function getDroughtCategory(spei: number): string {
  if (spei <= -2.0) return 'Exceptional Drought';
  if (spei <= -1.5) return 'Extreme Drought';
  if (spei <= -1.0) return 'Severe Drought';
  if (spei <= -0.5) return 'Moderate Drought';
  if (spei <= 0.5) return 'Near Normal';
  if (spei <= 1.0) return 'Moderately Wet';
  if (spei <= 1.5) return 'Severely Wet';
  if (spei <= 2.0) return 'Extremely Wet';
  return 'Exceptionally Wet';
}

// SPEI value → RGBA color [R, G, B, A]
// Red = severe drought, Yellow = moderate, Green = normal, Blue = wet
export function getSpeiColor(spei: number): [number, number, number, number] {
  if (spei <= -2.0) return [115, 0, 0, 200];       // Dark red
  if (spei <= -1.5) return [180, 0, 0, 200];       // Red
  if (spei <= -1.0) return [230, 60, 20, 200];     // Orange-red
  if (spei <= -0.5) return [245, 150, 40, 200];    // Orange
  if (spei <= 0.5) return [120, 190, 80, 200];     // Green (normal)
  if (spei <= 1.0) return [50, 160, 130, 200];     // Teal
  if (spei <= 1.5) return [30, 120, 180, 200];     // Blue
  if (spei <= 2.0) return [20, 70, 160, 200];      // Dark blue
  return [10, 30, 120, 200];                        // Very dark blue
}

// Legend items for the color scale
export const LEGEND_ITEMS = [
  { label: 'Exceptional Drought', color: 'rgb(115, 0, 0)', range: '≤ -2.0' },
  { label: 'Extreme Drought', color: 'rgb(180, 0, 0)', range: '-2.0 to -1.5' },
  { label: 'Severe Drought', color: 'rgb(230, 60, 20)', range: '-1.5 to -1.0' },
  { label: 'Moderate Drought', color: 'rgb(245, 150, 40)', range: '-1.0 to -0.5' },
  { label: 'Near Normal', color: 'rgb(120, 190, 80)', range: '-0.5 to 0.5' },
  { label: 'Moderately Wet', color: 'rgb(50, 160, 130)', range: '0.5 to 1.0' },
  { label: 'Severely Wet', color: 'rgb(30, 120, 180)', range: '1.0 to 1.5' },
  { label: 'Extremely Wet', color: 'rgb(20, 70, 160)', range: '1.5 to 2.0' },
];

// Sample SPEI data per state (simulating a recent monsoon year snapshot)
export const INDIA_DROUGHT_DATA: Record<string, number> = {
  'Andaman and Nicobar': 0.8,
  'Andhra Pradesh': -0.7,
  'Arunachal Pradesh': 0.6,
  'Assam': 0.4,
  'Bihar': -1.2,
  'Chandigarh': -0.3,
  'Chhattisgarh': -0.9,
  'Dadra and Nagar Haveli': -0.1,
  'Daman and Diu': 0.2,
  'Delhi': -0.6,
  'Goa': 0.5,
  'Gujarat': -1.6,
  'Haryana': -0.8,
  'Himachal Pradesh': -0.2,
  'Jammu and Kashmir': -0.4,
  'Jharkhand': -1.1,
  'Karnataka': -1.4,
  'Kerala': 0.9,
  'Lakshadweep': 1.1,
  'Madhya Pradesh': -0.7,
  'Maharashtra': -1.8,
  'Manipur': 0.3,
  'Meghalaya': 0.7,
  'Mizoram': 0.5,
  'Nagaland': 0.2,
  'Orissa': -0.5,
  'Puducherry': -0.3,
  'Punjab': -0.6,
  'Rajasthan': -2.1,
  'Sikkim': 0.4,
  'Tamil Nadu': -1.0,
  'Tripura': 0.1,
  'Uttar Pradesh': -0.9,
  'Uttaranchal': -0.3,
  'West Bengal': -0.4,
};
