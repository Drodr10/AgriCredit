"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("@/app/components/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-white rounded-3xl border border-gray-200 border-dashed flex flex-col items-center justify-center text-slate-300 gap-4 shadow-sm">
      <div className="w-6 h-6 border-2 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      <span className="font-bold uppercase tracking-widest text-xs">Loading Map...</span>
    </div>
  ),
});

const SOIL_TYPES = [
  { id: "brown", name: "Normal Brown", desc: "Fertile, loam soil", image: "/onboarding/soil_brown.png" },
  { id: "black", name: "Black Cotton", desc: "Cracked, clay-rich", image: "/onboarding/soil_black.png" },
  { id: "alluvial", name: "Alluvial", desc: "Smooth, silt-rich", image: "/onboarding/soil_alluvial.png" },
  { id: "red", name: "Red", desc: "Iron-rich, porous", image: "/onboarding/soil_red.png" },
];

const IRRIGATION_TYPES = [
  { id: "canal", name: "Canal", desc: "Shared water flow", image: "/onboarding/irr_canal.png" },
  { id: "tubewell", name: "Tube-Well", desc: "Groundwater pump", image: "/onboarding/irr_well.png" },
  { id: "rainfed", name: "Rain-fed", desc: "Monsoon dependent", image: "/onboarding/irr_rain.png" },
];

const MACHINERY_TYPES = [
  { id: "manual", name: "Manual", desc: "Traditional tools", image: "/onboarding/mach_manual.png" },
  { id: "tractor", name: "Tractor", desc: "Utility machinery", image: "/onboarding/mach_tractor.png" },
  { id: "large", name: "Heavy Duty", desc: "Large harvesters", image: "/onboarding/mach_large.png" },
];

const SOIL_COLORS: Record<string, string> = {
  brown: "#8B6914",
  black: "#3B3B3B",
  alluvial: "#C2A868",
  red: "#A0522D",
};

export default function OnboardingFlow() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    soil_category: "",
    irrigation_type: "",
    machinery_type: "",
    farm_size_hectares: 1,
    gps_coordinates: "",
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:8000/users/me/farms?clerk_id=${user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...formData,
           clerk_id: user?.id || null,
           email: user?.primaryEmailAddress?.emailAddress || null,
           phone: user?.primaryPhoneNumber?.phoneNumber || null,
        }),
      });
      if (response.ok) {
        router.push("/dashboard");
      } else {
        const errData = await response.json();
        console.error("Server error:", errData);
      }
    } catch (error) {
      console.error("Failed to fetch. CORS or Server Down?", error);
    }
  };

  const canContinue = () => {
    if (step === 1 && !formData.name) return false;
    if (step === 4 && formData.farm_size_hectares < 1) return false;
    return true;
  };

  return (
    <LocationMap
      coordinates={formData.gps_coordinates}
      location={formData.location}
      farmSizeHectares={formData.farm_size_hectares}
      farmCircleColor={SOIL_COLORS[formData.soil_category] || undefined}
      farmName={formData.name || undefined}
      onCoordinatesChange={(coords: string) => setFormData({ ...formData, gps_coordinates: coords })}
      onLocationChange={(location: string) => setFormData((prev) => ({ ...prev, location }))}
    >
      {/* ─── Left-side overlay panel ─── */}
      <div style={{
        position: "absolute",
        top: 24,
        left: 24,
        zIndex: 50,
        width: 380,
        maxWidth: "calc(100vw - 48px)",
        maxHeight: "calc(100vh - 140px)",
        overflowY: "auto",
        pointerEvents: "auto",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 20,
          padding: "24px 28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="text-[10px] font-black text-green-800 uppercase tracking-[0.2em]">
                Step {step} of 4
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {Math.round((step / 4) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div
                className="bg-green-800 h-full transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(26,74,46,0.2)]"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* ──── Step 1: Farm Identity ──── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 mb-1">Your Farm Identity</h1>
              <p className="text-slate-400 text-sm font-medium mb-6">
                Give your farm a name. This is how it will appear across your dashboard and reports.
              </p>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                Farm Nickname
              </label>
              <input
                type="text"
                placeholder="e.g. Ludhiana Plot A"
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-5 py-3 text-lg font-bold focus:border-green-800 focus:ring-4 focus:ring-green-50 outline-none transition-all placeholder:text-slate-200 text-slate-900 shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          {/* ──── Step 2: Regional Context ──── */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 mb-1">Regional Context</h1>
              <p className="text-slate-400 text-sm font-medium mb-6">
                Pin your location on the map and set your farm scale.
              </p>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                State & District
              </label>
              <input
                type="text"
                placeholder="e.g. Punjab, Bathinda"
                className="w-full bg-white/80 border border-gray-200 rounded-xl px-5 py-3 text-lg font-bold focus:border-green-800 focus:ring-4 focus:ring-green-50 outline-none transition-all placeholder:text-slate-200 text-slate-900 shadow-sm"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          )}

          {/* ──── Step 3: Soil Composition ──── */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 mb-1">Soil Composition</h1>
              <p className="text-slate-400 text-sm font-medium mb-6">
                Healthy crops start from the ground up. Which best describes your land?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SOIL_TYPES.map((soil) => (
                  <button
                    key={soil.id}
                    onClick={() => setFormData({ ...formData, soil_category: soil.id })}
                    className={`relative rounded-2xl overflow-hidden border transition-all group shadow-sm text-left ${
                      formData.soil_category === soil.id
                        ? "border-green-800 ring-4 ring-green-50 shadow-lg"
                        : "border-gray-200 hover:border-green-700/40"
                    }`}
                    style={{ height: 80 }}
                  >
                    <Image src={soil.image} alt={soil.name} fill className="object-cover object-left scale-125 transition-transform group-hover:scale-150 duration-700 opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center px-5">
                      <div>
                        <h3 className="text-base font-black tracking-tighter text-slate-900">{soil.name}</h3>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{soil.desc}</p>
                      </div>
                      {formData.soil_category === soil.id && (
                        <div className="ml-auto">
                          <svg className="w-6 h-6 text-green-800" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ──── Step 4: Tools & Tactics ──── */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 mb-1">Tools & Tactics</h1>
              <p className="text-slate-400 text-sm font-medium mb-5">
                Lenders require infrastructure data to assess operational efficiency.
              </p>

              {/* Irrigation */}
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-gray-200/60 pb-1">
                Irrigation Strategy
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {IRRIGATION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, irrigation_type: type.id })}
                    className={`relative rounded-2xl overflow-hidden border transition-all group shadow-sm text-left ${
                      formData.irrigation_type === type.id
                        ? "border-green-800 ring-4 ring-green-50 shadow-lg"
                        : "border-gray-200 hover:border-green-700/40"
                    }`}
                    style={{ height: 64 }}
                  >
                    <Image src={type.image} alt={type.name} fill className="object-cover object-left scale-125 transition-transform group-hover:scale-150 duration-700 opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center px-5">
                      <div>
                        <span className="text-base font-black tracking-tighter text-slate-900">{type.name}</span>
                        <span className="text-slate-400 text-[10px] font-bold ml-2">{type.desc}</span>
                      </div>
                      {formData.irrigation_type === type.id && (
                        <div className="ml-auto">
                          <svg className="w-5 h-5 text-green-800" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Machinery */}
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-gray-200/60 pb-1">
                Machinery & Labor
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MACHINERY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, machinery_type: type.id })}
                    className={`relative rounded-2xl overflow-hidden border transition-all group shadow-sm text-left ${
                      formData.machinery_type === type.id
                        ? "border-green-800 ring-4 ring-green-50 shadow-lg"
                        : "border-gray-200 hover:border-green-700/40"
                    }`}
                    style={{ height: 64 }}
                  >
                    <Image src={type.image} alt={type.name} fill className="object-cover object-left scale-125 transition-transform group-hover:scale-150 duration-700 opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center px-5">
                      <div>
                        <span className="text-base font-black tracking-tighter text-slate-900">{type.name}</span>
                        <span className="text-slate-400 text-[10px] font-bold ml-2">{type.desc}</span>
                      </div>
                      {formData.machinery_type === type.id && (
                        <div className="ml-auto">
                          <svg className="w-5 h-5 text-green-800" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ──── Navigation Buttons ──── */}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2.5 rounded-lg border border-gray-200 font-black uppercase text-[9px] tracking-widest hover:border-slate-900 transition-all text-slate-300 hover:text-slate-900 bg-white/80 shadow-sm"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 4 ? handleSubmit : nextStep}
              disabled={!canContinue()}
              className={`flex-1 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-[0.15em] transition-all shadow-lg ${
                !canContinue()
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "bg-green-800 hover:bg-green-700 text-white hover:shadow-green-800/40"
              }`}
            >
              {step === 4 ? "Submit Profile" : "Continue"}
            </button>
          </div>

          {/* Encryption badge */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
              Bank-Grade Encryption • GDPR
            </span>
          </div>
        </div>
      </div>

      {/* ─── Bottom-center panel: Farm Scale (step 2 only) ─── */}
      {step === 2 && (
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
            padding: "14px 20px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          }}>
            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest text-center">
              Farm Scale (Hectares)
            </label>
            <div className="text-3xl font-black text-green-800 text-center mb-2 tabular-nums tracking-tighter">
              {formData.farm_size_hectares}
            </div>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-800 ring-1 ring-gray-200"
              value={formData.farm_size_hectares}
              onChange={(e) => setFormData({ ...formData, farm_size_hectares: parseFloat(e.target.value) })}
            />
            <div className="flex justify-between text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">
              <span>Small (1)</span>
              <span>Industrial (500)</span>
            </div>
          </div>
        </div>
      )}
    </LocationMap>
  );
}
