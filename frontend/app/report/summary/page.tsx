"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { VoiceReport } from "../../../components/VoiceReport";
import { useVoiceContext } from "../../../components/VoiceProvider";

export default function FarmerSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SummaryContent />
    </Suspense>
  );
}

function SummaryContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useVoiceContext();

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8000/credit-applications/${id}`)
        .then(res => res.json())
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch application:", err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase text-slate-900 mb-4">Report Not Found</h1>
          <Link href="/dashboard" className="text-green-600 font-bold hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isLowRisk = data.risk_tier === "LOW";
  const isHighRisk = data.risk_tier === "HIGH";
  
  const riskColor = isLowRisk ? "text-green-600" : isHighRisk ? "text-red-500" : "text-amber-500";
  const riskBg = isLowRisk ? "bg-green-50" : isHighRisk ? "bg-red-50" : "bg-amber-50";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 text-slate-900">
      <div className="max-w-2xl mx-auto">

        {/* Hero header — untouched */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-1.5 bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6">
            Season Snapshot: {data.season}
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-none">
            This season looks <br />
            <span className={`${riskColor}`}>{data.risk_tier} RISK</span>
          </h1>
        </div>

        {/* Stats row */}
        <div className="bg-white px-6 py-5 rounded border border-gray-200 mb-3 grid grid-cols-2 divide-x divide-gray-100">
          <div className="text-center pr-4">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Bad Season Chance</p>
            <p className="text-2xl font-bold text-gray-900">{data.bad_season_probability}%</p>
          </div>
          <div className="text-center pl-4">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Suggested Terms</p>
            <p className="text-2xl font-bold text-gray-900">
              ${data.amount_requested?.toLocaleString()}
              <span className="text-base font-normal text-gray-400 mx-1">at</span>
              ~{data.suggested_interest_rate}%
            </p>
          </div>
        </div>

        {/* In Simple Terms */}
        <div className="bg-white rounded border border-gray-200 mb-3">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">In Simple Terms</h2>
          </div>
          
          <VoiceReport 
             mlData={{ risktier: data.risk_tier, pd_1year: data.bad_season_probability / 100 }} 
             lang={lang} 
          />
          
          <div className="divide-y divide-gray-100">
            <div className="flex items-start gap-4 px-6 py-4">
              <div className="flex-shrink-0 w-9 h-9 bg-blue-50 rounded flex items-center justify-center text-lg">🌧️</div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Rainfall Forecast</p>
                <p className="text-sm text-gray-700 leading-relaxed">{data.rainfall_forecast || "Rainfall levels are expected to be optimal for cultivation."}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 px-6 py-4">
              <div className="flex-shrink-0 w-9 h-9 bg-amber-50 rounded flex items-center justify-center text-lg">🌾</div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Yield Outlook</p>
                <p className="text-sm text-gray-700 leading-relaxed">{data.yield_stability || "Historical productivity suggests very stable crop development."}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 px-6 py-4">
              <div className="flex-shrink-0 w-9 h-9 bg-emerald-50 rounded flex items-center justify-center text-lg">📈</div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Market Sentiment</p>
                <p className="text-sm text-gray-700 leading-relaxed">{data.price_volatility || "Price volatility is low, indicating a reliable market return."}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link 
            href="/dashboard"
            className="py-2.5 rounded border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors text-center"
          >
            Back to Dashboard
          </Link>
          <Link 
            href={`/report/analysis?id=${id}`}
            className="py-2.5 rounded bg-green-800 text-sm font-medium text-white hover:bg-green-700 transition-colors text-center"
          >
            Full Lender Report
          </Link>
        </div>
        
        <p className="text-center text-xs text-gray-300">
          AgriCredit AI Summary
        </p>
      </div>
    </div>
  );
}
