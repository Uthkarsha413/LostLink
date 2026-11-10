
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Report = {
  report_id: number;
  report_type: "LOST" | "FOUND";
  title: string;
  description: string;
  brand: string | null;
  color: string | null;
  event_datetime: string | null;
  report_status: string;
  created_at: string;
  category_name: string;
  location_name: string | null;
  image_id: number | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: Report[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

const statuses = ["ALL", "ACTIVE", "MATCHED", "CLAIMED", "CLOSED", "REJECTED"];

function statusBadge(value: string) {
  switch (value) {
    case "ACTIVE": return "border-emerald-700/60 bg-emerald-950/40 text-emerald-300";
    case "MATCHED": return "border-blue-700/60 bg-blue-950/40 text-blue-300";
    case "CLAIMED": return "border-amber-700/60 bg-amber-950/40 text-amber-300";
    case "CLOSED": return "border-slate-600 bg-slate-800/60 text-slate-300";
    case "REJECTED": return "border-red-700/60 bg-red-950/40 text-red-300";
    default: return "border-slate-700 bg-slate-800 text-slate-400";
  }
}

function statusDot(value: string) {
  switch (value) {
    case "ACTIVE": return "bg-emerald-400";
    case "MATCHED": return "bg-blue-400";
    case "CLAIMED": return "bg-amber-400";
    case "CLOSED": return "bg-slate-500";
    case "REJECTED": return "bg-red-400";
    default: return "bg-slate-600";
  }
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (type !== "ALL") params.set("type", type);
      if (status !== "ALL") params.set("status", status);
      const response = await fetch(`/api/reports/mine?${params.toString()}`, { cache: "no-store" });
      const result: ApiResponse = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load your reports.");
      setReports(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [page, type, status]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const summary = useMemo(() => ({
    lost: reports.filter((r) => r.report_type === "LOST").length,
    found: reports.filter((r) => r.report_type === "FOUND").length,
    active: reports.filter((r) => r.report_status === "ACTIVE").length,
  }), [reports]);

  function changeType(value: string) { setType(value); setPage(1); }
  function changeStatus(value: string) { setStatus(value); setPage(1); }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <p className="mb-2 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
            📋 LostLink · My Reports
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              My Reported Items
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            View and track all the lost and found items you have reported on campus.
          </p>
        </header>

        {/* Stats cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Reports", value: total, color: "cyan", icon: "📋" },
            { label: "Lost Items", value: summary.lost, color: "rose", icon: "🔍" },
            { label: "Found Items", value: summary.found, color: "emerald", icon: "📦" },
            { label: "Active Reports", value: summary.active, color: "blue", icon: "⚡" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border p-5 backdrop-blur transition-all hover:scale-[1.02] ${
                stat.color === "cyan" ? "border-cyan-900/40 bg-slate-900/80" :
                stat.color === "rose" ? "border-rose-900/40 bg-slate-900/80" :
                stat.color === "emerald" ? "border-emerald-900/40 bg-slate-900/80" :
                "border-blue-900/40 bg-slate-900/80"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${
                  stat.color === "cyan" ? "text-cyan-400" :
                  stat.color === "rose" ? "text-rose-400" :
                  stat.color === "emerald" ? "text-emerald-400" : "text-blue-400"
                }`}>{stat.label}</p>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <p className={`text-3xl font-black ${
                stat.color === "cyan" ? "text-cyan-300" :
                stat.color === "rose" ? "text-rose-300" :
                stat.color === "emerald" ? "text-emerald-300" : "text-blue-300"
              }`}>{stat.value}</p>
            </div>
          ))}
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-white">Your submitted reports</h2>
              <p className="mt-1 text-sm text-slate-400">{total} report(s) found</p>
            </div>
            <button
              onClick={loadReports}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="report-type" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Report Type
              </label>
              <select
                id="report-type"
                value={type}
                onChange={(e) => changeType(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="ALL">All reports</option>
                <option value="LOST">🔍 Lost items</option>
                <option value="FOUND">📦 Found items</option>
              </select>
            </div>
            <div>
              <label htmlFor="report-status" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Report Status
              </label>
              <select
                id="report-status"
                value={status}
                onChange={(e) => changeStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All statuses" : s.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-4 text-sm">Loading your reports...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && reports.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center backdrop-blur">
            <div className="text-6xl mb-4">🔎</div>
            <h3 className="text-xl font-bold">No Reports Found</h3>
            <p className="mt-2 text-sm text-slate-400">
              You have not submitted any reports matching these filters.
            </p>
            <a
              href="/report"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
            >
              ➕ Report an Item
            </a>
          </div>
        )}

        {/* Report cards */}
        {!loading && !error && reports.length > 0 && (
          <div className="space-y-5">
            {reports.map((report) => {
              const imageUrl = report.image_id
                ? `/api/reports/${report.report_id}/images?imageId=${report.image_id}`
                : null;

              return (
                <article
                  key={report.report_id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur transition-all hover:border-slate-700 sm:p-6 group"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          report.report_type === "LOST"
                            ? "bg-rose-950/60 text-rose-300 border border-rose-700/50"
                            : "bg-teal-950/60 text-teal-300 border border-teal-700/50"
                        }`}>
                          {report.report_type === "LOST" ? "🔍 LOST" : "📦 FOUND"}
                        </span>
                        <p className="text-xs text-slate-500">Report #{report.report_id}</p>
                      </div>
                      <h3 className="text-xl font-bold text-white">{report.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-400">{report.category_name}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${statusBadge(report.report_status)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(report.report_status)}`} />
                      {report.report_status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300 line-clamp-2">{report.description}</p>

                  <div className="mt-5 grid gap-3 rounded-xl bg-slate-800/50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">📍 Location</p>
                      <p className="mt-1 font-medium text-slate-200">{report.location_name || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">🏷️ Brand & Color</p>
                      <p className="mt-1 font-medium text-slate-200">
                        {[report.brand, report.color].filter(Boolean).join(" · ") || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">📅 Item Date</p>
                      <p className="mt-1 font-medium text-slate-200">
                        {report.event_datetime ? new Date(report.event_datetime).toLocaleString() : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">🕐 Submitted</p>
                      <p className="mt-1 font-medium text-slate-200">{new Date(report.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="mt-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">🖼️ Uploaded Image</p>
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block overflow-hidden rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all"
                      >
                        <img
                          src={imageUrl}
                          alt={report.title}
                          className="h-48 w-48 object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </a>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                    <span className="text-xs text-slate-600">ID: #{report.report_id}</span>
                    <div className="flex items-center gap-2">
                      {report.report_status === "CLAIMED" && (
                        <a
                          href="/claims"
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-700/50 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-950/60 transition-colors"
                        >
                          🔑 Handover in progress →
                        </a>
                      )}
                      <a
                        href={`/reports/${report.report_id}/timeline`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-700/40 px-4 py-1.5 text-xs font-bold text-cyan-300 hover:from-cyan-600/30 hover:to-blue-600/30 transition-all"
                      >
                        🧭 Track Timeline (9 Stages)
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && reports.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
