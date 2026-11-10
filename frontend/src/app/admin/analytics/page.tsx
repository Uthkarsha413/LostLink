"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface AnalyticsKPIs {
  totalLost: number;
  totalFound: number;
  activeReports: number;
  pendingClaims: number;
  approvedClaims: number;
  recoveredItems: number;
  rejectedClaims: number;
  unclaimedItems: number;
  totalReports: number;
  totalClaims: number;
}

interface TrendPoint {
  label: string;
  lost: number;
  found: number;
  total: number;
}

interface CategoryPoint {
  name: string;
  value: number;
  lost_count: number;
  found_count: number;
}

interface LocationPoint {
  name: string;
  count: number;
  lost: number;
  found: number;
}

interface ClaimStat {
  status: string;
  count: number;
}

interface AnalyticsData {
  filter: {
    range: string;
    rangeLabel: string;
    startDate: string;
    endDate: string;
  };
  kpis: AnalyticsKPIs;
  charts: {
    lostVsFound: Array<{
      report_type: string;
      count: number;
      active_count: number;
      closed_count: number;
    }>;
    trends: TrendPoint[];
    categories: CategoryPoint[];
    recovery: {
      recovered: number;
      unresolved: number;
      rejected: number;
      recoveryRate: number;
    };
    locations: LocationPoint[];
    claims: ClaimStat[];
  };
}

const CATEGORY_COLORS = [
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#64748b", // slate
];

export default function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadAnalytics = useCallback(async (selectedRange: string, start?: string, end?: string) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ range: selectedRange });
      if (selectedRange === "custom" && start && end) {
        params.set("startDate", start);
        params.set("endDate", end);
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        cache: "no-store",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load analytics");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(range, startDate, endDate);
  }, [loadAnalytics, range, startDate, endDate]);

  function handleFilterClick(newRange: string) {
    setRange(newRange);
  }

  function handleCustomFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    setRange("custom");
    loadAnalytics("custom", startDate, endDate);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                LOSTLINK • SMART CAMPUS ANALYTICS
              </p>
              <h1 className="text-3xl font-extrabold sm:text-4xl text-white">
                Campus Analytics Dashboard
              </h1>
              <p className="mt-2 text-slate-400 text-sm max-w-2xl">
                Real-time MySQL relational aggregations, recovery statistics, location hot spots, and trend analysis for PES University RR Campus.
              </p>
            </div>

            {/* Navigation Switcher Tabs */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-1.5 border border-slate-800">
              <Link
                href="/admin"
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Claims Review
              </Link>
              <span className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md">
                Analytics & Reports
              </span>
            </div>
          </div>

          {/* DATE RANGE FILTER CONTROLS */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400 mr-1">Timeframe:</span>
              {[
                { key: "today", label: "Today" },
                { key: "7d", label: "Last 7 Days" },
                { key: "30d", label: "Last 30 Days" },
                { key: "semester", label: "This Semester" },
                { key: "all", label: "All Time" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterClick(filter.key)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    range === filter.key
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            <form onSubmit={handleCustomFilterSubmit} className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Apply
              </button>
            </form>
          </div>
        </header>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-16 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-4 font-semibold text-slate-300">Computing analytics aggregations from MySQL...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-6 text-red-300">
            <h3 className="font-semibold text-red-200">Unable to load analytics</h3>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* ANALYTICS CONTENT */}
        {!loading && !error && data && (
          <div className="space-y-8">
            {/* STATS CARDS GRID (8 REQUESTED CARDS) */}
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
              {/* Card 1: Total Lost */}
              <div className="rounded-2xl border border-rose-900/40 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Total Lost</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-950/60 text-rose-400 text-sm">
                    🔍
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{data.kpis.totalLost}</div>
                <p className="mt-1 text-xs text-slate-400">Lost item reports filed</p>
              </div>

              {/* Card 2: Total Found */}
              <div className="rounded-2xl border border-teal-900/40 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Total Found</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-950/60 text-teal-400 text-sm">
                    📦
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{data.kpis.totalFound}</div>
                <p className="mt-1 text-xs text-slate-400">Found belongings handed in</p>
              </div>

              {/* Card 3: Active Reports */}
              <div className="rounded-2xl border border-blue-900/40 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Active Reports</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-950/60 text-blue-400 text-sm">
                    ⚡
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{data.kpis.activeReports}</div>
                <p className="mt-1 text-xs text-slate-400">Seeking discovery or match</p>
              </div>

              {/* Card 4: Successfully Recovered Items */}
              <div className="rounded-2xl border border-emerald-800 bg-emerald-950/20 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Recovered Items</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-900/60 text-emerald-300 text-sm">
                    ✓
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-emerald-300">{data.kpis.recoveredItems}</div>
                <p className="mt-1 text-xs text-emerald-400/80 font-medium">Successfully returned to owner</p>
              </div>

              {/* Card 5: Pending Claims */}
              <div className="rounded-2xl border border-amber-900/40 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Claims</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950/60 text-amber-400 text-sm">
                    ⏳
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{data.kpis.pendingClaims}</div>
                <p className="mt-1 text-xs text-slate-400">Awaiting review or verification</p>
              </div>

              {/* Card 6: Approved Claims */}
              <div className="rounded-2xl border border-cyan-900/40 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Approved Claims</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950/60 text-cyan-400 text-sm">
                    🔑
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{data.kpis.approvedClaims}</div>
                <p className="mt-1 text-xs text-slate-400">Handover process unlocked</p>
              </div>

              {/* Card 7: Rejected Claims */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rejected Claims</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-sm">
                    ✕
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-slate-300">{data.kpis.rejectedClaims}</div>
                <p className="mt-1 text-xs text-slate-500">Unverified evidence</p>
              </div>

              {/* Card 8: Unclaimed Items */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Unclaimed Items</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-950/60 text-purple-400 text-sm">
                    📭
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-purple-300">{data.kpis.unclaimedItems}</div>
                <p className="mt-1 text-xs text-slate-400">Found with no owner claim</p>
              </div>
            </section>

            {/* ROW 1: CHARTS (Lost vs Found Bar Chart + Trends Line Chart) */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Chart 1: Lost vs Found items (Bar Chart) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-5">
                <h3 className="text-base font-bold text-white">Lost vs Found Distribution</h3>
                <p className="mt-1 text-xs text-slate-400">Comparison of reports filed across categories</p>

                <div className="mt-6 flex flex-col justify-center space-y-5">
                  {/* Lost bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-rose-400">LOST ITEMS ({data.kpis.totalLost})</span>
                      <span className="text-slate-400">
                        {data.kpis.totalReports > 0
                          ? Math.round((data.kpis.totalLost / data.kpis.totalReports) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-700"
                        style={{
                          width: `${
                            data.kpis.totalReports > 0
                              ? (data.kpis.totalLost / data.kpis.totalReports) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Found bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-teal-400">FOUND ITEMS ({data.kpis.totalFound})</span>
                      <span className="text-slate-400">
                        {data.kpis.totalReports > 0
                          ? Math.round((data.kpis.totalFound / data.kpis.totalReports) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-700"
                        style={{
                          width: `${
                            data.kpis.totalReports > 0
                              ? (data.kpis.totalFound / data.kpis.totalReports) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Active vs Recovered breakdown */}
                  <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                      <span className="text-[11px] font-bold text-blue-400 uppercase">Active</span>
                      <p className="text-xl font-bold text-white mt-1">{data.kpis.activeReports}</p>
                    </div>
                    <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase">Recovered</span>
                      <p className="text-xl font-bold text-emerald-300 mt-1">{data.kpis.recoveredItems}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 2: Report Trends (Line / Area Chart) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl lg:col-span-7">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Report Activity Trends</h3>
                    <p className="mt-1 text-xs text-slate-400">Daily reporting cadence ({data.filter.rangeLabel})</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span> Lost
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-teal-500"></span> Found
                    </span>
                  </div>
                </div>

                {data.charts.trends.length === 0 ? (
                  <div className="mt-8 flex h-48 items-center justify-center text-xs text-slate-500">
                    No reports logged in this timeframe.
                  </div>
                ) : (
                  <div className="mt-6">
                    {/* SVG Line / Bar visualization */}
                    <div className="h-44 w-full flex items-end gap-2 pt-6">
                      {data.charts.trends.map((t, idx) => {
                        const maxVal = Math.max(
                          ...data.charts.trends.map((p) => Math.max(p.lost, p.found, 1))
                        );
                        const lostH = (t.lost / maxVal) * 100;
                        const foundH = (t.found / maxVal) * 100;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-10 hidden group-hover:flex z-10 flex-col items-center rounded-lg bg-slate-800 px-2 py-1 text-[10px] text-white shadow-xl whitespace-nowrap">
                              <span>{t.label}</span>
                              <span className="font-bold text-rose-300">Lost: {t.lost} | Found: {t.found}</span>
                            </div>

                            <div className="w-full flex items-end justify-center gap-1 h-32">
                              <div
                                style={{ height: `${Math.max(lostH, 6)}%` }}
                                className="w-3 rounded-t bg-rose-500 transition-all group-hover:brightness-125"
                              ></div>
                              <div
                                style={{ height: `${Math.max(foundH, 6)}%` }}
                                className="w-3 rounded-t bg-teal-500 transition-all group-hover:brightness-125"
                              ></div>
                            </div>
                            <span className="mt-2 text-[10px] text-slate-500 truncate w-full text-center">
                              {t.label.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: CATEGORIES + RECOVERY RATE + LOCATIONS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Chart 3: Item Categories Doughnut Representation */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h3 className="text-base font-bold text-white">Item Categories</h3>
                <p className="mt-1 text-xs text-slate-400">Distribution of reported items by type</p>

                {data.charts.categories.length === 0 ? (
                  <div className="mt-8 flex h-40 items-center justify-center text-xs text-slate-500">
                    No categorical data available.
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {data.charts.categories.map((cat, i) => {
                      const totalCats = data.charts.categories.reduce((a, b) => a + b.value, 0) || 1;
                      const pct = Math.round((cat.value / totalCats) * 100);
                      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-2 text-slate-200">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                              {cat.name}
                            </span>
                            <span className="text-slate-400">
                              {cat.value} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chart 4: Recovery Statistics (Recovered vs Unresolved) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Recovery Statistics</h3>
                  <p className="mt-1 text-xs text-slate-400">Campus resolution efficacy</p>

                  <div className="mt-6 flex flex-col items-center justify-center">
                    <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-slate-800">
                      <div
                        className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent transition-all duration-700"
                        style={{
                          transform: `rotate(${Math.min(360, (data.charts.recovery.recoveryRate / 100) * 360)}deg)`,
                        }}
                      ></div>
                      <div className="text-center">
                        <span className="text-3xl font-extrabold text-emerald-400">
                          {data.charts.recovery.recoveryRate}%
                        </span>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Recovery Rate</p>
                      </div>
                    </div>

                    <div className="mt-6 w-full grid grid-cols-2 gap-3 text-center">
                      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-2.5">
                        <span className="text-[10px] font-bold uppercase text-emerald-400">Recovered</span>
                        <p className="text-lg font-extrabold text-emerald-300 mt-0.5">
                          {data.charts.recovery.recovered}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Unresolved</span>
                        <p className="text-lg font-extrabold text-slate-300 mt-0.5">
                          {data.charts.recovery.unresolved}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtext info */}
                <p className="mt-4 text-[11px] text-slate-500 text-center">
                  Only verified dual-confirmation returns qualify as recovered.
                </p>
              </div>

              {/* Chart 5: Most Frequently Reported Campus Locations */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h3 className="text-base font-bold text-white">Campus Hot Spots</h3>
                <p className="mt-1 text-xs text-slate-400">Locations with highest reported incidents</p>

                {data.charts.locations.length === 0 ? (
                  <div className="mt-8 flex h-40 items-center justify-center text-xs text-slate-500">
                    No location data available.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {data.charts.locations.map((loc, idx) => {
                      const maxLoc = Math.max(...data.charts.locations.map((l) => l.count), 1);
                      const widthPct = Math.round((loc.count / maxLoc) * 100);

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200 truncate max-w-[180px]">
                              {idx + 1}. {loc.name}
                            </span>
                            <span className="text-xs font-bold text-cyan-400">{loc.count} reports</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500"
                              style={{ width: `${widthPct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ROW 3: CLAIM DECISIONS BREAKDOWN */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <h3 className="text-base font-bold text-white">Ownership Claim Verification Overview</h3>
              <p className="mt-1 text-xs text-slate-400">Total claims filed: {data.kpis.totalClaims}</p>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
                  <span className="text-xs font-bold uppercase text-amber-400">Pending Review</span>
                  <p className="text-2xl font-extrabold text-amber-300 mt-1">{data.kpis.pendingClaims}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Awaiting moderator or admin</p>
                </div>

                <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-4">
                  <span className="text-xs font-bold uppercase text-cyan-400">Approved</span>
                  <p className="text-2xl font-extrabold text-cyan-300 mt-1">{data.kpis.approvedClaims}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Ready for OTP handover</p>
                </div>

                <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
                  <span className="text-xs font-bold uppercase text-emerald-400">Handed Over</span>
                  <p className="text-2xl font-extrabold text-emerald-300 mt-1">
                    {data.charts.claims.find((c) => c.status === "HANDED_OVER")?.count || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Dual confirmation verified</p>
                </div>

                <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
                  <span className="text-xs font-bold uppercase text-red-400">Rejected</span>
                  <p className="text-2xl font-extrabold text-red-300 mt-1">{data.kpis.rejectedClaims}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Failed ownership verification</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
