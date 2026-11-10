"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";

interface TimelineEvent {
  event_id: number;
  report_id: number;
  claim_id: number | null;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_role: string | null;
  stage_number: number;
  event_type: string;
  event_title: string;
  event_description: string;
  item_status: string;
  created_at: string;
}

interface StageSummary {
  stageNumber: number;
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
  events: TimelineEvent[];
}

interface TimelineData {
  report: {
    reportId: number;
    reportType: "LOST" | "FOUND";
    title: string;
    description: string;
    brand: string | null;
    color: string | null;
    categoryName: string;
    locationName: string | null;
    reportStatus: string;
    createdAt: string;
    reporterName: string;
    isOwner: boolean;
  };
  currentStage: number;
  completedStagesCount: number;
  totalStages: number;
  stagesSummary: StageSummary[];
  events: TimelineEvent[];
}

function TimelineContent({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/reports/${reportId}/timeline`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load timeline");
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [reportId]);

  function getStageBadgeColor(role?: string | null) {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "bg-purple-900/60 text-purple-300 border-purple-700";
      case "MODERATOR":
        return "bg-indigo-900/60 text-indigo-300 border-indigo-700";
      case "FINDER":
        return "bg-emerald-900/60 text-emerald-300 border-emerald-700";
      case "OWNER":
        return "bg-cyan-900/60 text-cyan-300 border-cyan-700";
      case "STUDENT":
        return "bg-blue-900/60 text-blue-300 border-blue-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "CLOSED":
        return "bg-green-500/20 text-green-300 border-green-600";
      case "CLAIMED":
        return "bg-amber-500/20 text-amber-300 border-amber-600";
      case "MATCHED":
        return "bg-blue-500/20 text-blue-300 border-blue-600";
      case "ACTIVE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-600";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/my-reports"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-cyan-400"
          >
            ← Back to My Reports
          </Link>
          <Link
            href="/claims"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-cyan-400"
          >
            Go to Claims →
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-4 font-medium">Loading item lifecycle timeline...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-6 text-red-300">
            <h3 className="font-semibold text-red-200">Timeline Error</h3>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* Header */}
            <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        data.report.reportType === "LOST"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-600/50"
                          : "bg-teal-500/20 text-teal-300 border border-teal-600/50"
                      }`}
                    >
                      {data.report.reportType} ITEM
                    </span>
                    <span className="text-xs text-slate-400">
                      Report #{data.report.reportId}
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {data.report.title}
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Category: <span className="text-slate-200">{data.report.categoryName}</span>
                    {data.report.locationName && (
                      <> • Location: <span className="text-slate-200">{data.report.locationName}</span></>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                      data.report.reportStatus
                    )}`}
                  >
                    STATUS: {data.report.reportStatus}
                  </span>
                  <p className="mt-2 text-xs text-slate-400">
                    Reported on: {new Date(data.report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar Header */}
              <div className="mt-6 border-t border-slate-800 pt-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Lifecycle Progress</span>
                  <span className="font-semibold text-cyan-400">
                    {data.completedStagesCount} of {data.totalStages} Stages Completed
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(data.completedStagesCount / data.totalStages) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Stepper Progress Map */}
            <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
              <h2 className="mb-6 text-lg font-semibold tracking-wide text-white">
                Item Verification Lifecycle
              </h2>

              <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-6 space-y-8">
                {data.stagesSummary.map((stage) => {
                  const isDone = stage.completed;
                  const isCurrent = stage.current;
                  const hasEvents = stage.events.length > 0;

                  return (
                    <div key={stage.stageNumber} className="relative pl-6 sm:pl-8">
                      {/* Node Dot */}
                      <div
                        className={`absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                          isDone
                            ? "border-emerald-500 bg-emerald-950 text-emerald-300 shadow-md shadow-emerald-500/20"
                            : isCurrent
                            ? "border-cyan-400 bg-cyan-950 text-cyan-300 ring-4 ring-cyan-500/20 animate-pulse"
                            : "border-slate-700 bg-slate-900 text-slate-500"
                        }`}
                      >
                        {isDone ? "✓" : stage.stageNumber}
                      </div>

                      {/* Stage Content */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3
                            className={`text-base font-semibold ${
                              isDone
                                ? "text-slate-100"
                                : isCurrent
                                ? "text-cyan-300"
                                : "text-slate-500"
                            }`}
                          >
                            Stage {stage.stageNumber}: {stage.label}
                          </h3>

                          {isDone && (
                            <span className="rounded-full bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                              Completed
                            </span>
                          )}
                          {!isDone && isCurrent && (
                            <span className="rounded-full bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300">
                              Active Stage
                            </span>
                          )}
                          {!isDone && !isCurrent && (
                            <span className="rounded-full bg-slate-800/60 border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Associated Events Details */}
                        {hasEvents ? (
                          <div className="mt-3 space-y-3">
                            {stage.events.map((evt) => (
                              <div
                                key={evt.event_id}
                                className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-200 text-sm">
                                    {evt.event_title}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {evt.actor_role && (
                                      <span
                                        className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${getStageBadgeColor(
                                          evt.actor_role
                                        )}`}
                                      >
                                        {evt.actor_role}
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-400">
                                      {new Date(evt.created_at).toLocaleString([], {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-slate-300">
                                  {evt.event_description}
                                </p>
                                {evt.actor_name && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Action by: <span className="text-slate-400">{evt.actor_name}</span>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            {isDone
                              ? "Completed as part of workflow."
                              : "This stage will be unlocked as the verification workflow proceeds."}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ReportTimelinePage(props: {
  params: Promise<{ reportId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
          <div className="mx-auto max-w-4xl text-center p-12 text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-4 font-medium">Loading item lifecycle timeline...</p>
          </div>
        </main>
      }
    >
      <TimelineContent {...props} />
    </Suspense>
  );
}
