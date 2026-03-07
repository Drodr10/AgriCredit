"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleSelection() {
  const router = useRouter();
  const [selected, setSelected] = useState<"farmer" | "lender" | null>(null);

  const handleContinue = () => {
    if (selected === "farmer") {
      router.push("/farm");
    } else if (selected === "lender") {
      router.push("/lender");
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 uppercase">
            Define Your <span className="text-green-500">Journey</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">
            Choose your role to unlock tailored financial insights and agricultural opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Farmer Card */}
          <button
            onClick={() => setSelected("farmer")}
            className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden ${
              selected === "farmer"
                ? "border-green-500 bg-green-500/5 shadow-2xl shadow-green-500/20 scale-[1.02]"
                : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50"
            }`}
          >
            {/* Visual Indicator */}
            <div className={`h-16 w-16 mb-6 rounded-2xl flex items-center justify-center transition-all ${
              selected === "farmer" ? "bg-green-500 text-slate-950" : "bg-slate-800 text-green-400"
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>

            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">I am a Farmer</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              Analyze your farm's risk, build a digital profile, and unlock access to specialized credit and insurance.
            </p>

            {/* Checkmark */}
            {selected === "farmer" && (
              <div className="absolute top-6 right-6 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>

          {/* Lender Card */}
          <button
            onClick={() => setSelected("lender")}
            className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden ${
              selected === "lender"
                ? "border-green-500 bg-green-500/5 shadow-2xl shadow-green-500/20 scale-[1.02]"
                : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50"
            }`}
          >
            {/* Visual Indicator */}
            <div className={`h-16 w-16 mb-6 rounded-2xl flex items-center justify-center transition-all ${
              selected === "lender" ? "bg-green-500 text-slate-950" : "bg-slate-800 text-green-400"
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">I am a Lender</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              Assess agricultural risk tiers, review specialized portfolios, and fund the future of global farming.
            </p>

            {/* Checkmark */}
            {selected === "lender" && (
              <div className="absolute top-6 right-6 h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`px-12 py-4 rounded-2xl font-black text-lg tracking-widest uppercase transition-all duration-300 shadow-xl ${
              selected
                ? "bg-green-500 text-slate-950 hover:bg-green-400 hover:-translate-y-1 shadow-green-500/25 active:scale-95 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            CONTINUE TO DASHBOARD
          </button>
        </div>
      </div>
    </main>
  );
}
