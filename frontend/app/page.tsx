"use client";

import Link from "next/link";
import IndiaMap from "./components/IndiaMap";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-green-950 overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-6 sm:px-10 pt-8 pb-4 lg:pt-12 lg:pb-8 gap-6 lg:gap-4">
        {/* Text Content */}
        <div className="flex-1 max-w-xl z-10 text-center lg:text-left">
          <p className="text-green-400 font-semibold text-sm tracking-widest uppercase mb-4 animate-fade-in">
            AI-Powered Agriculture Finance
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Credit Access for{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Global Agriculture
            </span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            Harness AI-driven financial forecasting to unlock credit
            opportunities for farmers worldwide. Visualize regional drought
            conditions and assess agricultural risk in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/report"
              className="relative inline-flex items-center justify-center rounded-xl bg-green-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-green-500/30 hover:bg-green-400 hover:shadow-green-400/40 transition-all duration-300 group"
            >
              <span>Get Started</span>
              <svg
                className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/api/docs"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-8 py-3.5 text-base font-semibold text-slate-300 hover:border-green-500 hover:text-green-400 transition-all duration-300"
            >
              API Docs
            </Link>
          </div>
        </div>

        {/* Background glow effect */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[128px] pointer-events-none" />
      </section>

      {/* India Drought Map */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pb-6">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
            <div>
              <h2 className="text-lg font-semibold text-white">
                India Drought Index
              </h2>
              <p className="text-sm text-slate-400">
                SPEI-based drought severity by state — Source:{" "}
                <a
                  href="https://zenodo.org/records/8280551"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 underline underline-offset-2"
                >
                  Zenodo Drought Atlas
                </a>
              </p>
            </div>
          </div>
          <div className="h-[500px] lg:h-[600px]">
            <IndiaMap />
          </div>
        </div>
      </section>

      {/* Stats / Info Cards */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm px-6 py-6 hover:border-green-500/40 transition-colors duration-300">
            <div className="text-3xl font-bold text-green-400 mb-1">150+</div>
            <div className="text-sm text-slate-400">Countries Covered</div>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm px-6 py-6 hover:border-green-500/40 transition-colors duration-300">
            <div className="text-3xl font-bold text-green-400 mb-1">AI</div>
            <div className="text-sm text-slate-400">
              Powered Forecasting Engine
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm px-6 py-6 hover:border-green-500/40 transition-colors duration-300">
            <div className="text-3xl font-bold text-green-400 mb-1">
              Real‑Time
            </div>
            <div className="text-sm text-slate-400">
              Agricultural Data Analysis
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
