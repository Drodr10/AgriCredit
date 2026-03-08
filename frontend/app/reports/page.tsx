"use client";

import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Farm {
  id: string;
  name: string;
  location: string;
}

interface Report {
  id: string;
  farmer_id: string;
  crop_type: string;
  season: string;
  risk_tier: string;
  bad_season_probability: number;
  amount_requested: number;
  suggested_interest_rate: number;
  created_at: string;
}

export default function AllReportsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetchData();
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchData = async () => {
    try {
      const clerkId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress || "";

      const [userRes, reportsRes] = await Promise.all([
        fetch(`http://localhost:8000/users/me?clerk_id=${clerkId}&email=${email}`),
        fetch(`http://localhost:8000/credit-applications/by-user/${clerkId}`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setFarms(userData.farms || []);
      }
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:8000/credit-applications/${id}`, { method: "DELETE" });
      if (response.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setDeleteId(null);
      }
    } catch (error) {
      console.error("Failed to delete report:", error);
    } finally {
      setDeleting(false);
    }
  };

  const farmName = (farmId: string) => {
    const farm = farms.find((f) => f.id === farmId);
    return farm?.name || "Unknown Farm";
  };

  const riskColor = (tier: string) => {
    if (tier === "LOW") return "text-green-600 bg-green-50 border-green-100";
    if (tier === "HIGH") return "text-red-500 bg-red-50 border-red-100";
    return "text-amber-500 bg-amber-50 border-amber-100";
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex justify-between items-end mb-12 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase bg-gradient-to-r from-[#1a4a2e] to-[#d4a017] bg-clip-text text-transparent">
              All <span className="italic">Reports</span>
            </h1>
            <p className="text-slate-400 font-medium font-mono uppercase tracking-[0.2em]">
              {reports.length} credit report{reports.length !== 1 ? "s" : ""} across {farms.length} farm{farms.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/apply"
            className="group flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl transition-all hover:-translate-y-1 shadow-xl shadow-green-800/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            NEW REPORT
          </Link>
        </header>

        {reports.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-[3rem] p-24 text-center">
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-100">
              <svg className="w-8 h-8 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">No Reports Yet</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Apply for credit on any of your farms to generate AI-powered risk reports.</p>
            <Link
              href="/apply"
              className="inline-block bg-green-800 hover:bg-green-700 text-white font-black py-4 px-10 rounded-2xl transition-all uppercase tracking-widest shadow-xl"
            >
              Apply Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-green-700/40 transition-all shadow-sm hover:shadow-lg flex items-center gap-6"
              >
                {/* Risk Badge */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-sm border ${riskColor(report.risk_tier)}`}>
                  {report.risk_tier}
                </div>

                {/* Info */}
                <Link href={`/report/summary?id=${report.id}`} className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 group-hover:text-green-800 transition-colors">
                      {report.crop_type} – {report.season}
                    </h3>
                    <span className="text-xs font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                      {farmName(report.farmer_id)}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400 font-bold">${report.amount_requested?.toLocaleString()}</span>
                    <span className="text-slate-200">•</span>
                    <span className="text-slate-400 font-bold">{report.bad_season_probability}% risk</span>
                    <span className="text-slate-200">•</span>
                    <span className="text-slate-400 font-bold">~{report.suggested_interest_rate}% rate</span>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/report/summary?id=${report.id}`}
                    className="p-2 rounded-xl text-slate-300 hover:text-green-800 hover:bg-green-50 transition-all"
                    title="View Report"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setDeleteId(report.id)}
                    className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Delete Report"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-200 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-100">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-black uppercase text-slate-900 mb-2">Delete Report?</h3>
              <p className="text-slate-400 text-sm mb-8">This action cannot be undone. The credit report will be permanently removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
