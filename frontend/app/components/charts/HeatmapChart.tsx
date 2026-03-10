'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface ModelMetrics {
  auc: number;
  gen_auc: number;
  train_auc: number;
  overfit_gap: number;
  cv_avg: number;
}

interface BenchmarkData {
  winner: string;
  winner_auc: number;
  second_best: string;
  improvement_pct: number;
  full_results: Record<string, ModelMetrics>;
}

export function HeatmapChart() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        setError('Data load timeout');
        setLoading(false);
      }
    }, 5000);

    fetch('/graphs/benchmark_summary.json', { cache: 'no-store' })
      .then(res => {
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (isMounted) {
          setData(json);
          setLoading(false);
          setError(null);
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        if (isMounted) {
          console.error('Failed to load benchmark data:', err);
          setError(`Failed to load: ${err.message}`);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []); // Empty dependency array - run once on mount

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading model comparison...</div>
      </div>
    );
  }

  // Prepare chart data - using Generalization AUC as primary metric
  const chartData = Object.entries(data.full_results).map(([name, metrics]) => ({
    name: name,
    auc: parseFloat(metrics.gen_auc.toFixed(3)),
    isWinner: name === data.winner
  }));

  // Sort by AUC descending
  chartData.sort((a, b) => b.auc - a.auc);

  return (
    <div className="w-full h-full pb-3 pointer-events-none select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
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
            domain={[0.79, 0.97]}
            tickCount={6}
            tick={{ fontSize: 10, fill: '#4a5f80' }}
            tickLine={false}
            stroke="#c9d3e1"
            label={{ value: 'Generalization AUC', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#4a5f80', fontWeight: 600, textAnchor: 'middle' } }}
          />
          <Bar dataKey="auc" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isWinner ? '#f2cc00' : '#8b8b8b'} 
              />
            ))}
            <LabelList dataKey="auc" position="top" formatter={(v: unknown) => Number(v).toFixed(3)} style={{ fill: '#4a5f80', fontSize: 10 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
