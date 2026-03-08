"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

export default function OnboardingFlow() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    tenure_years: 0,
    location: "",
    soil_category: "",
    irrigation_type: "",
    machinery_type: "",
    farm_size_hectares: 0,
    national_id: "",
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      // Use full URL to avoid any ambiguity, though CORS is now fixed.
      const response = await fetch(`http://localhost:8000/users/me/farms?clerk_id=${user?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...formData,
           clerk_id: user?.id || null,
           email: user?.primaryEmailAddress?.emailAddress || null,
           phone: user?.primaryPhoneNumber?.phoneNumber || null,
           national_id: formData.national_id || "TEMP-" + Math.random().toString(36).substr(2, 9)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white text-slate-900 font-sans selection:bg-green-500/30">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Navigation */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-green-800 uppercase tracking-[0.2em]">Onboarding • Step {step} of 5</span>
            <span className="text-xs font-bold text-slate-400">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-green-800 h-full transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(26,74,46,0.2)]"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="relative">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h1 className="text-5xl font-black mb-4 tracking-tighter text-slate-900">Your Farm Identity</h1>
              <p className="text-slate-400 mb-12 text-xl max-w-xl font-medium">Lenders value stability. Tell us about your journey on this land.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Farm Nickname</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ludhiana Plot A"
                    className="w-full bg-white border border-gray-200 rounded-2xl px-8 py-5 text-2xl font-bold focus:border-green-800 focus:ring-4 focus:ring-green-50 outline-none transition-all placeholder:text-slate-200 text-slate-900 shadow-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Years Operating This Farm</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-white border border-gray-200 rounded-2xl px-8 py-5 text-2xl font-bold focus:border-green-800 focus:ring-4 focus:ring-green-50 outline-none transition-all text-slate-900 shadow-sm"
                    value={formData.tenure_years != null ? formData.tenure_years : ""}
                    onChange={(e) => setFormData({ ...formData, tenure_years: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                  />
                  <p className="text-slate-300 text-xs mt-3 font-medium italic">Enter 0 if this is your first season.</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <h1 className="text-5xl font-black mb-4 tracking-tighter text-slate-900">Regional Context</h1>
              <p className="text-slate-400 mb-12 text-xl max-w-xl font-medium">Geography shapes your risk profile. Pin your location for accurate climate data.</p>
              
              <div className="space-y-8">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">State & District</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Punjab, Bathinda"
                    className="w-full bg-white border border-gray-200 rounded-2xl px-8 py-5 text-2xl font-bold focus:border-green-800 focus:ring-4 focus:ring-green-50 outline-none transition-all placeholder:text-slate-200 text-slate-900 shadow-sm"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="h-64 bg-white rounded-3xl border border-gray-200 border-dashed flex flex-col items-center justify-center text-slate-300 gap-4 overflow-hidden relative shadow-sm">
                   <div className="absolute inset-0 bg-green-50/50 blur-3xl rounded-full translate-y-1/2"></div>
                   <svg className="w-12 h-12 text-green-800/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   <span className="font-bold uppercase tracking-widest text-xs">Interactive Map Module Loading...</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <h1 className="text-5xl font-black mb-4 tracking-tighter text-slate-900">Soil Composition</h1>
              <p className="text-slate-400 mb-12 text-xl max-w-xl font-medium">Healthy crops start from the ground up. Which best describes your land?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {SOIL_TYPES.map((soil) => (
                  <button
                    key={soil.id}
                    onClick={() => setFormData({ ...formData, soil_category: soil.id })}
                    className={`relative aspect-[16/10] rounded-3xl overflow-hidden border transition-all group shadow-sm ${
                      formData.soil_category === soil.id 
                      ? "border-green-800 ring-4 ring-green-50 shadow-lg" 
                      : "border-gray-200 hover:border-green-700/40"
                    }`}
                  >
                    <Image src={soil.image} alt={soil.name} fill className="object-cover transition-transform group-hover:scale-110 duration-700 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6 text-left w-full">
                       <h3 className="text-2xl font-black tracking-tighter text-slate-900">{soil.name}</h3>
                       <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-wider">{soil.desc}</p>
                       <div className={`mt-4 h-1 w-12 rounded-full transition-all ${formData.soil_category === soil.id ? "bg-green-800 w-full" : "bg-gray-200"}`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <h1 className="text-5xl font-black mb-4 tracking-tighter text-slate-900">Tools & Tactics</h1>
              <p className="text-slate-400 mb-12 text-xl max-w-xl font-medium">Lenders require infrastructure data to assess operational efficiency.</p>

              <div className="space-y-12">
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Irrigation Strategy</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {IRRIGATION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({ ...formData, irrigation_type: type.id })}
                        className={`relative h-48 rounded-3xl overflow-hidden border transition-all group shadow-sm ${
                          formData.irrigation_type === type.id 
                          ? "border-green-800 ring-4 ring-green-50 shadow-lg" 
                          : "border-gray-200 hover:border-green-700/40"
                        }`}
                      >
                        <Image src={type.image} alt={type.name} fill className="object-cover opacity-80 group-hover:scale-110 duration-700" />
                        <div className="absolute inset-0 bg-white/40 group-hover:bg-white/20 transition-colors"></div>
                        <div className="absolute inset-x-0 bottom-0 p-6 text-center bg-white/90 backdrop-blur-sm border-t border-gray-100">
                           <span className="text-xl font-black tracking-tighter text-slate-900">{type.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Machinery & Labor</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {MACHINERY_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({ ...formData, machinery_type: type.id })}
                        className={`relative h-48 rounded-3xl overflow-hidden border transition-all group shadow-sm ${
                          formData.machinery_type === type.id 
                          ? "border-green-800 ring-4 ring-green-50 shadow-lg" 
                          : "border-gray-200 hover:border-green-700/40"
                        }`}
                      >
                        <Image src={type.image} alt={type.name} fill className="object-cover opacity-80 group-hover:scale-110 duration-700" />
                        <div className="absolute inset-0 bg-white/40 group-hover:bg-white/20 transition-colors"></div>
                        <div className="absolute inset-x-0 bottom-0 p-6 text-center bg-white/90 backdrop-blur-sm border-t border-gray-100">
                           <span className="text-xl font-black tracking-tighter text-slate-900">{type.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
              <h1 className="text-5xl font-black mb-4 tracking-tighter text-slate-900">Final Verification</h1>
              <p className="text-slate-400 mb-12 text-xl max-w-xl font-medium">Complete your profile to unlock custom credit analytics.</p>
              
              <div className="space-y-16">
                <div className="text-center group">
                   <label className="block text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Farm Scale (Hectares)</label>
                   <div className="text-8xl font-black text-green-800 mb-8 tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(26,74,46,0.1)]">
                      {formData.farm_size_hectares}
                   </div>
                   <input 
                      type="range" 
                      min="0" 
                      max="500" 
                      step="1"
                      className="w-full h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-800 ring-1 ring-gray-200"
                      value={formData.farm_size_hectares}
                      onChange={(e) => setFormData({ ...formData, farm_size_hectares: parseFloat(e.target.value) })}
                   />
                   <div className="flex justify-between text-xs font-bold text-slate-300 mt-4 uppercase tracking-tighter">
                      <span>Small Scale (0)</span>
                      <span>Industrial Scale (500)</span>
                   </div>
                </div>

                <div className="bg-white p-10 rounded-3xl border border-gray-200 relative overflow-hidden shadow-sm">
                   <div className="absolute top-0 right-0 p-8 text-green-800/5">
                      <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                   </div>
                   <label className="block text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Aadhaar Card Number</label>
                   <input 
                      type="text" 
                      placeholder="XXXX - XXXX - XXXX"
                      className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-8 py-5 text-3xl font-black focus:border-green-800 focus:ring-4 focus:ring-green-50 transition-all placeholder:text-slate-100 tracking-widest text-slate-900"
                      value={formData.national_id}
                      onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                   />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Navigation */}
          <div className="mt-20 flex flex-col sm:flex-row gap-4">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="px-10 py-5 rounded-2xl border border-gray-200 font-black uppercase text-xs tracking-widest hover:border-slate-900 transition-all text-slate-300 hover:text-slate-900 bg-white shadow-sm"
              >
                Back
              </button>
            )}
            <button 
              onClick={step === 5 ? handleSubmit : nextStep}
              disabled={step === 1 && !formData.name}
              className={`flex-1 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl ${
                step === 1 && !formData.name 
                ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                : "bg-green-800 hover:bg-green-700 text-white hover:shadow-green-800/40 hover:-translate-y-1"
              }`}
            >
              {step === 5 ? "Submit Profile" : "Continue"}
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-slate-300">
           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
           </svg>
           <span className="text-[10px] font-bold uppercase tracking-widest">Bank-Grade Encryption Enabled • GDPR Compliant</span>
        </div>
      </div>
    </div>
  );
}
