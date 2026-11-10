
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
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Page heading */}
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            LostLink
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Reports
          </h1>

          <p className="mt-2 text-slate-600">
            View and track all the lost and found items you have
            reported on campus.
          </p>
        </header>

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total reports</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {total}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Lost</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {summary.lost}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Found</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {summary.found}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active on this page</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {summary.active}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Your submitted reports
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {total} report(s) found
              </p>
            </div>

            <button
              onClick={loadReports}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="report-type"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Report type
              </label>

              <select
                id="report-type"
                value={type}
                onChange={(event) => changeType(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="ALL">All reports</option>
                <option value="LOST">Lost items</option>
                <option value="FOUND">Found items</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="report-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Report status
              </label>

              <select
                id="report-status"
                value={status}
                onChange={(event) => changeStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500"
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
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading your reports...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && reports.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">🔎</div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No reports found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              You have not submitted any reports matching these filters.
            </p>

            <a
              href="/report"
              className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Report an item
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  {/* Report heading */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Report #{report.report_id} · {report.report_type}
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-slate-900">
                        {report.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
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
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {report.description}
                  </p>

                  {/* Report information */}
                  <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Location
                      </p>

                      <p className="mt-1 font-medium text-slate-800">
                        {report.location_name || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Brand and colour
                      </p>

                      <p className="mt-1 font-medium text-slate-800">
                        {[report.brand, report.color]
                          .filter(Boolean)
                          .join(" · ") || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Item event date
                      </p>

                      <p className="mt-1 font-medium text-slate-800">
                        {report.event_datetime
                          ? new Date(report.event_datetime).toLocaleString()
                          : "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Report submitted
                      </p>

                      <p className="mt-1 font-medium text-slate-800">
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
