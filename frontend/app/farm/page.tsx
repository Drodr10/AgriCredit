"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useVoiceContext } from "../../components/VoiceProvider";
import { VoiceInput } from "../../components/VoiceInput";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LocationMap = dynamic(() => import("@/app/components/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-50 rounded border border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400 gap-3">
      <div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-gray-500">Loading map...</span>
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
    farm_size_hectares: 5,
    gps_coordinates: "",
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/users/me/farms?clerk_id=${user?.id}`, {
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
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 4,
          border: "1px solid #e5e7eb",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="text-xs font-semibold text-green-800">
                Step {step} of 4
              </span>
              <span className="text-xs text-gray-400">
                {Math.round((step / 4) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 h-1 overflow-hidden">
              <div
                className="bg-green-800 h-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* ──── Step 1: Farm Identity ──── */}
          {step === 1 && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 mb-1">Your Farm Identity</h1>
              <p className="text-gray-500 text-sm mb-5">
                Give your farm a name. This is how it will appear across your dashboard and reports.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Farm Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ludhiana Plot A"
                className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors placeholder:text-gray-300 text-gray-900"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          {/* ──── Step 2: Regional Context ──── */}
          {step === 2 && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 mb-1">Regional Context</h1>
              <p className="text-gray-500 text-sm mb-5">
                Pin your location on the map and set your farm scale.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                State & District
              </label>
              <input
                type="text"
                placeholder="e.g. Punjab, Bathinda"
                className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors placeholder:text-gray-300 text-gray-900"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          )}

          {/* ──── Step 3: Soil Composition ──── */}
          {step === 3 && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 mb-1">Soil Composition</h1>
              <p className="text-gray-500 text-sm mb-5">
                Select the soil type that best describes your land.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SOIL_TYPES.map((soil) => (
                  <button
                    key={soil.id}
                    onClick={() => setFormData({ ...formData, soil_category: soil.id })}
                    className={`relative rounded overflow-hidden border-2 transition-colors text-left ${
                      formData.soil_category === soil.id
                        ? "border-green-800"
                        : "border-gray-200 hover:border-green-700/40"
                    }`}
                    style={{ height: 72 }}
                  >
                    <Image src={soil.image} alt={soil.name} fill className="object-cover object-center opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/40"></div>
                    <div className="absolute inset-0 flex items-center px-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{soil.name}</h3>
                        <p className="text-gray-500 text-xs">{soil.desc}</p>
                      </div>
                      {formData.soil_category === soil.id && (
                        <div className="ml-auto w-5 h-5 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
              <h1 className="text-lg font-bold tracking-tight text-gray-900 mb-1">Tools & Infrastructure</h1>
              <p className="text-gray-500 text-sm mb-5">
                Infrastructure data helps assess operational capacity.
              </p>

              {/* Irrigation */}
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Irrigation Method
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {IRRIGATION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, irrigation_type: type.id })}
                    className={`relative rounded overflow-hidden border-2 transition-colors text-left ${
                      formData.irrigation_type === type.id
                        ? "border-green-800"
                        : "border-gray-200 hover:border-green-700/40"
                    }`}
                    style={{ height: 56 }}
                  >
                    <Image src={type.image} alt={type.name} fill className="object-cover object-center opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/40"></div>
                    <div className="absolute inset-0 flex items-center px-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{type.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{type.desc}</span>
                      </div>
                      {formData.irrigation_type === type.id && (
                        <div className="ml-auto w-5 h-5 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Machinery */}
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Machinery
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {MACHINERY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, machinery_type: type.id })}
                    className={`relative rounded overflow-hidden border-2 transition-colors text-left ${
                      formData.machinery_type === type.id
                        ? "border-green-800"
                        : "border-gray-200 hover:border-green-700/40"
                    }`}
                    style={{ height: 56 }}
                  >
                    <Image src={type.image} alt={type.name} fill className="object-cover object-center opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/40"></div>
                    <div className="absolute inset-0 flex items-center px-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{type.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{type.desc}</span>
                      </div>
                      {formData.machinery_type === type.id && (
                        <div className="ml-auto w-5 h-5 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
                className="px-4 py-2.5 rounded border border-gray-200 text-sm font-medium hover:border-gray-900 transition-colors text-gray-400 hover:text-gray-900 bg-white"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 4 ? handleSubmit : nextStep}
              disabled={!canContinue()}
              className={`flex-1 py-2.5 rounded text-sm font-semibold transition-colors ${
                !canContinue()
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-green-800 hover:bg-green-700 text-white"
              }`}
            >
              {step === 4 ? "Submit Profile" : "Continue"}
            </button>
          </div>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] text-gray-400">
              Bank-Grade Encryption
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
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            padding: "14px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
              Farm Scale (Hectares)
            </label>
            <div className="text-2xl font-bold text-green-800 text-center mb-2 tabular-nums">
              {formData.farm_size_hectares}
            </div>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-800"
              value={formData.farm_size_hectares}
              onChange={(e) => setFormData({ ...formData, farm_size_hectares: parseFloat(e.target.value) })}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 ha</span>
              <span>500 ha</span>
            </div>
          </div>
        </div>
      )}
    </LocationMap>
  );
}
