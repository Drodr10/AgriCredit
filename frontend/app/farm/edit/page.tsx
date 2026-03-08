"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  { id: "brown", name: "Normal Brown" },
  { id: "black", name: "Black Cotton" },
  { id: "alluvial", name: "Alluvial" },
  { id: "red", name: "Red" },
];

const IRRIGATION_TYPES = [
  { id: "canal", name: "Canal" },
  { id: "tubewell", name: "Tube-Well" },
  { id: "rainfed", name: "Rain-fed" },
];

const MACHINERY_TYPES = [
  { id: "manual", name: "Manual" },
  { id: "tractor", name: "Tractor" },
  { id: "large", name: "Heavy Duty" },
];

export default function EditFarmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <EditFarmContent />
    </Suspense>
  );
}

function EditFarmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const farmId = searchParams.get("id");
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    soil_category: "",
    irrigation_type: "",
    machinery_type: "",
    farm_size_hectares: 1,
    gps_coordinates: "",
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user && farmId) {
      fetchFarm();
    }
  }, [isLoaded, isSignedIn, user, farmId]);

  const fetchFarm = async () => {
    try {
      const clerkId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress || "";
      const response = await fetch(`${process.env.BACKEND_URL}/users/me?clerk_id=${clerkId}&email=${email}`);
      if (response.ok) {
        const data = await response.json();
        const farm = (data.farms || []).find((f: any) => f.id === farmId);
        if (farm) {
          setFormData({
            name: farm.name || "",
            location: farm.location || "",
            soil_category: farm.soil_category || "",
            irrigation_type: farm.irrigation_type || "",
            machinery_type: farm.machinery_type || "",
            farm_size_hectares: farm.farm_size_hectares || 1,
            gps_coordinates: farm.gps_coordinates || "",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch farm:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/users/me/farms/${farmId}?clerk_id=${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push("/dashboard");
      } else {
        const err = await response.json();
        console.error("Update failed:", err);
      }
    } catch (error) {
      console.error("Failed to update farm:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white text-slate-900 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <Link href="/dashboard" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-green-800 transition-colors flex items-center gap-2 mb-6">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black tracking-tight uppercase italic text-slate-900">
            Edit <span className="text-green-800">{formData.name || "Farm"}</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Update your farm profile details below.</p>
        </div>

        <div className="space-y-8 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-200 shadow-xl shadow-slate-200/50">
          
          {/* Name */}
          <div className="group">
              <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Farm Name</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all text-slate-900"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
          </div>

          {/* Location & Map */}
          <div className="group">
            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Location</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all text-slate-900 mb-4"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <LocationMap
              coordinates={formData.gps_coordinates}
              onCoordinatesChange={(coords: string) => setFormData({ ...formData, gps_coordinates: coords })}
            />
          </div>

          {/* Size */}
          <div className="group">
            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Farm Size (Hectares)</label>
            <div className="flex items-center gap-6">
              <input
                type="number"
                min="1"
                max="500"
                className="w-32 bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-2xl font-black focus:border-green-800 focus:bg-white outline-none transition-all text-slate-900 text-center"
                value={formData.farm_size_hectares}
                onChange={(e) => setFormData({ ...formData, farm_size_hectares: Math.max(1, parseFloat(e.target.value) || 1) })}
              />
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                className="flex-1 h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-green-800"
                value={formData.farm_size_hectares}
                onChange={(e) => setFormData({ ...formData, farm_size_hectares: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {/* Dropdowns Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group">
              <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Soil Type</label>
              <select
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-slate-900"
                value={formData.soil_category}
                onChange={(e) => setFormData({ ...formData, soil_category: e.target.value })}
              >
                <option value="">Select...</option>
                {SOIL_TYPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="group">
              <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Irrigation</label>
              <select
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-slate-900"
                value={formData.irrigation_type}
                onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
              >
                <option value="">Select...</option>
                {IRRIGATION_TYPES.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="group">
              <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Machinery</label>
              <select
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-slate-900"
                value={formData.machinery_type}
                onChange={(e) => setFormData({ ...formData, machinery_type: e.target.value })}
              >
                <option value="">Select...</option>
                {MACHINERY_TYPES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-2xl border border-gray-200 font-black uppercase text-xs tracking-widest hover:border-slate-900 transition-all text-slate-300 hover:text-slate-900 bg-white shadow-sm text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name || formData.farm_size_hectares < 1}
              className={`flex-1 py-4 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl ${
                saving || !formData.name || formData.farm_size_hectares < 1
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "bg-green-800 hover:bg-green-700 text-white hover:shadow-green-800/40 hover:-translate-y-1"
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
