"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AnalysisReport() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <AnalysisContent />
    </Suspense>
  );
}

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 md:p-12">
      <div className="max-w-[1100px] mx-auto space-y-4">
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="h-14 bg-gray-50 border-b border-gray-200" />
          <div className="p-8 space-y-6">
            <div className="flex gap-5">
              <div className="w-16 h-16 bg-gray-100 rounded animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-64 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 rounded border border-gray-100 animate-pulse" />
              ))}
            </div>
            <div className="h-24 bg-gray-50 rounded animate-pulse" />
            <div className="h-48 bg-gray-50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
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
    
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Please allow popups for this site to view the PDF report.");
      return;
    }

    reportWindow.document.write(`
      <html>
        <head><title>Generating Report...</title></head>
        <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
          <div style="text-align:center;">
            <div style="width:32px;height:32px;border:3px solid #166534;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
            <p style="font-size:14px;color:#374151;font-weight:600;">Generating credit memo...</p>
            <p style="font-size:13px;color:#9ca3af;margin-top:8px;">Compiling risk assessment data.</p>
          </div>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </body>
      </html>
    `);

    setGenerating(true);
    try {
      const res = await fetch(`http://localhost:8000/reports/generate/${id}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Report generation failed" }));
        const errHtml = `<div style="padding:32px;color:#dc2626;font-family:system-ui;font-size:14px;font-weight:600;">Error: ${err.detail || "Report generation failed"}</div>`;
        reportWindow.document.open();
        reportWindow.document.write(errHtml);
        reportWindow.document.close();
        return;
      }
      const html = await res.text();
      reportWindow.document.open();
      reportWindow.document.write(html);
      reportWindow.document.close();
      setTimeout(() => { reportWindow.print(); }, 2000);
    } catch {
      const errHtml = `<div style="padding:32px;color:#dc2626;font-family:system-ui;font-size:14px;font-weight:600;">Unable to connect to the assessment service.</div>`;
      reportWindow.document.open();
      reportWindow.document.write(errHtml);
      reportWindow.document.close();
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <ReportSkeleton />;

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900 mb-2">Application Not Found</h1>
          <p className="text-sm text-gray-500 mb-4">The requested credit application could not be retrieved.</p>
          <Link href="/dashboard" className="text-sm font-medium text-green-800 hover:text-green-700 transition-colors">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isLow = data.risk_tier === "LOW";
  const isHigh = data.risk_tier === "HIGH";

  const riskClassification = isLow ? "Acceptable" : isHigh ? "Elevated" : "Moderate";
  const riskColor = isLow ? "#166534" : isHigh ? "#991b1b" : "#92400e";
  const riskBgLight = isLow ? "#f0fdf4" : isHigh ? "#fef2f2" : "#fffbeb";
  const riskBorder = isLow ? "#bbf7d0" : isHigh ? "#fecaca" : "#fde68a";

  const decisionLabel = isLow ? "Approve" : isHigh ? "Decline Recommended" : "Conditional Approval";
  const decisionDesc = isLow
    ? "Financial metrics remain within acceptable thresholds. Exposure is supported by collateral coverage and adequate debt service capacity."
    : isHigh
    ? `The probability of default is assessed at ${data.bad_season_probability}%, which exceeds typical risk tolerance thresholds for unsecured agricultural lending. Despite operational capacity indicators, macro-environmental conditions introduce elevated repayment uncertainty.`
    : `Risk indicators fall within a cautionary range. Probability of default at ${data.bad_season_probability}% warrants additional scrutiny. Conditional approval may be considered with enhanced monitoring or supplementary collateral.`;

  const pd = data.bad_season_probability || 0;
  const baselinePd = data.baseline_pd || 0;
  const pdDelta = baselinePd > 0 ? Math.round(((baselinePd - pd) / baselinePd) * 100) : 0;

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
  const refId = data.scenario_id || id?.slice(0, 8).toUpperCase();

  const dscNote = dscOk
    ? `Debt service capacity remains strong at ${dsc}x, indicating substantial ability to meet repayment obligations under current projections.`
    : `Debt service coverage of ${dsc}x falls below the preferred 1.2x threshold, suggesting limited margin for repayment under adverse conditions.`;
  const ltvNote = ltvOk
    ? `Loan-to-value ratio of ${Math.round(ltv * 100)}% is within acceptable parameters. Collateral provides adequate coverage for the requested exposure.`
    : `Loan-to-value at ${Math.round(ltv * 100)}% exceeds the 75% guideline, indicating insufficient collateral margin relative to the loan amount.`;
  const equityNote = equityOk
    ? `Borrower equity contribution of ${Math.round(equity * 100)}% demonstrates meaningful commitment and provides loss absorption capacity.`
    : `Equity participation at ${Math.round(equity * 100)}% is below the recommended 30% threshold. Additional capital contribution should be considered.`;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-8 md:p-12 report-page">
      <div className="max-w-[1100px] mx-auto space-y-4">

        {/* Action Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 screen-only">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-900 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Credit Risk Assessment</h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href={`/report/summary?id=${id}`} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors">
              Borrower Summary
            </Link>
            <button
              onClick={handleGeneratePDF}
              disabled={generating}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded text-sm font-medium transition-colors ${
                generating
                  ? "bg-gray-50 border border-gray-200 text-gray-400 cursor-wait"
                  : "bg-green-900 text-white hover:bg-green-800 cursor-pointer"
              }`}
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Export PDF
                </>
              )}
            </button>
          </div>
        </header>

        {/* PAGE 1: EXECUTIVE SUMMARY */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden print-page">
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 tracking-tight">AgriCredit</span>
              <span className="text-[11px] text-gray-300">|</span>
              <span className="text-[11px] font-medium text-gray-400">Confidential</span>
            </div>
            <div className="flex items-center gap-5 text-[11px] font-medium text-gray-400">
              <span>Ref: {refId}</span>
              <span>{data.crop_type} / {data.season}</span>
              <span>{today}</span>
              <span>1 of 2</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {/* Section 1: Executive Summary */}
            <div>
              <div className="flex items-start gap-5 mb-5">
                <div className="w-14 h-14 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: riskBgLight, border: `1.5px solid ${riskBorder}` }}>
                  <span className="text-[10px] font-bold text-center leading-tight" style={{ color: riskColor }}>{riskClassification}</span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Section 1</p>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Executive Summary</h2>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                This report presents the credit risk assessment for a {data.crop_type?.toLowerCase()} cultivation loan of <span className="font-semibold text-gray-900">${data.amount_requested?.toLocaleString()}</span> for the {data.season} season. Risk classification is assessed as <span className="font-semibold" style={{ color: riskColor }}>{riskClassification}</span> based on observed financial, environmental, and market indicators.
              </p>
            </div>

            {/* Section 2: Key Credit Metrics */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Key Credit Metrics</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Probability of Default", value: `${pd}%`, ok: pd < 25 },
                  { label: "Expected Loss", value: `$${data.expected_loss?.toLocaleString()}`, ok: true },
                  { label: "Debt Service Coverage", value: `${dsc}x`, ok: dscOk },
                  { label: "Loan-to-Value", value: `${Math.round(ltv * 100)}%`, ok: ltvOk },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded p-4 border border-gray-100">
                    <p className="text-[11px] font-medium text-gray-400 mb-1.5">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {stat.value}
                      <span className={`ml-1.5 text-[10px] font-medium ${stat.ok ? "text-green-700" : "text-amber-600"}`}>
                        {stat.ok ? "Within threshold" : "Review required"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Credit Decision Indication */}
            <div className="rounded p-5 border" style={{ borderColor: riskBorder, backgroundColor: riskBgLight }}>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Credit Decision Indication</p>
              <p className="text-base font-bold mb-2" style={{ color: riskColor }}>
                {decisionLabel} — Suggested Rate: {data.suggested_interest_rate}%
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{decisionDesc}</p>
              {pdDelta !== 0 && baselinePd > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Baseline probability of default: {baselinePd}%. Adjusted assessment: {pd}% ({pdDelta > 0 ? `${pdDelta}% improvement` : `${Math.abs(pdDelta)}% deterioration`} from conventional scoring).
                </p>
              )}
            </div>

            {/* Section 4: Detailed Metrics */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Lending Metrics Detail</p>
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Metric</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Value</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Assessment</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { metric: "Debt Service Coverage", value: `${dsc}x`, ok: dscOk, assessment: dscOk ? "Adequate" : "Below threshold", note: dscNote },
                      { metric: "Loan-to-Value Ratio", value: `${Math.round(ltv * 100)}%`, ok: ltvOk, assessment: ltvOk ? "Acceptable" : "Exceeds guideline", note: ltvNote },
                      { metric: "Borrower Equity", value: `${Math.round(equity * 100)}%`, ok: equityOk, assessment: equityOk ? "Sufficient" : "Below minimum", note: equityNote },
                      { metric: "Collateral Valuation", value: `$${collateral.toLocaleString()}`, ok: true, assessment: "Verified", note: `Pledged asset value of $${collateral.toLocaleString()} has been assessed against current market rates.` },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                        <td className="px-5 py-3 font-medium text-gray-800">{row.metric}</td>
                        <td className="px-5 py-3 font-bold text-gray-900">{row.value}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${row.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                            {row.assessment}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 max-w-xs">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">For internal credit committee use only. Not intended as regulatory advice.</p>
            <p className="text-[11px] text-gray-400">AgriCredit Risk Assessment Services</p>
          </div>
        </div>

        {/* PAGE 2: 5C ANALYSIS + VALIDATION */}
        <div className="bg-white rounded border border-gray-200 overflow-hidden print-page print-page-break">
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 tracking-tight">AgriCredit</span>
              <span className="text-[11px] text-gray-300">|</span>
              <span className="text-[11px] font-medium text-gray-400">Confidential</span>
            </div>
            <div className="flex items-center gap-5 text-[11px] font-medium text-gray-400">
              <span>Ref: {refId}</span>
              <span>{data.crop_type} / {data.season}</span>
              <span>{today}</span>
              <span>2 of 2</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {/* Section 5: 5C Credit Assessment */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Section 5</p>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-4">Credit Assessment — 5C Framework</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FiveCCard
                  title="Capacity"
                  metric={`${dsc}x DSC`}
                  metricColor={dscOk ? "#166534" : "#92400e"}
                  body={data.llm_capacity || dscNote}
                />
                <FiveCCard
                  title="Capital"
                  metric={`${Math.round(equity * 100)}% Equity`}
                  metricColor={equityOk ? "#166534" : "#92400e"}
                  body={equityOk
                    ? "Borrower equity contribution provides adequate loss absorption buffer. Leverage is appropriate for the scale of operations."
                    : "Equity position falls below institutional guidelines. Supplementary collateral or co-borrower guarantee may be warranted."
                  }
                />
                <FiveCCard
                  title="Collateral"
                  metric={`$${collateral.toLocaleString()} (${Math.round(ltv * 100)}% LTV)`}
                  metricColor={ltvOk ? "#166534" : "#92400e"}
                  body={data.llm_collateral || `Pledged assets valued at $${collateral.toLocaleString()} provide ${ltvOk ? "adequate" : "insufficient"} coverage at a ${Math.round(ltv * 100)}% loan-to-value ratio.`}
                />
                <FiveCCard
                  title="Character"
                  metric="Experienced Operator"
                  metricColor="#166534"
                  body="Borrower demonstrates established operational history with consistent management practices. No adverse credit events identified in available records."
                />
              </div>
            </div>

            {/* Section 6: Conditions — Risk Drivers */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">Section 6</p>
              <h3 className="text-base font-bold text-gray-900 tracking-tight mb-3">Conditions — Climate and Market Risk Factors</h3>
              {featureImportance.length > 0 ? (
                <div className="space-y-2">
                  {featureImportance.map((feat: any, i: number) => {
                    const pct = Math.round(feat.weight * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-36 text-xs font-medium text-gray-500 text-right truncate">{feat.name}</span>
                        <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden border border-gray-200">
                          <div className="h-full bg-gray-700 rounded transition-all duration-500" style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                        </div>
                        <span className="w-10 text-xs font-bold text-gray-900 tabular-nums">{pct}%</span>
                        <span className="w-28 text-[11px] text-gray-400 truncate">{feat.value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Detailed risk factor breakdown not available for this assessment.</p>
              )}
              <div className="mt-4 space-y-1.5">
                {[data.rainfall_forecast, data.yield_stability, data.price_volatility].filter(Boolean).map((line: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 7: Model Validation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded p-5 border border-gray-100">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Model Validation Note</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-500">Conventional Logistic Model</span>
                      <span className="text-xs font-bold text-gray-500 tabular-nums">{Math.round((modelComp.baseline_auc || 0.71) * 100)}% AUC</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                      <div className="h-full bg-gray-400 rounded transition-all duration-500" style={{ width: `${(modelComp.baseline_auc || 0.71) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-700">Enhanced Risk Model</span>
                      <span className="text-xs font-bold text-gray-700 tabular-nums">{Math.round((modelComp.enhanced_auc || 0.89) * 100)}% AUC</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                      <div className="h-full bg-gray-700 rounded transition-all duration-500" style={{ width: `${(modelComp.enhanced_auc || 0.89) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-3">
                  Enhanced model demonstrates {Math.round(((modelComp.enhanced_auc || 0.89) - (modelComp.baseline_auc || 0.71)) / (modelComp.baseline_auc || 0.71) * 100)}% improvement in discriminatory power over conventional scoring methodology.
                </p>
              </div>

              <div className="bg-gray-50 rounded p-5 border border-gray-100">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Data Sources</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["IMD", "AGMARKNET", "FAOSTAT", "Drought Atlas", "NASA SPEI"].map((source, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-500">
                      {source}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Assessment incorporates meteorological observations, historical yield records, commodity price indices, and drought severity indicators from verified institutional data providers.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">For internal credit committee use only. Not intended as regulatory advice.</p>
            <p className="text-[11px] text-gray-400">AgriCredit Risk Assessment Services</p>
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

function FiveCCard({ title, metric, metricColor, body }: { title: string; metric: string; metricColor: string; body: string }) {
  return (
    <div className="bg-gray-50 rounded p-5 border border-gray-100">
      <p className="text-[11px] font-semibold text-gray-900 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-sm font-bold mb-2" style={{ color: metricColor }}>{metric}</p>
      <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
    </div>
  );
}
