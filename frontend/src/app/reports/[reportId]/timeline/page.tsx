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
    reportId: number; reportType: "LOST" | "FOUND"; title: string; description: string;
    brand: string | null; color: string | null; categoryName: string; locationName: string | null;
    reportStatus: string; createdAt: string; reporterName: string; isOwner: boolean;
  };
  currentStage: number;
  completedStagesCount: number;
  totalStages: number;
  stagesSummary: StageSummary[];
  events: TimelineEvent[];
}

const STAGE_ICONS = ["📝", "🔍", "🤖", "📋", "⚖️", "🔑", "✅", "🤝", "🎉"];

function roleBadge(role?: string | null) {
  switch (role?.toUpperCase()) {
    case "ADMIN": return "border-purple-700/60 bg-purple-950/40 text-purple-300";
    case "MODERATOR": return "border-indigo-700/60 bg-indigo-950/40 text-indigo-300";
    case "FINDER": return "border-emerald-700/60 bg-emerald-950/40 text-emerald-300";
    case "OWNER": return "border-cyan-700/60 bg-cyan-950/40 text-cyan-300";
    case "STUDENT": return "border-blue-700/60 bg-blue-950/40 text-blue-300";
    default: return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "CLOSED": return "border-emerald-700/60 bg-emerald-950/40 text-emerald-300";
    case "CLAIMED": return "border-amber-700/60 bg-amber-950/40 text-amber-300";
    case "MATCHED": return "border-blue-700/60 bg-blue-950/40 text-blue-300";
    case "ACTIVE": return "border-cyan-700/60 bg-cyan-950/40 text-cyan-300";
    default: return "border-slate-700 bg-slate-800 text-slate-400";
  }
}

function TimelineContent({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true); setError("");
        const res = await fetch(`/api/reports/${reportId}/timeline`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load timeline");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally { setLoading(false); }
    }
    fetchTimeline();
  }, [reportId]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-indigo-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Nav */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/my-reports" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
            ← My Reports
          </Link>
          <Link href="/claims" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
            Go to Claims →
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-16 text-center backdrop-blur">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-4 font-semibold text-slate-300">Loading item lifecycle timeline...</p>
            <p className="mt-1 text-xs text-slate-500">Fetching all 9 stages from the database</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-6 text-red-300">
            <h3 className="font-bold text-red-200">❌ Timeline Error</h3>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Report Header Card */}
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur shadow-xl sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                      data.report.reportType === "LOST"
                        ? "border-rose-600/50 bg-rose-950/40 text-rose-300"
                        : "border-teal-600/50 bg-teal-950/40 text-teal-300"
                    }`}>
                      {data.report.reportType === "LOST" ? "🔍 LOST ITEM" : "📦 FOUND ITEM"}
                    </span>
                    <span className="text-xs text-slate-500">Report #{data.report.reportId}</span>
                    {data.report.isOwner && (
                      <span className="rounded-full border border-cyan-700/50 bg-cyan-950/40 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                        Your Report
                      </span>
                    )}
                  </div>
                  <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {data.report.title}
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    {data.report.categoryName}
                    {data.report.locationName && <> · 📍 {data.report.locationName}</>}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${statusBadge(data.report.reportStatus)}`}>
                    {data.report.reportStatus}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">
                    📅 {new Date(data.report.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    By: {data.report.reporterName}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6 border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-400">🧭 Lifecycle Progress</span>
                  <span className="font-bold text-cyan-400">
                    {data.completedStagesCount} / {data.totalStages} Stages
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 transition-all duration-700 shadow-lg shadow-cyan-500/20"
                    style={{ width: `${(data.completedStagesCount / data.totalStages) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-600">
                  <span>Report Submitted</span>
                  <span>Item Recovered 🎉</span>
                </div>
              </div>
            </div>

            {/* Stage Stepper */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur shadow-xl sm:p-8">
              <h2 className="mb-6 text-lg font-bold text-white">🔄 Item Verification Lifecycle</h2>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-800" />

                <div className="space-y-6">
                  {data.stagesSummary.map((stage, idx) => {
                    const isDone = stage.completed;
                    const isCurrent = stage.current;
                    const hasEvents = stage.events.length > 0;
                    const icon = STAGE_ICONS[idx] || "⚡";

                    return (
                      <div key={stage.stageNumber} className="relative flex gap-5">
                        {/* Node */}
                        <div className="relative z-10 shrink-0">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-black transition-all ${
                            isDone
                              ? "border-emerald-500 bg-emerald-950 text-emerald-300 shadow-lg shadow-emerald-500/20"
                              : isCurrent
                              ? "border-cyan-400 bg-cyan-950 text-cyan-300 ring-4 ring-cyan-500/20 animate-pulse"
                              : "border-slate-700 bg-slate-900 text-slate-600"
                          }`}>
                            {isDone ? "✓" : icon}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <h3 className={`font-bold text-sm ${
                              isDone ? "text-white" : isCurrent ? "text-cyan-300" : "text-slate-500"
                            }`}>
                              Stage {stage.stageNumber}: {stage.label}
                            </h3>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                              isDone
                                ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300"
                                : isCurrent
                                ? "border-cyan-700/60 bg-cyan-950/40 text-cyan-300"
                                : "border-slate-700 bg-slate-800/60 text-slate-500"
                            }`}>
                              {isDone ? "Completed" : isCurrent ? "Active" : "Pending"}
                            </span>
                          </div>

                          {hasEvents ? (
                            <div className="mt-2 space-y-2">
                              {stage.events.map((evt) => (
                                <div
                                  key={evt.event_id}
                                  className={`rounded-xl border p-4 transition-all ${
                                    isDone
                                      ? "border-slate-800/60 bg-slate-950/50 hover:border-slate-700"
                                      : "border-cyan-800/40 bg-cyan-950/20 hover:border-cyan-700/50"
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-100 text-sm">{evt.event_title}</span>
                                    <div className="flex items-center gap-2">
                                      {evt.actor_role && (
                                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${roleBadge(evt.actor_role)}`}>
                                          {evt.actor_role}
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-400">
                                        {new Date(evt.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="mt-2 text-sm text-slate-300 leading-5">{evt.event_description}</p>
                                  {evt.actor_name && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Action by: <span className="text-slate-400">{evt.actor_name}</span>
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-slate-600">
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
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ReportTimelinePage(props: { params: Promise<{ reportId: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-16 text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-4 font-semibold text-slate-300">Loading item lifecycle timeline...</p>
          </div>
        </main>
      }
    >
      <TimelineContent {...props} />
    </Suspense>
  );
}
