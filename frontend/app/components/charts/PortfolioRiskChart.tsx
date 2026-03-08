'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface ModelMetrics {
  auc: number;
  train_auc: number;
  overfit_gap: number;
  cv_avg: number;
}

interface BenchmarkData {
  winner: string;
  winner_auc: number;
  improvement_pct: number;
  full_results: Record<string, ModelMetrics>;
}

export function PortfolioRiskChart() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/graphs/benchmark_summary.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load benchmark data:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading overfit analysis...</div>
      </div>
    );
  }

  // Show overfit gap (lower absolute value is better)
  const chartData = Object.entries(data.full_results).map(([name, metrics]) => ({
    name: name.replace(' (Banks)', '').substring(0, 12),
    gap: parseFloat(metrics.overfit_gap.toFixed(3)),
    isWinner: name === data.winner
  }));

  // Keep model order as benchmark image.

  return (
    <div className="w-full h-full pb-3 pointer-events-none select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="1 0" stroke="#d8dee8" />
          <XAxis 
            dataKey="name"
            angle={-25}
            textAnchor="end"
            height={68}
            tick={{ fontSize: 10, fill: '#4a5f80' }}
            tickLine={false}
            stroke="#c9d3e1"
            label={{ value: 'Model', position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: '#4a5f80', fontWeight: 600 } }}
          />
          <YAxis 
            domain={[-0.042, -0.003]}
            tickCount={6}
            tick={{ fontSize: 10, fill: '#4a5f80' }}
            tickLine={false}
            stroke="#c9d3e1"
            label={{ value: 'Overfit Gap', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#4a5f80', fontWeight: 600, textAnchor: 'middle' } }}
          />
          <Bar 
            dataKey="gap" 
            radius={[0, 0, 0, 0]}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`gap-${index}`} fill={entry.isWinner ? '#f2cc00' : '#8b8b8b'} />
            ))}
            <LabelList dataKey="gap" position="bottom" formatter={(v: unknown) => Number(v).toFixed(3)} style={{ fill: '#4a5f80', fontSize: 10 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
