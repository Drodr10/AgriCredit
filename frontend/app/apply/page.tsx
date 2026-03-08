"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const LOAN_PURPOSES = [
  { id: "seeds", label: "Seeds & Sowing" },
  { id: "machines", label: "Machinery & Equipment" },
  { id: "fertilizers", label: "Fertilizers & Pesticides" },
  { id: "labor", label: "Labor Costs" },
  { id: "irrigation", label: "Irrigation Systems" },
  { id: "other", label: "Other Operational Needs" },
];

export default function CreditApplicationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CreditApplicationForm />
    </Suspense>
  );
}

function CreditApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const farmIdParam = searchParams.get("farmId");
  
  const { isLoaded, isSignedIn, user } = useUser();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clerk_id: "",
    farmer_id: "",
    crop_type: "",
    region: "",
    season: "",
    amount_requested: 0,
    loan_purpose: "seeds",
    has_insurance: false,
    insurance_type: "",
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetchFarms();
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchFarms = async () => {
    try {
      const clerkId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress || "";
      const response = await fetch(`/api/users/me?clerk_id=${clerkId}&email=${email}`);
      if (response.ok) {
        const data = await response.json();
        const userFarms = data.farms || [];
        setFarms(userFarms);
        
        const initialFarmId = farmIdParam || (userFarms.length > 0 ? userFarms[0].id : "");
        const selectedFarm = userFarms.find((f: any) => f.id === initialFarmId);
        
        setFormData(prev => ({ 
          ...prev, 
          clerk_id: user?.id || "",
          farmer_id: initialFarmId, 
          region: selectedFarm?.location || "" 
        }));
      }
    } catch (error) {
      console.error("Failed to fetch farms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/credit-applications/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const result = await response.json();
        router.push(`/report/summary?id=${result.id}`);
      }
    } catch (_) {
      // Backend unavailable
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-green-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Credit Application</h1>
          <p className="text-gray-500 text-sm mt-1">Apply for a tailored agricultural loan using our AI-driven risk assessment.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 shadow-sm">
          <div className="p-6 space-y-6">

            {/* Farm Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Farm</label>
              <select 
                required
                className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors appearance-none cursor-pointer"
                value={formData.farmer_id}
                onChange={(e) => {
                  const selectedFarm = farms.find(f => f.id === e.target.value);
                  setFormData({ ...formData, farmer_id: e.target.value, region: selectedFarm?.location || "" });
                }}
              >
                <option value="" disabled>Choose a farm...</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name} ({farm.location})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Season</label>
                <select 
                  required
                  className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors appearance-none cursor-pointer"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                >
                  <option value="" disabled>Select season...</option>
                  <option value="kharif">Kharif (Jul – Oct)</option>
                  <option value="rabi">Rabi (Nov – Mar)</option>
                </select>
              </div>

              {/* Primary Crop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Crop</label>
                <select 
                  required
                  className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors appearance-none cursor-pointer"
                  value={formData.crop_type}
                  onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                >
                  <option value="" disabled>Select crop...</option>
                  <option value="rice">Rice</option>
                  <option value="wheat">Wheat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Amount (USD)</label>
                <input 
                  required
                  type="number" 
                  min="100"
                  placeholder="e.g. 5000"
                  className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors placeholder:text-gray-300"
                  value={formData.amount_requested || ""}
                  onChange={(e) => setFormData({ ...formData, amount_requested: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Loan Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose of Loan</label>
                <select 
                  required
                  className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors appearance-none cursor-pointer"
                  value={formData.loan_purpose}
                  onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
                >
                  {LOAN_PURPOSES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Insurance Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between py-1">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Crop Insurance</label>
                  <p className="text-xs text-gray-400 mt-0.5">Do you have existing insurance for your current crops?</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, has_insurance: !formData.has_insurance, insurance_type: !formData.has_insurance ? formData.insurance_type : "" })}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${formData.has_insurance ? 'bg-green-800' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${formData.has_insurance ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {formData.has_insurance && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Insurance Provider / Type</label>
                  <input 
                    required={formData.has_insurance}
                    type="text" 
                    placeholder="e.g. PMFBY Multipurpose"
                    className="w-full bg-white border border-gray-200 rounded px-4 py-2.5 text-sm focus:border-green-800 focus:ring-2 focus:ring-green-800/10 outline-none transition-colors placeholder:text-gray-300"
                    value={formData.insurance_type}
                    onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b">
            <button 
              type="submit"
              disabled={submitting || !formData.farmer_id}
              className={`w-full py-2.5 rounded text-sm font-semibold transition-colors ${
                submitting || !formData.farmer_id
                ? "bg-gray-100 text-gray-300 cursor-not-allowed" 
                : "bg-green-800 hover:bg-green-700 text-white"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : "Generate AI Risk Analysis"}
            </button>
          </div>
        </form>

        <p className="text-center mt-6 text-xs text-gray-400 flex items-center justify-center gap-1.5">
           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
           </svg>
           Processed in real-time by the AgriCredit ML Engine
        </p>
      </div>
    </div>
  );
}
