'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface RocSeries {
  fpr: number[];
  tpr: number[];
}

interface RocData {
  winner_name: string;
  baseline_name: string;
  winner: RocSeries;
  baseline: RocSeries;
}

interface RocPoint {
  fpr: number;
  winner: number;
  baselineModel: number;
  random: number;
}

export function ROCCurveChart() {
  const [data, setData] = useState<RocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/graphs/roc_curves.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load ROC data:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading ROC curves...</div>
      </div>
    );
  }

  const interpolateTPR = (series: RocSeries, targetFpr: number): number => {
    const { fpr, tpr } = series;
    if (fpr.length === 0 || tpr.length === 0) return targetFpr;
    if (targetFpr <= fpr[0]) return tpr[0];
    if (targetFpr >= fpr[fpr.length - 1]) return tpr[tpr.length - 1];

    for (let i = 1; i < fpr.length; i += 1) {
      if (targetFpr <= fpr[i]) {
        const x0 = fpr[i - 1];
        const x1 = fpr[i];
        const y0 = tpr[i - 1];
        const y1 = tpr[i];
        const ratio = (targetFpr - x0) / (x1 - x0 || 1);
        return y0 + (y1 - y0) * ratio;
      }
    }
    return targetFpr;
  };

  const fprGrid = Array.from(
    new Set([...data.winner.fpr, ...data.baseline.fpr, 0, 1])
  ).sort((a, b) => a - b);

  const chartData: RocPoint[] = fprGrid.map((fpr) => ({
    fpr,
    winner: interpolateTPR(data.winner, fpr),
    baselineModel: interpolateTPR(data.baseline, fpr),
    random: fpr,
  }));

  return (
    <div className="w-full h-full pb-3 pointer-events-none select-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 16 }}
        >
          <CartesianGrid strokeDasharray="1 0" stroke="#d8dee8" />
          <XAxis 
            dataKey="fpr"
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: '#4a5f80' }}
            tickLine={false}
            stroke="#c9d3e1"
            label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -8, style: { fontSize: 11, fill: '#4a5f80', fontWeight: 600 } }}
          />
          <YAxis 
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: '#4a5f80' }}
            tickLine={false}
            stroke="#c9d3e1"
            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#4a5f80', fontWeight: 600, textAnchor: 'middle' } }}
          />
          <Line
            type="monotone"
            dataKey="random"
            stroke="#1f1f1f"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="baselineModel"
            stroke="#8b8b8b"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="winner"
            stroke="#f2cc00"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
