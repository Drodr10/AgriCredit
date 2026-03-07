"use client";

import dynamic from "next/dynamic";

const GlobeMap = dynamic(() => import("../components/GlobeMap"), {
  ssr: false,
});
export default function MapPage() {
  return (
    <main className="h-[calc(100vh-4rem)] bg-slate-900 overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <GlobeMap />
      </div>

      {/* Optional Overlay UI elements can go here */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-md p-4 shadow-xl">
          <h1 className="text-xl font-bold text-white mb-1">
            Global Drought Index
          </h1>
          <p className="text-xs text-slate-400">
            Interactive SPEI-based severity visualization
          </p>
        </div>
      </div>
    </main>
  );
}
