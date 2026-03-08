export interface AnalysisRequest {
  season: string;
  crop: string;
  loan_amount: number;
}

export interface FeatureImportance {
  name: string;
  weight: number;
  value: string;
}

export interface ModelComparison {
  baseline_auc: number;
  enhanced_auc: number;
}

export interface AnalysisResponse {
  pd: number;
  risk_tier: string;
  expected_loss: number;
  baseline_pd: number;
  farmer_summary: string[];
  feature_importance: FeatureImportance[];
  model_comparison: ModelComparison;
}

export async function analyzeFarm(farmId: string, request: AnalysisRequest): Promise<AnalysisResponse> {
  const res = await fetch(`${process.env.BACKEND_URL}/ml/analyze/${farmId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!res.ok) throw new Error('Analysis failed');
  return res.json();
}
