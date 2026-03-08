"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("../components/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-green-50/60 flex flex-col items-center justify-center text-slate-300 gap-4">
      <div className="w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-bold uppercase tracking-widest text-xs">Loading Map...</span>
    </div>
  ),
});

export default function MapPage() {
  const [coordinates, setCoordinates] = useState("");
  const [hectares, setHectares] = useState(1);

  return (
    <LocationMap
      coordinates={coordinates}
      farmSizeHectares={hectares}
      onCoordinatesChange={setCoordinates}
    >
      {/* Overlay title */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 50,
        pointerEvents: "auto",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: 14,
          padding: "14px 18px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        }}>
          <h1 className="text-lg font-black text-slate-900 tracking-tight mb-0.5">
            Global Drought Index
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            Interactive SPEI-based severity visualization
          </p>
        </div>
      </div>

      {/* Bottom-center: Farm Scale slider */}
      <div style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        width: 340,
        maxWidth: "calc(100vw - 48px)",
        pointerEvents: "auto",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 16,
          padding: "10px 18px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}>
          <label className="block text-[8px] font-bold text-slate-400 mb-0.5 uppercase tracking-widest text-center">
            Area Scale (ha)
          </label>
          <div className="text-xl font-black text-green-800 text-center mb-1 tabular-nums tracking-tighter">
            {hectares}
          </div>
          <input
            type="range"
            min="1"
            max="500"
            step="1"
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-800 ring-1 ring-gray-200"
            value={hectares}
            onChange={(e) => setHectares(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">
            <span>Small (1)</span>
            <span>Industrial (500)</span>
          </div>
        </div>
      </div>
    </LocationMap>
  );
}
