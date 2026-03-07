import React from 'react';

export default async function FarmReportPage({ params }: { params: { farmId: string } }) {
  // In a real app, you would fetch data here
  // const request = { season: 'kharif', crop: 'rice', loan_amount: 50000 };
  // const result = await analyzeFarm(params.farmId, request);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Risk Report for Farm: {params.farmId}</h1>
      <p className="text-slate-500">ML features disabled.</p>
    </div>
  );
}
