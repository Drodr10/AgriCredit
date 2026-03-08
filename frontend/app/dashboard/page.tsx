"use client";

import { useUser, RedirectToSignIn } from "@clerk/nextjs";
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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded || !isSignedIn) return;
      try {
        const response = await fetch(`http://localhost:8000/users/me?clerk_id=${user.id}&email=${user.primaryEmailAddress?.emailAddress || ""}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [isLoaded, isSignedIn, user?.id]);

  if (!isLoaded || loading) return null;

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const role = userData?.role;

  if (role === "admin") return <AdminView userData={userData} />;
  return <FarmerView farms={userData?.farms || []} setUserData={setUserData} clerkId={user.id} />;
}

function FarmerView({ farms, setUserData, clerkId }: { farms: Farm[], setUserData: any, clerkId: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteFarm = async (farmId: string, farmName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${farmName}? This will also delete ALL credit reports permanently.`)) {
      return;
    }

    setDeletingId(farmId);
    try {
      const res = await fetch(`http://localhost:8000/users/me/farms/${farmId}?clerk_id=${clerkId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete farm");

      setUserData((prev: any) => ({
        ...prev,
        farms: prev.farms.filter((f: Farm) => f.id !== farmId),
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to delete the farm. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/60 to-white text-slate-900 p-8 sm:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase bg-gradient-to-r from-[#1a4a2e] to-[#d4a017] bg-clip-text text-transparent">
              Farmer <span className="italic">Portfolio</span>
            </h1>
            <p className="text-slate-400 font-medium font-mono uppercase tracking-[0.2em]">Monitoring {farms.length} active farm profiles</p>
          </div>
          <div className="flex items-center gap-3">
            {farms.length > 0 && (
              <>
                <Link 
                  href="/reports" 
                  className="group flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-black px-6 py-3 rounded-xl transition-all border border-gray-200 shadow-sm hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ALL REPORTS
                </Link>
                <Link 
                  href="/apply" 
                  className="group flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-black px-6 py-3 rounded-xl transition-all border border-gray-200 shadow-sm hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  APPLY FOR CREDIT
                </Link>
              </>
            )}

            <Link 
              href="/farm" 
              className="group flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl transition-all hover:-translate-y-1 shadow-xl shadow-green-800/20"
            >
              <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              ADD NEW FARM
            </Link>
          </div>
        </header>

        {farms.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-[3rem] p-24 text-center">
            <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-green-100">
               <svg className="w-10 h-10 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 012.5 2.5v.5m-1.5 1.5l1.5 1.5m-7.493 2.5a2 2 0 110-4 2 2 0 010 4z" />
               </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900">No Farms Registered</h2>
            <p className="text-slate-400 mb-10 max-w-sm mx-auto text-lg font-medium uppercase tracking-tight">Onboard your first farm to unlock specialized credit analysis.</p>
            <Link href="/farm" className="inline-block bg-white hover:bg-slate-50 text-slate-900 font-black py-4 px-10 rounded-2xl transition-all border border-gray-200 uppercase tracking-widest shadow-sm">
               START ONBOARDING
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {farms.map((farm) => (
              <div 
                key={farm.id} 
                className="group relative bg-white rounded-[2.5rem] border border-gray-200 p-8 hover:border-green-700/40 transition-all hover:bg-slate-50 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 translate-x-4 -translate-y-4 text-green-800">
                   <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                   </svg>
                </div>
                
                <div className="flex justify-between items-start mb-6 text-green-800">
                  <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center ring-1 ring-green-100">
                     <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                     </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-200 text-gray-400">Verified Profile</span>
                </div>

                <Link href={`/farm/edit?id=${farm.id}`} className="block group/title">
                  <h3 className="text-2xl font-black mb-1 group-hover/title:text-green-800 transition-colors uppercase tracking-tight text-slate-900">{farm.name}</h3>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6">{farm.location}</p>
                </Link>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Scale</span>
                      <span className="text-lg font-bold text-slate-900">{farm.farm_size_hectares} HA</span>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Soil Type</span>
                      <span className="text-lg font-bold text-slate-900 capitalize">{farm.soil_category}</span>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <Link 
                       href={`/apply?farmId=${farm.id}`}
                       className="text-xs font-black text-slate-900 hover:text-green-800 transition-colors uppercase flex items-center gap-1"
                     >
                       APPLY FOR CREDIT
                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                       </svg>
                     </Link>
                     <Link 
                       href={`/report/${farm.id}`}
                       className="text-xs font-black text-slate-400 hover:text-green-800 transition-colors uppercase flex items-center gap-1"
                     >
                       VIEW REPORTS
                     </Link>
                   </div>
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => handleDeleteFarm(farm.id, farm.name)}
                       disabled={deletingId === farm.id}
                       className="text-slate-300 hover:text-red-600 transition-all p-2 hover:bg-red-50 rounded-full cursor-pointer disabled:opacity-50"
                       title="Delete Farm"
                     >
                       {deletingId === farm.id ? (
                         <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                       )}
                     </button>
                     <Link href={`/farm/edit?id=${farm.id}`} className="text-slate-300 hover:text-green-800 transition-all p-2 hover:bg-green-50 rounded-full inline-block">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                     </Link>
                   </div>
                 </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminView({ userData }: { userData: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-slate-900 p-8 sm:p-12 font-sans relative">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-black tracking-tighter mb-4 uppercase bg-gradient-to-r from-gray-900 to-slate-600 bg-clip-text text-transparent">
            Admin <span className="italic text-red-600">Terminal</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg font-mono uppercase tracking-[0.2em]">System Monitoring & User Management</p>
        </header>

        <div className="bg-white border-2 border-dashed border-gray-200 rounded-[3rem] p-24 text-center shadow-sm">
          <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-red-100">
             <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
             </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-slate-900">System Console Active</h2>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto text-lg font-medium uppercase tracking-tight">
             Logged in as {userData?.email}. Monitoring system-wide agricultural data flows.
          </p>
        </div>
      </div>
    </div>
  );
}
