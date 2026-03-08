"use client";

import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    experience_years: 0,
    birthday: "",
    phone: "",
    national_id: "",
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchProfile = async () => {
    try {
      const clerkId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress || "";
      const response = await fetch(`${process.env.BACKEND_URL}/users/me?clerk_id=${clerkId}&email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          experience_years: data.experience_years || 0,
          birthday: data.birthday ? data.birthday.split("T")[0] : "",
          phone: data.phone || "",
          national_id: data.national_id || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload: any = {};
      if (formData.experience_years > 0) payload.experience_years = formData.experience_years;
      if (formData.birthday) payload.birthday = formData.birthday;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.national_id) payload.national_id = formData.national_id;

      const response = await fetch(`${process.env.BACKEND_URL}/users/me/profile?clerk_id=${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await response.json();
        console.error("Profile update failed:", err);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
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

  if (!isSignedIn) {
    return <RedirectToSignIn />;
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
            Farmer <span className="text-green-800">Profile</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Personal details used for credit assessments and verification.</p>
        </div>

        <div className="space-y-8 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-200 shadow-xl shadow-slate-200/50">
          
          {/* Experience & Birthday */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Years of Farming Experience</label>
              <input
                type="number"
                min="0"
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all text-slate-900"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
              />
              <p className="text-slate-300 text-xs mt-3 font-medium italic">How many total years have you been farming? Enter 0 if this is your first season.</p>
            </div>
            <div className="group">
              <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Birthday</label>
              <input
                type="date"
                min="1920-01-01"
                max={new Date().toISOString().split("T")[0]}
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all text-slate-900"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="group">
            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-green-800 transition-colors">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 text-lg font-bold focus:border-green-800 focus:bg-white outline-none transition-all text-slate-900 tracking-wider"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* National ID */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 text-green-800/5">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Aadhaar Card Number</label>
            <input
              type="text"
              placeholder="XXXX - XXXX - XXXX"
              className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 text-2xl font-black focus:border-green-800 focus:ring-4 focus:ring-green-50 transition-all placeholder:text-slate-100 tracking-widest text-slate-900"
              value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
            />
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
              disabled={saving}
              className={`flex-1 py-4 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl ${
                saving
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : saved
                  ? "bg-green-600 text-white"
                  : "bg-green-800 hover:bg-green-700 text-white hover:shadow-green-800/40 hover:-translate-y-1"
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : saved ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Profile Saved
                </span>
              ) : "Save Profile"}
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your personal data is encrypted and stored securely.
        </p>
      </div>
    </div>
  );
}
