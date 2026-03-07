"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Farm {
  id: string;
  name: string;
  location: string;
  farm_size_hectares: number;
  soil_category: string;
  primary_crop?: string;
}

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFarms() {
      if (!isLoaded || !isSignedIn) return;
      try {
        const response = await fetch(`http://localhost:8000/users/me?clerk_id=${user.id}&email=${user.primaryEmailAddress?.emailAddress || ""}`);
        if (response.ok) {
          const userData = await response.json();
          setFarms(userData.farms || []);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFarms();
  }, [isLoaded, isSignedIn, user?.id]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-8 text-lg">Please sign in to view your agricultural dashboard.</p>
          <Link href="/" className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl transition-all">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 sm:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">My Agricultural Portfolio</h1>
            <p className="text-slate-500 font-medium">Monitoring {farms.length} active farm profiles</p>
          </div>
          <Link 
            href="/farm" 
            className="group flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 font-black px-6 py-3 rounded-xl transition-all hover:-translate-y-1 shadow-xl shadow-green-500/20"
          >
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            ADD NEW FARM
          </Link>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-900/50 rounded-3xl border border-slate-800 animate-pulse"></div>
            ))}
          </div>
        ) : farms.length === 0 ? (
          <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem] p-24 text-center">
            <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-green-500/20">
               <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 012.5 2.5v.5m-1.5 1.5l1.5 1.5m-7.493 2.5a2 2 0 110-4 2 2 0 010 4z" />
               </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">No Farms Registered</h2>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto text-lg font-medium">You haven&apos;t created any farm profiles yet. Onboard your first farm to unlock credit analysis.</p>
            <Link href="/farm" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-10 rounded-2xl transition-all border border-slate-700">
               START ONBOARDING
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {farms.map((farm) => (
              <Link 
                key={farm.id} 
                href={`/report?id=${farm.id}`}
                className="group relative bg-slate-900/50 rounded-[2.5rem] border border-slate-800 p-8 hover:border-green-500 transition-all hover:bg-slate-900 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 translate-x-4 -translate-y-4">
                   <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                </div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center ring-1 ring-green-500/30">
                     <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                     </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">Verified Profile</span>
                </div>

                <h3 className="text-2xl font-black mb-1 group-hover:text-green-400 transition-colors uppercase tracking-tight">{farm.name}</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-6">{farm.location}</p>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                   <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                      <span className="block text-[10px] font-black text-slate-600 uppercase mb-1">Scale</span>
                      <span className="text-lg font-bold text-slate-300">{farm.farm_size_hectares} HA</span>
                   </div>
                   <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                      <span className="block text-[10px] font-black text-slate-600 uppercase mb-1">Soil Type</span>
                      <span className="text-lg font-bold text-slate-300 capitalize">{farm.soil_category}</span>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                   <span className="text-xs font-bold text-green-500/80 uppercase">AI Score: 92/100</span>
                   <svg className="w-5 h-5 text-slate-700 group-hover:text-green-500 transition-all group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
