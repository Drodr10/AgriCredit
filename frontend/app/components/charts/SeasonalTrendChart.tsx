'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface ModelMetrics {
  auc: number;
  gen_auc: number;
  train_auc: number;
  overfit_gap: number;
  precision?: number;
  recall?: number;
  f1?: number;
  cv_avg: number;
}

interface BenchmarkData {
  winner: string;
  full_results: Record<string, ModelMetrics>;
}

export function SeasonalTrendChart() {
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
        <div className="animate-pulse text-gray-400">Loading performance curves...</div>
      </div>
    );
  }

  // Create ROC-like visualization showing Train vs Test AUC
  const chartData = Object.entries(data.full_results).map(([name, metrics]) => ({
    name: name.replace(' (Banks)', '').substring(0, 12),
    train: parseFloat((metrics.train_auc * 100).toFixed(1)),
    test: parseFloat((metrics.auc * 100).toFixed(1)),
    gen: parseFloat((metrics.gen_auc * 100).toFixed(1))
  }));

  // Sort by generalization AUC
  chartData.sort((a, b) => b.gen - a.gen);

  return (
    <div className="w-full h-full flex flex-col p-2 pointer-events-none select-none">
      <div className="text-center mb-3">
        <h4 className="text-xs font-bold text-gray-800">Performance Stability</h4>
        <p className="text-[10px] text-gray-500 mt-1">
          Train vs Test vs Generalization
        </p>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name"
            angle={-15}
            textAnchor="end"
            height={50}
            tick={{ fontSize: 9 }}
            stroke="#666"
          />
          <YAxis 
            domain={[75, 100]}
            tick={{ fontSize: 9 }}
            stroke="#666"
            label={{ value: 'AUC %', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }}
          />
          <Line
            type="monotone"
            dataKey="train"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Train"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="test"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Test"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="gen"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4 }}
            name="Generalization"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
