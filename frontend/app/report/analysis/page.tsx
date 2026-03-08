"use client";

import React from "react";
import Link from "next/link";

// Mock data representing what the AI model would output
const REPORT_DATA = {
  scenarioId: "SC-2026-7834",
  crop: "Maize",
  region: "Punjab",
  season: "Kharif 2026",
  riskSummary: {
    tier: "LOW",
    badSeasonChance: "18%",
    suggestedRate: "8.0%",
    expectedLoss: "$400",
    basis: "For $5,000 loan",
  },
  riskDrivers: [
    { label: "Rainfall anomaly", value: 15 },
    { label: "Yield variability", value: 22 },
    { label: "Price volatility", value: 28 },
    { label: "Extreme events", value: 12 },
  ],
  reasoning: [
    "Rainfall forecast within normal range.",
    "Historical yield variability is low.",
    "Price volatility is moderate and trending stable.",
    "Model confidence: high.",
  ],
  metrics: {
    baselineError: 24,
    modelError: 15,
    improvement: "38% lower error than baseline",
  },
};

export default function AnalysisReport() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 md:p-12 font-sans selection:bg-green-500/30 report-page">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Action Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6 screen-only">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-600/20">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                </svg>
             </div>
             <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Agricredit <span className="text-green-600">Analysis</span></h1>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export PDF
            </button>
            <button className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
              Save Scenario
            </button>
          </div>
        </header>

        {/* Report Content Wrapper */}
        <div id="report-content" className="space-y-8 report-content">
          
          {/* Main Title Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight pdf-text-black">
                Lender report – <span className="text-green-600 pdf-text-green">{REPORT_DATA.crop}</span>, {REPORT_DATA.region}, {REPORT_DATA.season}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-[0.2em] pdf-scenario-tag">
                Scenario ID: {REPORT_DATA.scenarioId}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print-grid">
            
            {/* Left Column */}
            <div className="space-y-8 print-space-y">
              
              {/* Risk Summary Card */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 pdf-card">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 pdf-label">Risk summary</h3>
                <div className="grid grid-cols-2 gap-y-10 gap-x-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pdf-sublabel">Risk tier</p>
                    <p className={`text-3xl font-black ${REPORT_DATA.riskSummary.tier === 'LOW' ? 'text-green-600 pdf-text-green' : 'text-amber-600 pdf-text-amber'}`}>
                      {REPORT_DATA.riskSummary.tier}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pdf-sublabel">Chance of bad season</p>
                    <p className="text-3xl font-black text-slate-900 pdf-text-black">{REPORT_DATA.riskSummary.badSeasonChance}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pdf-sublabel">Suggested rate</p>
                    <p className="text-3xl font-black text-slate-900 pdf-text-black">{REPORT_DATA.riskSummary.suggestedRate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest pdf-sublabel">Expected loss</p>
                    <p className="text-3xl font-black text-slate-900 pdf-text-black">{REPORT_DATA.riskSummary.expectedLoss}</p>
                  </div>
                </div>
                <div className="mt-10 pt-6 border-t border-slate-100 pdf-footer">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pdf-sublabel">{REPORT_DATA.riskSummary.basis}</p>
                </div>
              </section>

              {/* Reasoning Card */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 pdf-card">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 pdf-label">Reasoning</h3>
                <ul className="space-y-5">
                  {REPORT_DATA.reasoning.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mt-1.5 mr-4 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 shadow-lg shadow-green-500/50" />
                      <span className="text-slate-600 font-medium leading-relaxed text-sm pdf-body-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-8 print-space-y">
              
              {/* Risk Drivers Card */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 flex flex-col pdf-card">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pdf-label">Risk drivers</h3>
                
                <div className="flex items-end justify-between gap-6 px-4 py-4 h-[160px] min-h-[160px]">
                  {REPORT_DATA.riskDrivers.map((driver, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                      <div className="w-full flex-grow flex items-end relative">
                        <div 
                          className="w-full bg-green-500 rounded-t-xl shadow-lg shadow-green-500/10 min-h-[5%] pdf-bar"
                          style={{ height: `${driver.value * 3}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-tighter w-full block pdf-sublabel">
                        {driver.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 pdf-footer">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest pdf-sublabel">
                    Risk factor contribution • Lower is better
                  </p>
                </div>
              </section>

              {/* Model Performance Comparison */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 pdf-card">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 pdf-label">Model Performance</h3>
                
                <div className="space-y-10">
                  <div>
                    <div className="flex justify-between mb-3">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pdf-sublabel">Baseline error</span>
                       <span className="text-xs font-black text-slate-900 pdf-text-black">{REPORT_DATA.metrics.baselineError}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 border border-slate-200 rounded-full overflow-hidden pdf-bg-dark">
                       <div 
                         className="h-full bg-slate-400 pdf-bar-baseline" 
                         style={{ width: `${REPORT_DATA.metrics.baselineError}%` }}
                       />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                       <span className="text-[10px] font-black text-green-600 uppercase tracking-widest pdf-sublabel">Agricredit accuracy</span>
                       <span className="text-xs font-black text-green-600 pdf-text-green-bright">{REPORT_DATA.metrics.modelError}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 border border-slate-200 rounded-full overflow-hidden pdf-bg-dark">
                       <div 
                         className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)] pdf-bar-model" 
                         style={{ width: `${REPORT_DATA.metrics.modelError}%` }}
                       />
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic pdf-sublabel">
                    {REPORT_DATA.metrics.improvement}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* PDF specific overrides - strictly gated by @media print */
        @media print {
          @page {
            margin: 1cm;
          }
          .report-page {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
          }
          .screen-only {
            display: none !important;
          }
          .pdf-card {
            background-color: #f8fafc !important;
            border-color: #e2e8f0 !important;
            box-shadow: none !important;
            border-radius: 1.5rem !important;
          }
          .pdf-label { color: #64748b !important; }
          .pdf-sublabel { color: #94a3b8 !important; }
          .pdf-text-black { color: #0f172a !important; }
          .pdf-text-green { color: #166534 !important; }
          .pdf-text-green-bright { color: #16a34a !important; }
          .pdf-text-amber { color: #d97706 !important; }
          .pdf-body-text { color: #334155 !important; }
          .pdf-scenario-tag {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
            color: #475569 !important;
          }
          .pdf-bg-dark {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
          }
          .pdf-bar { background-color: #16a34a !important; }
          .pdf-bar-baseline { background-color: #475569 !important; }
          .pdf-bar-model { background-color: #16a34a !important; }
          .pdf-footer { border-color: #e2e8f0 !important; }
          
          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </main>
  );
}
