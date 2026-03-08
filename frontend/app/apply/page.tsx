"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { VoiceInput } from "../../components/VoiceInput";
import { useVoiceContext } from "../../components/VoiceProvider";

const LOAN_PURPOSES = [
  { id: "seeds", label: "Seeds & Sowing बीज ਬੀਜ" },
  { id: "machines", label: "Machinery & Equipment मशीनें ਮਸ਼ੀਨਾਂ ट्रैक्टर" },
  { id: "fertilizers", label: "Fertilizers & Pesticides उर्वरक ਖਾद कीटनाशक" },
  { id: "labor", label: "Labor Costs श्रम ਮਜ਼ਦੂਰੀ" },
  { id: "irrigation", label: "Irrigation Systems सिंचाई ਸਿੰਚਾਈ पानी" },
  { id: "other", label: "Other Operational Needs अन्य ਹੋਰ" },
];

export default function CreditApplicationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
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
  const { lang, isVoiceEnabled } = useVoiceContext();

  const t = {
    hi: {
      title: "क्रेडिट आवेदन",
      subtitle: "हमारे एआई-ड्रिवन जोखिम मूल्यांकन का उपयोग करके एक अनुकूलित कृषि ऋण के लिए आवेदन करें।",
      submit: "एआई जोखिम विश्लेषण उत्पन्न करें",
      processing: "विश्लेषण संसाधित कर रहा है...",
      data_security: "आपका डेटा एग्रीक्रेडिट एमएल इंजन द्वारा वास्तविक समय में संसाधित किया जाता है।"
    },
    pa: {
      title: "ਕ੍ਰੈਡਿਟ ਐਪਲੀਕੇਸ਼ਨ",
      subtitle: "ਸਾਡੇ AI-ਸੰਚਾਲਿਤ ਜੋਖਮ ਮੁਲਾਂਕਣ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਇੱਕ ਅਨੁਕੂਲਿਤ ਖੇਤੀਬਾੜੀ ਲੋਨ ਲਈ ਅਪਲਾਈ ਕਰੋ।",
      submit: "AI ਜੋਖਮ ਵਿਸ਼ਲੇਸ਼ਣ ਤਿਆਰ ਕਰੋ",
      processing: "ਵਿਸ਼ਲੇਸ਼ਣ ਦੀ ਪ੍ਰਕਿਰਿਆ ਜਾਰੀ ਹੈ...",
      data_security: "ਤੁਹਾਡਾ ਡੇਟਾ ਐਗਰੀਕ੍ਰੇਡਿਟ ML ਇੰਜਣ ਦੁਆਰਾ ਰੀਅਲ-ਟਾਈਮ ਵਿੱਚ ਪ੍ਰੋਸੈਸ ਕੀਤਾ ਜਾਂਦਾ ਹੈ।"
    },
    en: {
      title: "Credit Application",
      subtitle: "Apply for a tailored agricultural loan using our AI-driven risk assessment.",
      submit: "Generate AI Risk Analysis",
      processing: "Processing Analysis...",
      data_security: "Your data is processed in real-time by the AgriCredit ML Engine."
    }
  }[lang as 'hi' | 'pa' | 'en'] || {
    title: "Credit Application",
    subtitle: "Apply for a tailored agricultural loan using our AI-driven risk assessment.",
    submit: "Generate AI Risk Analysis",
    processing: "Processing Analysis...",
    data_security: "Your data is processed in real-time by the AgriCredit ML Engine."
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetchFarms();
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchFarms = async () => {
    try {
      const clerkId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress || "";
      const response = await fetch(`http://localhost:8000/users/me?clerk_id=${clerkId}&email=${email}`);
      if (response.ok) {
        const data = await response.json();
        const userFarms = data.farms || [];
        setFarms(userFarms);
        
        // Handle pre-selection from URL or default to first
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
      const response = await fetch(`http://localhost:8000/credit-applications/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const result = await response.json();
        router.push(`/report/summary?id=${result.id}`);
      } else {
        const err = await response.json();
        console.error("Submission failed:", err);
      }
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-green-500/30">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <Link href="/dashboard" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-green-600 transition-colors flex items-center gap-2 mb-6">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black tracking-tight uppercase italic">{t.title.split(' ')[0]} <span className="text-green-600">{t.title.split(' ')[1] || ""}</span></h1>
          <p className="text-slate-500 mt-2 font-medium">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          
          {/* Farm Selection */}
          <div className="group">
            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-600 transition-colors">Select Farm</label>
            <select 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Season */}
            <VoiceInput
              label="Season"
              name="season"
              context="inputs"
              lang={lang}
              value={formData.season}
              onChange={(e: any) => setFormData({ ...formData, season: e.target.value })}
              className=""
              placeholder=""
              labelClassName=""
              options={[
                { value: "kharif", label: "Kharif (Jul – Oct) खरीफ ਸਾਉਣੀ" },
                { value: "rabi", label: "Rabi (Nov – Mar) रबी ਹਾੜੀ" }
              ]}
            />

            {/* Primary Crop */}
            <VoiceInput
              label="Primary Crop"
              name="crop_type"
              context="inputs"
              lang={lang}
              value={formData.crop_type}
              onChange={(e: any) => setFormData({ ...formData, crop_type: e.target.value })}
              className=""
              placeholder=""
              labelClassName=""
              options={[
                { value: "rice", label: "Rice चावल ਚਾਵਲ ਝੋਨਾ" },
                { value: "wheat", label: "Wheat गेहूं ਕਣਕ" }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Loan Amount */}
            <VoiceInput
              label="Loan Amount Desired ($)"
              name="amount_requested"
              context="inputs"
              lang={lang}
              value={formData.amount_requested || ""}
              onChange={(e: any) => setFormData({ ...formData, amount_requested: parseFloat(e.target.value) || 0 })}
              className=""
              placeholder=""
              labelClassName=""
              options={null}
            />

            {/* Loan Purpose */}
            <VoiceInput
              label="Purpose of Loan"
              name="loan_purpose"
              context="inputs"
              lang={lang}
              value={formData.loan_purpose}
              onChange={(e: any) => setFormData({ ...formData, loan_purpose: e.target.value })}
              className=""
              placeholder=""
              labelClassName=""
              options={LOAN_PURPOSES.map(p => ({ value: p.id, label: p.label }))}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            {/* Insurance Toggle */}
            <div className="flex items-center justify-between group py-2">
              <div>
                <label className="block text-sm font-black text-slate-800 uppercase tracking-tight">Crop Insurance</label>
                <p className="text-xs text-slate-400 font-medium mt-1">Do you have existing insurance for your current crops?</p>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, has_insurance: !formData.has_insurance, insurance_type: !formData.has_insurance ? formData.insurance_type : "" })}
                className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${formData.has_insurance ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${formData.has_insurance ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Insurance Type - Conditional */}
            {formData.has_insurance && (
              <div className="mt-6 group animate-in fade-in slide-in-from-top-2 duration-300">
                <VoiceInput
                  label="Insurance Provider/Type"
                  name="insurance_type"
                  context="inputs"
                  lang={lang}
                  options={null}
                  value={formData.insurance_type}
                  onChange={(e: any) => setFormData({ ...formData, insurance_type: e.target.value })}
                  placeholder="e.g. PMFBY Multipurpose"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-500 focus:bg-white outline-none transition-all"
                  labelClassName="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-green-600 transition-colors"
                />
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={submitting || !formData.farmer_id}
            className={`w-full py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-2xl mt-8 ${
              submitting || !formData.farmer_id
              ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-500 text-white hover:shadow-green-600/40 hover:-translate-y-1"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t.processing}
              </span>
            ) : t.submit}
          </button>
        </form>

        <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
           </svg>
            {t.data_security}
        </p>
      </div>
    </div>
  );
}
