"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface AnalyticsKPIs {
  totalLost: number; totalFound: number; activeReports: number; pendingClaims: number;
  approvedClaims: number; recoveredItems: number; rejectedClaims: number; unclaimedItems: number;
  totalReports: number; totalClaims: number;
}
interface TrendPoint { label: string; lost: number; found: number; total: number; }
interface CategoryPoint { name: string; value: number; lost_count: number; found_count: number; }
interface LocationPoint { name: string; count: number; lost: number; found: number; }
interface ClaimStat { status: string; count: number; }
interface AnalyticsData {
  filter: { range: string; rangeLabel: string; startDate: string; endDate: string; };
  kpis: AnalyticsKPIs;
  charts: {
    lostVsFound: Array<{ report_type: string; count: number; active_count: number; closed_count: number; }>;
    trends: TrendPoint[];
    categories: CategoryPoint[];
    recovery: { recovered: number; unresolved: number; rejected: number; recoveryRate: number; };
    locations: LocationPoint[];
    claims: ClaimStat[];
  };
}

const CAT_COLORS = ["#06b6d4","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#64748b"];

export default function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadAnalytics = useCallback(async (selectedRange: string, start?: string, end?: string) => {
    try {
      setLoading(true); setError("");
      const params = new URLSearchParams({ range: selectedRange });
      if (selectedRange === "custom" && start && end) { params.set("startDate", start); params.set("endDate", end); }
      const res = await fetch(`/api/admin/analytics?${params.toString()}`, { cache: "no-store" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to load analytics");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAnalytics(range, startDate, endDate); }, [loadAnalytics, range, startDate, endDate]);

  function handleCustomFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) { alert("Please select both start and end dates."); return; }
    setRange("custom");
    loadAnalytics("custom", startDate, endDate);
  }

  const kpiCards = data ? [
    { label: "Total Lost", value: data.kpis.totalLost, icon: "🔍", color: "rose" },
    { label: "Total Found", value: data.kpis.totalFound, icon: "📦", color: "teal" },
    { label: "Active Reports", value: data.kpis.activeReports, icon: "⚡", color: "blue" },
    { label: "Recovered Items", value: data.kpis.recoveredItems, icon: "✅", color: "emerald" },
    { label: "Pending Claims", value: data.kpis.pendingClaims, icon: "⏳", color: "amber" },
    { label: "Approved Claims", value: data.kpis.approvedClaims, icon: "🔑", color: "cyan" },
    { label: "Rejected Claims", value: data.kpis.rejectedClaims, icon: "✕", color: "slate" },
    { label: "Unclaimed Items", value: data.kpis.unclaimedItems, icon: "📭", color: "purple" },
  ] : [];

  function colorClass(color: string, type: "border" | "text" | "bg") {
    const map: Record<string, Record<string, string>> = {
      rose: { border: "border-rose-900/40", text: "text-rose-400", bg: "bg-rose-950/10" },
      teal: { border: "border-teal-900/40", text: "text-teal-400", bg: "bg-teal-950/10" },
      blue: { border: "border-blue-900/40", text: "text-blue-400", bg: "bg-blue-950/10" },
      emerald: { border: "border-emerald-800", text: "text-emerald-400", bg: "bg-emerald-950/20" },
      amber: { border: "border-amber-900/40", text: "text-amber-400", bg: "bg-amber-950/10" },
      cyan: { border: "border-cyan-900/40", text: "text-cyan-400", bg: "bg-cyan-950/10" },
      slate: { border: "border-slate-700", text: "text-slate-400", bg: "bg-slate-800/40" },
      purple: { border: "border-purple-900/40", text: "text-purple-400", bg: "bg-purple-950/10" },
    };
    return map[color]?.[type] ?? "";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/4 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
                📊 LostLink · Smart Campus Analytics
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                  Analytics Dashboard
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Real-time MySQL aggregations, recovery statistics, location hot spots, and trend analysis for PES University RR Campus.
              </p>
            </div>

            {/* Nav tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
              <Link href="/admin" className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                📋 Claims Review
              </Link>
              <span className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md">
                📊 Analytics
              </span>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">📅 Timeframe:</span>
              {[
                { key: "today", label: "Today" },
                { key: "7d", label: "7 Days" },
                { key: "30d", label: "30 Days" },
                { key: "semester", label: "Semester" },
                { key: "all", label: "All Time" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRange(f.key)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    range === f.key
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm shadow-cyan-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomFilterSubmit} className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-600 border border-cyan-700 px-3 py-1.5 font-bold text-white hover:bg-cyan-500 transition-all"
              >
                Apply
              </button>
            </form>
          </div>
        </header>

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-16 text-center text-slate-400">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-4 font-semibold text-slate-300">Computing analytics from MySQL...</p>
            <p className="mt-1 text-xs text-slate-500">Running aggregation queries across all tables</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-6 text-red-300">
            <h3 className="font-bold text-red-200">❌ Unable to load analytics</h3>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* ANALYTICS CONTENT */}
        {!loading && !error && data && (
          <div className="space-y-8">
            {/* Range label badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-cyan-700/50 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300">
                📅 {data.filter.rangeLabel}
              </span>
              <span className="text-xs text-slate-500">
                {data.filter.startDate} → {data.filter.endDate}
              </span>
            </div>

            {/* KPI CARDS */}
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {kpiCards.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-2xl border p-5 backdrop-blur transition-all hover:scale-[1.02] ${colorClass(kpi.color, "border")} ${colorClass(kpi.color, "bg")} bg-slate-900/70`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${colorClass(kpi.color, "text")}`}>
                      {kpi.label}
                    </span>
                    <span className="text-lg">{kpi.icon}</span>
                  </div>
                  <div className={`text-3xl font-black ${colorClass(kpi.color, "text")}`}>{kpi.value}</div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
                        kpi.color === "emerald" ? "from-emerald-600 to-emerald-400" :
                        kpi.color === "cyan" ? "from-cyan-600 to-cyan-400" :
                        kpi.color === "blue" ? "from-blue-600 to-blue-400" :
                        kpi.color === "amber" ? "from-amber-600 to-amber-400" :
                        kpi.color === "rose" ? "from-rose-600 to-rose-400" :
                        kpi.color === "teal" ? "from-teal-600 to-teal-400" :
                        kpi.color === "purple" ? "from-purple-600 to-purple-400" :
                        "from-slate-600 to-slate-400"
                      }`}
                      style={{ width: `${Math.min(100, (kpi.value / Math.max(data.kpis.totalReports, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* ROW 1: Lost vs Found + Trends */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Lost vs Found Bar Chart */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur lg:col-span-5">
                <h3 className="text-base font-bold text-white">📊 Lost vs Found Distribution</h3>
                <p className="mt-1 text-xs text-slate-400">Comparison of reports filed this period</p>

                <div className="mt-6 flex flex-col gap-5">
                  {[
                    { label: "LOST ITEMS", value: data.kpis.totalLost, color: "from-rose-600 to-rose-400", textColor: "text-rose-400" },
                    { label: "FOUND ITEMS", value: data.kpis.totalFound, color: "from-teal-600 to-teal-400", textColor: "text-teal-400" },
                  ].map((bar) => {
                    const pct = data.kpis.totalReports > 0 ? Math.round((bar.value / data.kpis.totalReports) * 100) : 0;
                    return (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className={bar.textColor}>{bar.label} ({bar.value})</span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-2 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                      <span className="text-[11px] font-bold text-blue-400 uppercase">Active</span>
                      <p className="text-xl font-black text-white mt-1">{data.kpis.activeReports}</p>
                    </div>
                    <div className="rounded-xl bg-slate-950/60 p-3 border border-emerald-900/40">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase">Recovered</span>
                      <p className="text-xl font-black text-emerald-300 mt-1">{data.kpis.recoveredItems}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Activity Trends */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur lg:col-span-7">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">📈 Report Activity Trends</h3>
                    <p className="mt-1 text-xs text-slate-400">Daily reporting cadence ({data.filter.rangeLabel})</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Lost
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-teal-500" /> Found
                    </span>
                  </div>
                </div>

                {data.charts.trends.length === 0 ? (
                  <div className="mt-8 flex h-48 items-center justify-center text-xs text-slate-500">
                    No reports logged in this timeframe.
                  </div>
                ) : (
                  <div className="mt-6 h-44 w-full flex items-end gap-1 pt-6">
                    {data.charts.trends.map((t, idx) => {
                      const maxVal = Math.max(...data.charts.trends.map((p) => Math.max(p.lost, p.found, 1)));
                      const lostH = (t.lost / maxVal) * 100;
                      const foundH = (t.found / maxVal) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          <div className="absolute -top-10 hidden group-hover:flex z-10 flex-col items-center rounded-xl bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] text-white shadow-xl whitespace-nowrap">
                            <span className="font-semibold">{t.label}</span>
                            <span className="text-rose-300">Lost: {t.lost}</span>
                            <span className="text-teal-300">Found: {t.found}</span>
                          </div>
                          <div className="w-full flex items-end justify-center gap-0.5 h-32">
                            <div
                              style={{ height: `${Math.max(lostH, 4)}%` }}
                              className="w-3 rounded-t bg-gradient-to-t from-rose-700 to-rose-400 transition-all group-hover:brightness-125"
                            />
                            <div
                              style={{ height: `${Math.max(foundH, 4)}%` }}
                              className="w-3 rounded-t bg-gradient-to-t from-teal-700 to-teal-400 transition-all group-hover:brightness-125"
                            />
                          </div>
                          <span className="mt-2 text-[9px] text-slate-500 truncate w-full text-center">
                            {t.label.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: Categories + Recovery + Locations */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Categories */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
                <h3 className="text-base font-bold text-white">🏷️ Item Categories</h3>
                <p className="mt-1 text-xs text-slate-400">Distribution by type</p>

                {data.charts.categories.length === 0 ? (
                  <div className="mt-8 flex h-40 items-center justify-center text-xs text-slate-500">No category data.</div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {data.charts.categories.map((cat, i) => {
                      const totalCats = data.charts.categories.reduce((a, b) => a + b.value, 0) || 1;
                      const pct = Math.round((cat.value / totalCats) * 100);
                      const color = CAT_COLORS[i % CAT_COLORS.length];
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-2 text-slate-200">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              {cat.name}
                            </span>
                            <span className="text-slate-400">{cat.value} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recovery Rate */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">🔄 Recovery Statistics</h3>
                  <p className="mt-1 text-xs text-slate-400">Campus resolution efficacy</p>

                  <div className="mt-6 flex flex-col items-center">
                    <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-slate-800">
                      <div
                        className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent border-l-transparent transition-all duration-700"
                        style={{ transform: `rotate(${Math.min(360, (data.charts.recovery.recoveryRate / 100) * 360)}deg)` }}
                      />
                      <div className="absolute inset-0 rounded-full border-8 border-transparent border-b-transparent border-r-transparent" />
                      <div className="text-center z-10">
                        <span className="text-3xl font-black text-emerald-400">{data.charts.recovery.recoveryRate}%</span>
                        <p className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">Recovery</p>
                      </div>
                    </div>

                    <div className="mt-6 w-full grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-2.5">
                        <span className="text-[9px] font-bold uppercase text-emerald-400">Recovered</span>
                        <p className="text-lg font-black text-emerald-300 mt-0.5">{data.charts.recovery.recovered}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                        <span className="text-[9px] font-bold uppercase text-slate-400">Unresolved</span>
                        <p className="text-lg font-black text-slate-300 mt-0.5">{data.charts.recovery.unresolved}</p>
                      </div>
                      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-2.5">
                        <span className="text-[9px] font-bold uppercase text-red-400">Rejected</span>
                        <p className="text-lg font-black text-red-300 mt-0.5">{data.charts.recovery.rejected}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-slate-500 text-center">
                  Only verified dual-confirmation returns qualify as recovered.
                </p>
              </div>

              {/* Campus Hot Spots */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
                <h3 className="text-base font-bold text-white">📍 Campus Hot Spots</h3>
                <p className="mt-1 text-xs text-slate-400">Locations with highest reported incidents</p>

                {data.charts.locations.length === 0 ? (
                  <div className="mt-8 flex h-40 items-center justify-center text-xs text-slate-500">No location data.</div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {data.charts.locations.map((loc, idx) => {
                      const maxLoc = Math.max(...data.charts.locations.map((l) => l.count), 1);
                      const widthPct = Math.round((loc.count / maxLoc) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200 truncate max-w-[180px]">
                              {idx === 0 ? "🔥" : idx === 1 ? "⚡" : "📍"} {loc.name}
                            </span>
                            <span className="text-xs font-bold text-cyan-400 shrink-0 ml-2">{loc.count}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ROW 3: Claims breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
              <h3 className="text-base font-bold text-white">⚖️ Ownership Claim Verification Overview</h3>
              <p className="mt-1 text-xs text-slate-400">Total claims filed: {data.kpis.totalClaims}</p>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Pending Review", value: data.kpis.pendingClaims, color: "amber", desc: "Awaiting moderator or admin" },
                  { label: "Approved", value: data.kpis.approvedClaims, color: "cyan", desc: "Ready for OTP handover" },
                  { label: "Handed Over", value: data.charts.claims.find((c) => c.status === "HANDED_OVER")?.count || 0, color: "emerald", desc: "Dual confirmation verified" },
                  { label: "Rejected", value: data.kpis.rejectedClaims, color: "red", desc: "Failed ownership verification" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl border p-4 ${
                      stat.color === "amber" ? "border-amber-900/50 bg-amber-950/20" :
                      stat.color === "cyan" ? "border-cyan-900/50 bg-cyan-950/20" :
                      stat.color === "emerald" ? "border-emerald-900/50 bg-emerald-950/20" :
                      "border-red-900/50 bg-red-950/20"
                    }`}
                  >
                    <span className={`text-xs font-bold uppercase ${
                      stat.color === "amber" ? "text-amber-400" :
                      stat.color === "cyan" ? "text-cyan-400" :
                      stat.color === "emerald" ? "text-emerald-400" : "text-red-400"
                    }`}>{stat.label}</span>
                    <p className={`text-2xl font-black mt-1 ${
                      stat.color === "amber" ? "text-amber-300" :
                      stat.color === "cyan" ? "text-cyan-300" :
                      stat.color === "emerald" ? "text-emerald-300" : "text-red-300"
                    }`}>{stat.value}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-700">
          LOSTLINK ANALYTICS · MYSQL REAL-TIME AGGREGATIONS · PES UNIVERSITY RR CAMPUS
        </footer>
      </div>
    </main>
  );
}
