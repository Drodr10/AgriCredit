import React from 'react';
import { analyzeFarm } from '../../lib/ml';
import { RiskBadge } from '../components/ml/RiskBadge';
import { FeatureBars } from '../components/ml/FeatureBars';
import { FarmerBullets } from '../components/ml/FarmerBullets';
import { ModelComparison } from '../components/ml/ModelComparison';

export default async function FarmReportPage({ params }: { params: { farmId: string } }) {
  const request = {
    season: 'kharif',
    crop: 'rice',
    loan_amount: 50000
  };
  
  const result = await analyzeFarm(params.farmId, request);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Risk Report for Farm: {params.farmId}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Risk Profile</h2>
          <RiskBadge risk={result.risk_tier} pd={result.pd} expectedLoss={result.expected_loss} />
        </div>
        
        <div className="border p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">AI Recommendations</h2>
          <FarmerBullets points={result.farmer_summary} />
        </div>
      </div>
      
      <div className="border p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Feature Importance</h2>
        <FeatureBars features={result.feature_importance} />
      </div>
      
      <div className="border p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Model Performance Overview</h2>
        <ModelComparison comparison={result.model_comparison} />
      </div>
    </div>
  );
}
