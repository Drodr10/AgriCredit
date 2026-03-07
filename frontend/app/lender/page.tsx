"use client";

import Link from "next/link";

export default function LenderDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 sm:p-12 font-sans overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16">
          <h1 className="text-4xl font-black tracking-tighter mb-4 uppercase">Lender <span className="text-blue-400">Command Center</span></h1>
          <p className="text-slate-400 font-medium text-lg">Portfolio Risk Assessment & Capital Allocation</p>
        </header>

        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem] p-24 text-center">
          <div className="bg-blue-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-blue-500/20">
             <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">Lender Portal Under Development</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto text-lg font-medium">
            This module is being built to provide institutional lenders with deep agricultural risk modeling and portfolio management tools.
          </p>
          <Link href="/role" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-10 rounded-2xl transition-all border border-slate-700">
             CHANGE ROLE
          </Link>
        </div>
      </div>
    </main>
  );
}
