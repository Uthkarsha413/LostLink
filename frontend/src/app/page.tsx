
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<{
    fullName: string;
    email: string;
    roles: string[];
  } | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const result = await res.json();
        if (res.ok && result.success) setUser(result.data);
      } catch {
        setUser(null);
      }
    }
    checkSession();
  }, []);

  const stats = [
    { label: "Items Recovered", value: "1,200+", icon: "✅" },
    { label: "Active Reports", value: "340+", icon: "📋" },
    { label: "AI Accuracy", value: "94%", icon: "🧠" },
    { label: "Campus Users", value: "3,000+", icon: "🎓" },
  ];

  const features = [
    {
      icon: "📊",
      title: "Smart Analytics",
      desc: "Real-time campus KPIs, monthly trends, recovery rates and category breakdowns with live SQL aggregation.",
      href: "/admin/analytics",
      color: "cyan",
      cta: "View Dashboard",
    },
    {
      icon: "📍",
      title: "9-Stage Tracking",
      desc: "Full item lifecycle from submission through AI match, review, OTP generation, dual confirmation and recovery.",
      href: "/my-reports",
      color: "violet",
      cta: "Track Reports",
    },
    {
      icon: "🔐",
      title: "Secure OTP Handover",
      desc: "SHA-256 hashed 6-digit OTP with 10-min expiry, rate limiting, and dual physical confirmation before recovery.",
      href: "/claims",
      color: "emerald",
      cta: "View Claims",
    },
    {
      icon: "🤖",
      title: "AI-Powered Matching",
      desc: "Visual CLIP embeddings + semantic vector search to find matches across image content, description and metadata.",
      href: "/matches",
      color: "blue",
      cta: "Browse Matches",
    },
    {
      icon: "📸",
      title: "Report an Item",
      desc: "Submit lost or found reports with photos, item details, campus location, and date – in under 2 minutes.",
      href: "/report",
      color: "amber",
      cta: "Report Item",
    },
    {
      icon: "🔔",
      title: "Notifications",
      desc: "Get alerted when a potential match is found, a claim is reviewed, or your handover OTP is ready to use.",
      href: "/notifications",
      color: "pink",
      cta: "View Updates",
    },
  ];

  const steps = [
    {
      num: "01",
      icon: "📸",
      title: "Report It",
      desc: "Submit a lost or found report with photos and item details. Takes under 2 minutes.",
    },
    {
      num: "02",
      icon: "🤖",
      title: "AI Discovers",
      desc: "Our visual and semantic AI engine automatically scans for matches across all reports.",
    },
    {
      num: "03",
      icon: "✅",
      title: "Verify & Recover",
      desc: "Prove ownership, get admin approval, verify OTP with the finder, and collect your item.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" />
          <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
            </span>
            PES University · RR Campus · AI-Powered
          </div>

          {/* Headline */}
          <h1 className={`mt-7 text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-8xl transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Lost something?
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Let AI find it.
            </span>
          </h1>

          <p className={`mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Not another lost & found board. An intelligent platform that reconnects people with their
            belongings through visual AI, semantic matching, and cryptographic verification.
          </p>

          {/* CTA Buttons */}
          <div className={`mt-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <Link
              href="/report"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-7 py-3.5 text-sm font-black text-white shadow-2xl shadow-cyan-500/30 transition-all hover:scale-[1.03] hover:shadow-cyan-500/50 active:scale-95"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span>📸</span>
              <span>Report an Item</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            <Link
              href="/matches"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-7 py-3.5 text-sm font-bold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 hover:scale-[1.02] active:scale-95"
            >
              <span>🔍</span>
              <span>Browse AI Matches</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className={`mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
            {["🔒 End-to-end OTP verification", "🤖 Visual AI matching engine", "🛡️ Admin-reviewed claims"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">{t}</span>
            ))}
          </div>

          {/* Stats Row */}
          <div className={`mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 transition-all duration-700 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
                <div className="text-2xl">{s.icon}</div>
                <div className="mt-2 text-2xl font-black text-white">{s.value}</div>
                <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs text-slate-600 animate-bounce">
          <span>scroll</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━ QUICK SEARCH ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-16 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">🔎 Quick Search</span>
          <h2 className="mt-3 text-3xl font-black text-white">Looking for something?</h2>
          <p className="mt-2 text-sm text-slate-400">Search all reported lost & found items on campus.</p>

          <form action="/matches" method="GET" className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 shadow-lg focus-within:border-cyan-500/60 transition-colors">
            <svg className="shrink-0 text-slate-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Try 'black wallet', 'AirPods', 'PES ID card'..."
              aria-label="Search reported items"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-white hover:brightness-110 transition-all"
            >
              Search →
            </button>
          </form>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━ ALL FEATURES GRID ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-300">
              ✦ Smart Campus Ecosystem
            </span>
            <h2 className="mt-5 text-4xl font-black text-white sm:text-5xl">
              Everything you need.
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Built for PES.</span>
            </h2>
            <p className="mt-4 text-sm text-slate-400 max-w-lg mx-auto">
              From AI-powered matching to cryptographic handovers — LostLink is a complete lost & found management platform.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const colorMap: Record<string, { border: string; iconBg: string; iconText: string; glow: string; ctaText: string }> = {
                cyan:    { border: "hover:border-cyan-500/40",    iconBg: "bg-cyan-500/10",    iconText: "text-cyan-400",    glow: "hover:shadow-cyan-500/10",    ctaText: "text-cyan-400" },
                violet:  { border: "hover:border-violet-500/40",  iconBg: "bg-violet-500/10",  iconText: "text-violet-400",  glow: "hover:shadow-violet-500/10",  ctaText: "text-violet-400" },
                emerald: { border: "hover:border-emerald-500/40", iconBg: "bg-emerald-500/10", iconText: "text-emerald-400", glow: "hover:shadow-emerald-500/10", ctaText: "text-emerald-400" },
                blue:    { border: "hover:border-blue-500/40",    iconBg: "bg-blue-500/10",    iconText: "text-blue-400",    glow: "hover:shadow-blue-500/10",    ctaText: "text-blue-400" },
                amber:   { border: "hover:border-amber-500/40",   iconBg: "bg-amber-500/10",   iconText: "text-amber-400",   glow: "hover:shadow-amber-500/10",   ctaText: "text-amber-400" },
                pink:    { border: "hover:border-pink-500/40",    iconBg: "bg-pink-500/10",    iconText: "text-pink-400",    glow: "hover:shadow-pink-500/10",    ctaText: "text-pink-400" },
              };
              const c = colorMap[f.color];
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className={`group relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${c.border} ${c.glow}`}
                >
                  <div className={`flex h-13 w-13 items-center justify-center rounded-xl ${c.iconBg} text-3xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    {f.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-black text-white">{f.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{f.desc}</p>
                  <div className={`mt-5 flex items-center gap-1.5 text-xs font-bold ${c.ctaText}`}>
                    <span>{f.cta}</span>
                    <span className="transition-transform group-hover:translate-x-1.5">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how" className="relative py-24 px-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">⚡ How It Works</span>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">
              Lost to found in <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">3 steps.</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-slate-700">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-4xl">{s.icon}</span>
                  <span className="text-5xl font-black text-slate-800 group-hover:text-slate-700 transition-colors">{s.num}</span>
                </div>
                <h3 className="text-xl font-black text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                {/* Gradient line at bottom */}
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {/* Connector line for desktop */}
          <div className="hidden md:flex items-center justify-center gap-0 mt-0 absolute top-[calc(50%+2rem)] left-1/2 -translate-x-1/2 w-full max-w-5xl pointer-events-none opacity-20">
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━ AI TECH SECTION ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
            <div className="grid md:grid-cols-2">
              {/* Left */}
              <div className="p-10 lg:p-14">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">🧠 Under The Hood</span>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  AI that understands <span className="text-indigo-400">more than words.</span>
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-400">
                  LostLink uses CLIP visual embeddings, semantic vector search via Qdrant, and structured
                  attribute scoring to surface matches that text search alone would miss.
                </p>
                <Link
                  href="/matches"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-2.5 text-sm font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
                >
                  Explore AI Matches →
                </Link>
              </div>
              {/* Right — tech list */}
              <div className="border-t border-slate-800 p-10 md:border-l md:border-t-0 lg:p-14">
                <div className="space-y-5">
                  {[
                    { icon: "👁️", title: "Visual Intelligence", desc: "CLIP image embeddings understand appearance, colour, and shape." },
                    { icon: "💬", title: "Semantic Search", desc: "Vector similarity compares meaning, not just exact keywords." },
                    { icon: "🛡️", title: "Trust-first Verification", desc: "Admins make all final decisions. AI only assists." },
                  ].map((t) => (
                    <div key={t.title} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">{t.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-white">{t.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━ FINAL CTA ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950/60 p-16">
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">🏫 Your Campus. One Community.</span>
              <h2 className="mt-5 text-4xl font-black text-white sm:text-5xl">
                Let&apos;s bring lost things <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">back home.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-sm text-slate-400">
                One report could be the connection someone is waiting for. Join 3,000+ PES students already on LostLink.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {user ? (
                  <Link href="/report" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 hover:scale-[1.03] transition-all">
                    <span>📸</span> Report an Item →
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-cyan-500/30 hover:scale-[1.03] transition-all">
                      <span>🚀</span> Get Started →
                    </Link>
                    <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-8 py-3.5 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-all">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━ FOOTER ━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-slate-800/60 py-10 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="group">
            <img
              src="/lostlink-logo-white.png"
              alt="LostLink"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
          <p className="text-xs text-slate-500">Intelligent discovery. Meaningful reunions.</p>
          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">
            <Link href="/about" className="hover:text-slate-300 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
            <Link href="/matches" className="hover:text-slate-300 transition-colors">Explore</Link>
            <span>© 2026 LostLink · PES University</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
