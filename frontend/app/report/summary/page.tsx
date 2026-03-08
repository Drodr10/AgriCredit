"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-slate-50 py-12 px-6 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 italic">
            Season Snapshot: {data.season}
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
            This season looks <br />
            <span className={`${riskColor} italic`}>{data.risk_tier} RISK</span>
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-12 bg-white px-8 py-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="text-center">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bad Season Chance</span>
              <span className="text-3xl font-black text-slate-900">{data.bad_season_probability}%</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-100"></div>
            <div className="text-center">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Suggested Terms</span>
              <span className="text-3xl font-black text-slate-900">
                ${data.amount_requested.toLocaleString()} 
                <span className="text-xl font-bold text-slate-400 mx-1">at</span> 
                ~{data.suggested_interest_rate}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 mb-12 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 ${riskBg} -translate-y-16 translate-x-16 rounded-full opacity-50`}></div>
          
          <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859 1.515-1.204 1.515-3.078 0-4.282A2.3 2.3 0 0010 8.3c-1.27 0-2.3 1.03-2.3 2.3 0 .894.521 1.666 1.258 2.04.284.143.46.425.474.74h1.136l-.568-1.136z" />
            </svg>
            In simple terms:
          </h2>
          
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-blue-500/10">
                🌧️
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Our Rainfall Forecast</span>
                <p className="font-bold text-slate-800">{data.rainfall_forecast || "Rainfall levels are expected to be optimal for cultivation."}</p>
              </div>
            </li>
            
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-amber-500/10">
                🌾
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yield Outlook</span>
                <p className="font-bold text-slate-800">{data.yield_stability || "Historical productivity suggests very stable crop development."}</p>
              </div>
            </li>
            
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-emerald-500/10">
                📈
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Sentiment</span>
                <p className="font-bold text-slate-800">{data.price_volatility || "Price volatility is low, indicating a reliable market return."}</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/dashboard"
            className="w-full py-5 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-900 hover:border-slate-900 transition-all text-center shadow-lg shadow-slate-200/50"
          >
            Back to Dashboard
          </Link>
          <Link 
            href={`/report/analysis?id=${id}`}
            className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest hover:bg-green-600 transition-all text-center shadow-xl shadow-slate-900/20"
          >
            Full Lender Report
          </Link>
        </div>
        
        <p className="text-center mt-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
          <span className="w-8 h-px bg-slate-100"></span>
          AgriCredit AI Summary
          <span className="w-8 h-px bg-slate-100"></span>
        </p>
      </div>
    </div>
  );
}
