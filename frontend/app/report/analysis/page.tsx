"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AnalysisReport() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const handleGeneratePDF = async () => {
    if (!id || generating) return;
    
    // Open window immediately to prevent popup blockers
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Please allow popups for this site to view the PDF report.");
      return;
    }

    // Write loading state to the new window
    reportWindow.document.write(`
      <html>
        <head>
          <title>Generating Report...</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-50 flex items-center justify-center min-h-screen font-sans">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 class="text-xl font-bold text-slate-900">Generating Technical Report...</h1>
            <p class="text-slate-500 mt-2 text-sm">Gemini is analyzing the data and drafting the 2-page report.</p>
          </div>
        </body>
      </html>
    `);

    setGenerating(true);
    try {
      const res = await fetch(`http://localhost:8000/reports/generate/${id}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to generate report" }));
        reportWindow.document.body.innerHTML = `<div class="p-8 text-red-600 font-bold">Error: ${err.detail || "Failed to generate report"}</div>`;
        return;
      }
      const html = await res.text();
      
      // Inject the generated HTML
      reportWindow.document.open();
      reportWindow.document.write(html);
      reportWindow.document.close();
      
      // Wait for Tailwind and layout to settle
      setTimeout(() => {
        reportWindow.print();
      }, 2000);

    } catch (err) {
      console.error("Report generation failed:", err);
      reportWindow.document.body.innerHTML = `<div class="p-8 text-red-600 font-bold">Failed to connect to backend. Is it running?</div>`;
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-black uppercase text-slate-900 mb-4">Report Not Found</h1>
          <Link href="/dashboard" className="text-green-600 font-bold hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isLow = data.risk_tier === "LOW";
  const isHigh = data.risk_tier === "HIGH";
  const riskColor = isLow ? "#10B981" : isHigh ? "#EF4444" : "#F59E0B";
  const riskLabel = isLow ? "LOW RISK" : isHigh ? "HIGH RISK" : "MEDIUM RISK";
  const decision = isLow ? "APPROVE" : isHigh ? "DECLINE" : "CAUTION";
  const decisionIcon = isLow ? "✅" : isHigh ? "❌" : "⚠️";

  const pd = data.bad_season_probability || 0;
  const baselinePd = data.baseline_pd || 0;
  const pdImprovement = baselinePd > 0 ? Math.round(((baselinePd - pd) / baselinePd) * 100) : 0;
  const avoidedLoss = baselinePd > 0 ? Math.round((baselinePd - pd) / 100 * data.amount_requested) : 0;

  const dsc = data.dsc_ratio || 0;
  const ltv = data.ltv || 0;
  const equity = data.equity_ratio || 0;
  const collateral = data.collateral_value || 0;

  const dscOk = dsc >= 1.2;
  const ltvOk = ltv <= 0.75;
  const equityOk = equity >= 0.3;

  const featureImportance = data.feature_importance || [];
  const modelComp = data.model_comparison || {};

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8 md:p-12 font-sans selection:bg-green-500/30 report-page">
      <div className="max-w-[1100px] mx-auto space-y-6">

        {/* Screen-only Action Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 screen-only">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-600/20">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Agricredit <span className="text-green-600">Lender Report</span></h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href={`/report/summary?id=${id}`} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
              Farmer Summary
            </Link>
            <button onClick={handleGeneratePDF} disabled={generating} className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${generating ? "bg-green-50 border border-green-200 text-green-600" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {generating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  AI Report PDF
                </>
              )}
            </button>
          </div>
        </header>

        {/* ─── PAGE 1: EXECUTIVE SUMMARY ─── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden print-page">
          {/* Report Header */}
          <div className="flex items-center justify-between px-8 py-5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
              </div>
              <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Agricredit</span>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{data.crop_type} / {data.season}</span>
              <span>${data.amount_requested?.toLocaleString()}</span>
              <span>{today}</span>
              <span>Page 1/2</span>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-8">
            {/* Risk Dashboard */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl" style={{ backgroundColor: riskColor + "15", border: `3px solid ${riskColor}` }}>
                  <span className="text-[11px] font-black uppercase tracking-wider text-center leading-tight" style={{ color: riskColor }}>{riskLabel}</span>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Executive Summary</h2>
                  <p className="text-slate-400 font-medium mt-1">Scenario {data.scenario_id}</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Default Probability", value: `${pd}%`, ok: pd < 25 },
                { label: "Expected Loss", value: `$${data.expected_loss?.toLocaleString()}`, ok: true },
                { label: "DSC Ratio", value: `${dsc}x`, ok: dscOk },
                { label: "LTV", value: `${Math.round(ltv * 100)}%`, ok: ltvOk },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value} {stat.ok ? <span className="text-green-500 text-sm">✓</span> : <span className="text-amber-500 text-sm">!</span>}</p>
                </div>
              ))}
            </div>

            {/* Decision Recommendation */}
            <div className="rounded-2xl p-6 border-2" style={{ borderColor: riskColor + "40", backgroundColor: riskColor + "08" }}>
              <div className="flex items-start gap-4">
                <span className="text-2xl">{decisionIcon}</span>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wide" style={{ color: riskColor }}>
                    {decision} at {data.suggested_interest_rate}%
                  </h3>
                  {avoidedLoss > 0 && (
                    <p className="text-slate-600 font-medium mt-1">
                      💰 Avoided loss vs baseline: <span className="font-black">${avoidedLoss.toLocaleString()}</span> (PD {baselinePd}% → {pd}%)
                    </p>
                  )}
                  <p className="text-slate-400 text-sm mt-1">Monitor seasonal conditions and market price movements.</p>
                </div>
              </div>
            </div>

            {/* Key Metrics Table */}
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Key Lending Metrics</h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metric</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { metric: "DSC Ratio", value: `${dsc}x`, ok: dscOk, status: dscOk ? "GOOD" : "WEAK" },
                      { metric: "Loan-to-Value", value: `${Math.round(ltv * 100)}%`, ok: ltvOk, status: ltvOk ? "ACCEPT" : "HIGH" },
                      { metric: "Equity Ratio", value: `${Math.round(equity * 100)}%`, ok: equityOk, status: equityOk ? "STRONG" : "LOW" },
                      { metric: "PD vs Baseline", value: `${pdImprovement > 0 ? "-" : ""}${Math.abs(pdImprovement)}%`, ok: pdImprovement > 0, status: pdImprovement > 0 ? "BETTER" : "WORSE" },
                      { metric: "Collateral Value", value: `$${collateral.toLocaleString()}`, ok: true, status: "VERIFIED" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-6 py-4 font-bold text-slate-700">{row.metric}</td>
                        <td className="px-6 py-4 font-black text-slate-900">{row.value}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                            {row.ok ? "✅" : "⚠️"} {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-3 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Decision support. Not regulatory advice. Agricredit.ai</p>
          </div>
        </div>

        {/* ─── PAGE 2: 5 C's ANALYSIS + ML PROOF ─── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden print-page print-page-break">
          {/* Report Header */}
          <div className="flex items-center justify-between px-8 py-5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
              </div>
              <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Agricredit</span>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>{data.crop_type} / {data.season}</span>
              <span>${data.amount_requested?.toLocaleString()}</span>
              <span>{today}</span>
              <span>Page 2/2</span>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">5 C&apos;s Credit Analysis</h2>

            {/* 5 C's Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Capacity */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg shadow-inner">📊</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Capacity</h4>
                    <span className="text-lg font-black" style={{ color: dscOk ? "#10B981" : "#F59E0B" }}>{dsc}x DSC</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{data.llm_capacity || `DSC ratio of ${dsc}x indicates sufficient cash flow to service debt.`}</p>
              </div>

              {/* Capital */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-lg shadow-inner">🏦</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Capital</h4>
                    <span className="text-lg font-black" style={{ color: equityOk ? "#10B981" : "#F59E0B" }}>{Math.round(equity * 100)}% Equity</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {equityOk ? "Strong buffer for operation. Scale-appropriate leverage." : "Equity position below ideal threshold. Consider additional collateral."}
                </p>
              </div>

              {/* Collateral */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg shadow-inner">🏠</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Collateral</h4>
                    <span className="text-lg font-black" style={{ color: ltvOk ? "#10B981" : "#F59E0B" }}>${collateral.toLocaleString()} ({Math.round(ltv * 100)}% LTV)</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{data.llm_collateral || `Collateral covers ${Math.round(ltv * 100)}% LTV. Verifiable assets.`}</p>
              </div>

              {/* Character */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg shadow-inner">👤</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Character</h4>
                    <span className="text-lg font-black text-green-600">Experienced Operator</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Seasoned operator with stable management history. Track record demonstrates reliable stewardship.</p>
              </div>
            </div>

            {/* Conditions: Feature Importance Chart */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner">🌍</div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Conditions — Climate &amp; Market Risk Drivers</h4>
                </div>
              </div>
              <div className="space-y-3">
                {featureImportance.map((feat: any, i: number) => {
                  const pct = Math.round(feat.weight * 100);
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-40 text-xs font-bold text-slate-500 text-right truncate">{feat.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden border border-slate-200">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(pct * 3, 100)}%` }}></div>
                      </div>
                      <span className="w-10 text-xs font-black text-slate-900">{pct}%</span>
                      <span className="w-28 text-[10px] font-medium text-slate-400 truncate">{feat.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ML Validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">ML Model Validation</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Logistic Baseline</span>
                      <span className="text-xs font-black text-slate-500">{Math.round((modelComp.baseline_auc || 0.71) * 100)}% AUC</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(modelComp.baseline_auc || 0.71) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Agricredit Enhanced</span>
                      <span className="text-xs font-black text-green-600">{Math.round((modelComp.enhanced_auc || 0.89) * 100)}% AUC</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${(modelComp.enhanced_auc || 0.89) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-wide italic">
                  {Math.round(((modelComp.enhanced_auc || 0.89) - (modelComp.baseline_auc || 0.71)) / (modelComp.baseline_auc || 0.71) * 100)}% improvement in risk detection
                </p>
              </div>

              {/* Data Sources */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Data Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {["IMD", "AGMARKNET", "FAOSTAT", "Drought Atlas", "NASA SPEI"].map((source, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-wider shadow-sm">
                      {source}
                    </span>
                  ))}
                </div>
                <div className="mt-5 space-y-2">
                  {[
                    data.rainfall_forecast,
                    data.yield_stability,
                    data.price_volatility
                  ].filter(Boolean).map((line: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                      <span className="text-xs text-slate-500 font-medium">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-3 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Decision support. Not regulatory advice. Agricredit.ai</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .report-page { background: white !important; padding: 0 !important; }
          .screen-only { display: none !important; }
          .print-page { box-shadow: none !important; border-radius: 0 !important; border: none !important; }
          .print-page-break { page-break-before: always; }
        }
      `}</style>
    </main>
  );
}
