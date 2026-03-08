'use client';

import React, { useEffect, useState } from 'react';

interface BenchmarkData {
  winner: string;
  winner_auc: number;
  full_results: Record<string, unknown>;
}

export function ConfusionMatrixChart() {
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
        <div className="animate-pulse text-gray-400">Loading confusion matrix...</div>
      </div>
    );
  }

  // Fixed production confusion matrix values from benchmark figure.
  const matrix = [
    [24, 576],
    [530, 70]
  ];

  const getColorIntensity = (value: number) => {
    const max = Math.max(...matrix.flat());
    const intensity = value / max;
    return `rgba(16, 59, 122, ${0.18 + intensity * 0.78})`;
  };

  return (
    <div className="w-full h-full min-h-[250px] p-2 pb-4 pointer-events-none select-none">
      <div className="w-full h-full max-w-[520px] mx-auto grid grid-cols-[minmax(110px,1.1fr)_repeat(2,minmax(0,1fr))] grid-rows-[36px_repeat(2,minmax(0,1fr))] gap-0.5">
        {/* Top-left spacer */}
        <div />

        {/* Column headers */}
        <div className="flex items-center justify-center text-[12px] font-semibold text-[#4a5f80]">
          Healthy
        </div>
        <div className="flex items-center justify-center text-[12px] font-semibold text-[#4a5f80]">
          High Risk
        </div>

        {/* Row 1 */}
        <div className="flex items-center justify-start pr-2 text-[12px] font-semibold text-[#4a5f80] leading-tight">
          Actual High Risk
        </div>
        <div
          className="flex items-center justify-center"
          style={{ backgroundColor: getColorIntensity(matrix[0][0]) }}
        >
          <div className="text-[20px] sm:text-[22px] font-semibold text-[#4a5f80]">{matrix[0][0]}</div>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ backgroundColor: getColorIntensity(matrix[0][1]) }}
        >
          <div className="text-[20px] sm:text-[22px] font-semibold text-white">{matrix[0][1]}</div>
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-start pr-2 text-[12px] font-semibold text-[#4a5f80] leading-tight">
          Actual Healthy
        </div>
        <div
          className="flex items-center justify-center"
          style={{ backgroundColor: getColorIntensity(matrix[1][0]) }}
        >
          <div className="text-[20px] sm:text-[22px] font-semibold text-white">{matrix[1][0]}</div>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ backgroundColor: getColorIntensity(matrix[1][1]) }}
        >
          <div className="text-[20px] sm:text-[22px] font-semibold text-[#4a5f80]">{matrix[1][1]}</div>
        </div>
      </div>
    </div>
  );
}
