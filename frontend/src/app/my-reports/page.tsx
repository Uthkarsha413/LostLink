
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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const statuses = [
  "ALL",
  "ACTIVE",
  "MATCHED",
  "CLAIMED",
  "CLOSED",
  "REJECTED",
];

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

      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (type !== "ALL") params.set("type", type);
      if (status !== "ALL") params.set("status", status);

      const response = await fetch(
        `/api/reports/mine?${params.toString()}`,
        { cache: "no-store" }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load your reports.");
      }

      setReports(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [page, type, status]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = useMemo(() => {
    return {
      lost: reports.filter((r) => r.report_type === "LOST").length,
      found: reports.filter((r) => r.report_type === "FOUND").length,
      active: reports.filter((r) => r.report_status === "ACTIVE").length,
    };
  }, [reports]);

  function changeType(value: string) {
    setType(value);
    setPage(1);
  }

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  function statusStyle(value: string) {
    switch (value) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "MATCHED":
        return "bg-blue-100 text-blue-700";
      case "CLAIMED":
        return "bg-amber-100 text-amber-700";
      case "CLOSED":
      case "REJECTED":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-5 py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-5xl">

        {/* Page heading */}
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            LostLink Reports
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            My Reported Items
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            View and track all the lost and found items you have reported on campus.
          </p>
        </header>

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total reports</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lost items</p>
            <p className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400">
              {summary.lost}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Found items</p>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.found}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active reports</p>
            <p className="mt-2 text-3xl font-black text-cyan-600 dark:text-cyan-400">
              {summary.active}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Your submitted reports
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {total} report(s) found
              </p>
            </div>

            <button
              onClick={loadReports}
              disabled={loading}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="report-type"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                Report type
              </label>

              <select
                id="report-type"
                value={type}
                onChange={(event) => changeType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="ALL">All reports</option>
                <option value="LOST">Lost items</option>
                <option value="FOUND">Found items</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="report-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              >
                Report status
              </label>

              <select
                id="report-status"
                value={status}
                onChange={(event) => changeStatus(event.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500"
              >
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value === "ALL"
                      ? "All statuses"
                      : value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-8 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
            <p className="mt-2 text-sm">Loading your reports...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && reports.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-10 text-center shadow-sm">
            <div className="text-4xl">🔎</div>

            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
              No reports found
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You have not submitted any reports matching these filters.
            </p>

            <a
              href="/report"
              className="mt-5 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110"
            >
              + Report an item
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
                  className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 sm:p-6"
                >
                  {/* Report heading */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Report #{report.report_id} · {report.report_type}
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                        {report.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {report.category_name}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        report.report_status
                      )}`}
                    >
                      {report.report_status.replaceAll("_", " ")}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {report.description}
                  </p>

                  {/* Report information */}
                  <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Location
                      </p>

                      <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                        {report.location_name || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Brand and colour
                      </p>

                      <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                        {[report.brand, report.color]
                          .filter(Boolean)
                          .join(" · ") || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Item event date
                      </p>

                      <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                        {report.event_datetime
                          ? new Date(report.event_datetime).toLocaleString()
                          : "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Report submitted
                      </p>

                      <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Uploaded image preview */}
                  {imageUrl && (
                    <div className="mt-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Uploaded item image
                      </p>

                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-block overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={imageUrl}
                          alt={report.title}
                          className="h-48 w-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </a>

                      <p className="mt-2 text-xs text-slate-400">
                        Click the image to view it in full size.
                      </p>
                    </div>
                  )}

                  {/* Actions & Tracking */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                      ID: #{report.report_id}
                    </span>

                    <div className="flex items-center gap-2">
                      {report.report_status === "CLAIMED" && (
                        <a
                          href="/claims"
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 border border-amber-200 hover:bg-amber-100"
                        >
                          Handover in progress →
                        </a>
                      )}
                      <a
                        href={`/reports/${report.report_id}/timeline`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <span>🧭</span> Track Timeline (9 Stages)
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
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPage((previous) => Math.max(1, previous - 1))
                }
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setPage((previous) => Math.min(totalPages, previous + 1))
                }
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
