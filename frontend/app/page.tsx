"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";

/* ── Scroll-reveal wrapper (subtle opacity only, no translate) ── */

function useVisible() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setShow(true); },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, show };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, show } = useVisible();
  return (
    <div
      ref={ref}
      className={`transition-opacity duration-600 ${show ? "opacity-100" : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Icon components (consistent 24x24, strokeWidth 1.5) ── */

function IconUser() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconLocation() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-5 h-5 text-green-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ── Page ── */

export default function Home() {
  return (
    <main className="bg-white">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="flex flex-col items-center justify-center text-center px-6 min-h-[calc(100vh-64px)] bg-gradient-to-b from-green-50/60 to-white">
        <div className="flex-1" />
        <h1 className="text-7xl sm:text-8xl lg:text-[10rem] font-extrabold leading-none pb-3 bg-gradient-to-r from-[#1a4a2e] to-[#d4a017] bg-clip-text text-transparent">
          Agricredit
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-400 font-normal tracking-[0.08em] max-w-lg">
          Your AI-powered Farm Risk Reports
        </p>
        <div className="flex-1" />

        <div className="pb-10 flex flex-col items-center gap-1 text-gray-400">
          <span className="text-xs tracking-wide">Scroll to explore</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
          </svg>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-20 lg:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-green-800 mb-2">Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-base text-gray-500 max-w-xl mb-16">
              Three steps from farm profile to a loan-ready risk report.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                icon: <IconUser />,
                title: "Create a farm profile",
                desc: "Enter your name, farm location, size, soil type, and irrigation setup. Takes under two minutes.",
              },
              {
                num: "02",
                icon: <IconLocation />,
                title: "Enter crop & location",
                desc: "Select your crop, season (Kharif / Rabi / Zaid), district, and state so our models pull the right data.",
              },
              {
                num: "03",
                icon: <IconReport />,
                title: "Receive a risk report",
                desc: "Get a clear Low / Medium / High risk score with plain-language explanations, ready to share with any lender.",
              },
            ].map((s) => (
              <Reveal key={s.num}>
                <div className="border border-gray-200 rounded bg-white p-6 h-full hover:border-green-700/40 transition-colors duration-200">
                  <span className="inline-block text-xs font-bold text-green-800 bg-green-50 px-2.5 py-1 rounded mb-4">
                    Step {s.num}
                  </span>
                  <div className="text-green-800 mb-4">{s.icon}</div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY AGRICREDIT ═══════════════ */}
      <section className="py-20 lg:py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-green-800 mb-2">Benefits</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why AgriCredit</h2>
            <p className="text-base text-gray-500 max-w-xl mb-16">
              Traditional credit scoring fails agriculture. We built an alternative that works.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Helps farmers without credit history",
                desc: "Over 80% of small Indian farmers lack formal credit records. AgriCredit uses farm-level environmental and market data instead.",
              },
              {
                title: "Uses weather, crop & market data",
                desc: "We pull IMD monsoon forecasts, ICRISAT yield records, SPEI drought indices, and AgMarkNet commodity prices automatically.",
              },
              {
                title: "Provides transparent AI explanations",
                desc: "Every risk score includes a plain-language breakdown of contributing factors, so farmers and lenders both understand the reasoning.",
              },
              {
                title: "Helps lenders make smarter decisions",
                desc: "Banks and NBFCs get data-driven risk profiles, reducing NPAs and enabling confident agricultural lending at scale.",
              },
            ].map((b) => (
              <Reveal key={b.title}>
                <div className="border border-gray-200 rounded bg-white p-6 h-full">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ BUILT FOR FARMERS & LENDERS ═══════════════ */}
      <section className="py-20 lg:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-green-800 mb-2">Platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Built for Farmers & Lenders</h2>
            <p className="text-base text-gray-500 max-w-xl mb-16">
              One platform that bridges the trust gap between those who grow and those who fund.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Reveal>
              <div className="border border-green-200 bg-green-50/50 rounded p-6 h-full">
                <h3 className="text-lg font-bold text-gray-900 mb-6">For Farmers</h3>
                <ul className="space-y-4">
                  {[
                    "Understand seasonal risks before you plant",
                    "Access fairer loan opportunities without a credit history",
                    "Simple explanations in plain language — no jargon",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <IconCheck />
                      <span className="text-sm text-gray-700 leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal>
              <div className="border border-gray-200 bg-white rounded p-6 h-full">
                <h3 className="text-lg font-bold text-gray-900 mb-6">For Lenders</h3>
                <ul className="space-y-4">
                  {[
                    "Better agricultural risk evaluation backed by real data",
                    "Data-driven underwriting to reduce NPAs on farm loans",
                    "Portfolio risk insights across districts and seasons",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <IconCheck />
                      <span className="text-sm text-gray-700 leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ QUANTITATIVE ANALYSIS ═══════════════ */}
      <section className="py-20 lg:py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-green-800 mb-2">Analytics</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Quantitative Risk Analysis</h2>
            <p className="text-base text-gray-500 max-w-xl mb-16">
              Data-driven insights that give lenders the confidence to underwrite agricultural loans at scale.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {[
              { value: "500+", label: "Districts Covered" },
              { value: "94.2%", label: "Model Accuracy" },
              { value: "< 2 min", label: "Assessment Time" },
              { value: "12,400+", label: "Reports Generated" },
            ].map((m) => (
              <Reveal key={m.label}>
                <div className="border border-gray-200 bg-white rounded p-4 text-center">
                  <p className="text-2xl font-bold text-green-800 mb-1">{m.value}</p>
                  <p className="text-xs text-gray-500">{m.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: "Regional Risk Heatmap",
                desc: "District-level drought and yield risk visualization across all major agricultural regions.",
              },
              {
                title: "Seasonal Trend Analysis",
                desc: "Historical crop performance and weather pattern trends across Kharif, Rabi, and Zaid seasons.",
              },
              {
                title: "Portfolio Risk Distribution",
                desc: "Aggregate risk scoring across your lending portfolio with breakdown by region, crop, and season.",
              },
            ].map((c) => (
              <Reveal key={c.title}>
                <div className="border border-gray-200 bg-white rounded p-6 h-full">
                  <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center mb-4">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Chart</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-20 lg:py-24 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ready to assess your farm&apos;s risk?
            </h2>
            <p className="text-base text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
              Create your farm profile in under two minutes and receive an AI-powered risk report that could help you access better loan terms.
            </p>
            <Link
              href="/role"
              className="inline-flex items-center gap-2 rounded bg-green-800 px-8 py-3 text-base font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 20h10" />
                  <path d="M12 20V10" />
                  <path d="M12 10c-2-3-6-4-6-8 4 0 6 3 6 3s2-3 6-3c0 4-4 5-6 8z" fill="currentColor" stroke="none" />
                </svg>
                <span className="text-sm font-bold text-gray-900">AgriCredit</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                Turning agricultural data into financial opportunity for Indian farmers.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Product</p>
              <ul className="space-y-2">
                <li><Link href="/role" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Get Started</Link></li>
                <li><Link href="/map" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Map</Link></li>
                <li><Link href="/farm" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Farm Profile</Link></li>
                <li><Link href="/lender" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Lender Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Legal</p>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-500">Privacy Policy</span></li>
                <li><span className="text-sm text-gray-500">Children&apos;s Privacy</span></li>
                <li><span className="text-sm text-gray-500">Security</span></li>
                <li><span className="text-sm text-gray-500">Terms of Service</span></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">Company</p>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-500">Contact Us</span></li>
                <li><span className="text-sm text-gray-500">Locations</span></li>
                <li><span className="text-sm text-gray-500">About</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} AgriCredit. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Privacy</span>
              <span className="text-xs text-gray-400">Terms</span>
              <span className="text-xs text-gray-400">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
