
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Evidence = {
  evidence_id: number;
  claim_id: number;
  evidence_type: string;
  evidence_text: string;
  storage_key?: string | null;
  submitted_at: string;
};

type Review = {
  review_id: number;
  reviewer_name: string;
  reviewer_role: string;
  decision: string;
  review_comments: string | null;
  reviewed_at: string;
};

type Claim = {
  claim_id: number;
  lost_report_id: number;
  found_report_id: number;
  claimant_id: number;
  claim_status: string;
  submitted_at: string;
  claimant_name?: string;
  claimant_email?: string;
  finder_id?: number;
  finder_name?: string;
  finder_email?: string;
  lost_item_title?: string;
  lost_description?: string;
  lost_brand?: string | null;
  lost_color?: string | null;
  found_item_title?: string;
  found_description?: string;
  found_brand?: string | null;
  found_color?: string | null;
  evidence?: Evidence[];
  reviews?: Review[];
  [key: string]: unknown;
};

export default function AdminDashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [handingOver, setHandingOver] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/claims", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Unable to load claims.");
      const data = result.data ?? result.claims ?? [];
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  async function reviewClaim(claimId: number, decision: "APPROVE" | "REJECT") {
    const confirmation = decision === "APPROVE" ? "Approve this ownership claim?" : "Reject this ownership claim?";
    if (!window.confirm(confirmation)) return;
    setProcessing(claimId);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/claims/${claimId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewComments: comments[claimId] || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Review action failed.");
      setMessage(result.message || (decision === "APPROVE" ? "✅ Claim approved successfully." : "❌ Claim rejected."));
      await loadClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setProcessing(null);
    }
  }

  async function completeHandover(claimId: number) {
    const confirmation = window.confirm("Confirm that the item has physically been handed over to the claimant?");
    if (!confirmation) return;
    setHandingOver(claimId);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/claims/${claimId}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Handover failed.");
      setMessage(result.message || "🎉 Item handover completed successfully.");
      await loadClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Handover failed.");
    } finally {
      setHandingOver(null);
    }
  }

  const pendingClaims = claims.filter((c) => c.claim_status === "ADMIN_REVIEW");
  const approvedClaims = claims.filter((c) => c.claim_status === "APPROVED");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
                👑 LostLink · Administration
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                  Admin Dashboard
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Review escalated ownership claims, make final decisions, and monitor item handovers.
              </p>
            </div>

            {/* Nav tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
              <span className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md">
                📋 Claims Review
              </span>
              <Link
                href="/admin/analytics"
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                📊 Analytics →
              </Link>
            </div>
          </div>

          {/* Quick stat row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Awaiting Decision", value: pendingClaims.length, color: "amber", icon: "⏳" },
              { label: "Approved", value: approvedClaims.length, color: "emerald", icon: "✅" },
              { label: "Total Claims", value: claims.length, color: "cyan", icon: "📋" },
              { label: "Other Status", value: claims.length - pendingClaims.length - approvedClaims.length, color: "slate", icon: "📊" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-4 backdrop-blur ${
                  stat.color === "amber" ? "border-amber-900/40 bg-amber-950/10" :
                  stat.color === "emerald" ? "border-emerald-900/40 bg-emerald-950/10" :
                  stat.color === "cyan" ? "border-cyan-900/40 bg-slate-900/80" :
                  "border-slate-800 bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    stat.color === "amber" ? "text-amber-400" :
                    stat.color === "emerald" ? "text-emerald-400" :
                    stat.color === "cyan" ? "text-cyan-400" : "text-slate-500"
                  }`}>{stat.label}</p>
                  <span>{stat.icon}</span>
                </div>
                <p className={`text-3xl font-black ${
                  stat.color === "amber" ? "text-amber-300" :
                  stat.color === "emerald" ? "text-emerald-300" :
                  stat.color === "cyan" ? "text-cyan-300" : "text-slate-400"
                }`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Messages */}
        {message && (
          <div className="mb-5 rounded-xl border border-emerald-700/50 bg-emerald-950/40 p-4 text-emerald-300 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-xl border border-red-700/50 bg-red-950/40 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* PENDING CLAIMS */}
        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">⏳ Claims Awaiting Decision</h2>
              <p className="mt-1 text-sm text-slate-400">{pendingClaims.length} claim(s) awaiting admin review</p>
            </div>
            <button
              onClick={loadClaims}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
              <p className="mt-4 text-sm">Loading claims...</p>
            </div>
          ) : pendingClaims.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-center backdrop-blur">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-bold">No Claims Awaiting Review</h3>
              <p className="mt-2 text-sm text-slate-400">
                Escalated claims will appear here when they are ready for an administrator decision.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingClaims.map((claim) => (
                <article
                  key={claim.claim_id}
                  className="rounded-2xl border border-amber-900/30 bg-slate-900/80 p-6 backdrop-blur transition-all hover:border-amber-700/40 shadow-lg"
                >
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Claim #{claim.claim_id}</p>
                      <h3 className="mt-1 text-xl font-bold text-white">
                        {claim.lost_item_title || claim.found_item_title || `Ownership Claim #${claim.claim_id}`}
                      </h3>
                    </div>
                    <span className="rounded-full border border-amber-700/60 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300">
                      ⏳ ADMIN REVIEW
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">👤 Claimant</p>
                      <p className="mt-2 font-bold text-white">{claim.claimant_name || `User ${claim.claimant_id}`}</p>
                      <p className="mt-1 text-xs text-slate-500">ID: {claim.claimant_id}{claim.claimant_email ? ` · ${claim.claimant_email}` : ""}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Submitted: {claim.submitted_at ? new Date(claim.submitted_at).toLocaleString() : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-800/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">📄 Related Reports</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="text-slate-400">Lost:</span>{" "}
                          <span className="font-bold text-white">#{claim.lost_report_id} - {claim.lost_item_title}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-slate-400">Found:</span>{" "}
                          <span className="font-bold text-white">#{claim.found_report_id} - {claim.found_item_title}</span>
                          {claim.finder_name && <span className="text-xs text-slate-400"> (Finder: {claim.finder_name})</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ITEM COMPARISON CARD */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-rose-900/30 bg-slate-950/60 p-3.5">
                      <p className="font-bold uppercase tracking-wider text-rose-400">🔍 Lost Item Details</p>
                      <p className="mt-1 font-semibold text-white">{claim.lost_item_title}</p>
                      {claim.lost_description && (
                        <p className="mt-1.5 text-slate-300 italic border-l-2 border-rose-500/50 pl-2">"{claim.lost_description}"</p>
                      )}
                      <div className="mt-2 flex gap-3 text-slate-400">
                        {claim.lost_brand && <span>Brand: <strong className="text-slate-200">{claim.lost_brand}</strong></span>}
                        {claim.lost_color && <span>Color: <strong className="text-slate-200">{claim.lost_color}</strong></span>}
                      </div>
                    </div>
                    <div className="rounded-xl border border-teal-900/30 bg-slate-950/60 p-3.5">
                      <p className="font-bold uppercase tracking-wider text-teal-400">📦 Found Item Details</p>
                      <p className="mt-1 font-semibold text-white">{claim.found_item_title}</p>
                      {claim.found_description && (
                        <p className="mt-1.5 text-slate-300 italic border-l-2 border-teal-500/50 pl-2">"{claim.found_description}"</p>
                      )}
                      <div className="mt-2 flex gap-3 text-slate-400">
                        {claim.found_brand && <span>Brand: <strong className="text-slate-200">{claim.found_brand}</strong></span>}
                        {claim.found_color && <span>Color: <strong className="text-slate-200">{claim.found_color}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* EVIDENCE DOSSIER FOR ADMIN VERIFICATION */}
                  <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <span>🛡️</span> Ownership Evidence &amp; Verification Dossier
                      </h4>
                      <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                        {claim.evidence && claim.evidence.length > 0 ? `${claim.evidence.length} piece(s) of evidence` : "No evidence attached"}
                      </span>
                    </div>

                    {claim.evidence && claim.evidence.length > 0 ? (
                      <div className="space-y-2.5">
                        {claim.evidence.map((ev, idx) => (
                          <div key={ev.evidence_id || idx} className="rounded-lg border border-slate-700/60 bg-slate-900/90 p-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                                {ev.evidence_type === "PURCHASE_PROOF" ? "🧾 Purchase Proof / Invoice" :
                                 ev.evidence_type === "UNIQUE_MARK" ? "🔍 Unique Mark / Scratch / Serial No." :
                                 ev.evidence_type === "DESCRIPTION" ? "📝 Private Item Description" : "📎 Other Evidence"}
                              </span>
                              <span className="text-[10px] text-slate-500">{new Date(ev.submitted_at).toLocaleString()}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-100 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed font-mono">
                              {ev.evidence_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-700 p-3 text-center text-xs text-slate-400">
                        ⚠️ No evidence submitted by claimant yet.
                      </div>
                    )}

                    {/* MODERATOR ESCALATION NOTES */}
                    {claim.reviews && claim.reviews.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-cyan-900/40">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-2">
                          📋 Previous Review Notes:
                        </p>
                        <div className="space-y-1.5">
                          {claim.reviews.map((rev, idx) => (
                            <div key={rev.review_id || idx} className="rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-indigo-300">
                                  {rev.reviewer_name} ({rev.reviewer_role}) · {rev.decision}
                                </span>
                                <span className="text-[10px] text-slate-500">{new Date(rev.reviewed_at).toLocaleString()}</span>
                              </div>
                              {rev.review_comments && (
                                <p className="mt-1 text-slate-300 italic">"{rev.review_comments}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor={`comments-${claim.claim_id}`}
                      className="mb-2 block text-sm font-semibold text-slate-300"
                    >
                      Admin Review Comments
                    </label>
                    <textarea
                      id={`comments-${claim.claim_id}`}
                      value={comments[claim.claim_id] || ""}
                      onChange={(e) => setComments((prev) => ({ ...prev, [claim.claim_id]: e.target.value }))}
                      placeholder="Enter the reason for your decision..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => reviewClaim(claim.claim_id, "APPROVE")}
                      disabled={processing === claim.claim_id}
                      className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-100 shadow-lg shadow-emerald-900/40"
                    >
                      {processing === claim.claim_id ? "Processing..." : "✅ Approve Claim"}
                    </button>
                    <button
                      onClick={() => reviewClaim(claim.claim_id, "REJECT")}
                      disabled={processing === claim.claim_id}
                      className="rounded-xl bg-red-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-100"
                    >
                      {processing === claim.claim_id ? "Processing..." : "❌ Reject Claim"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* APPROVED CLAIMS - HANDOVER */}
        <section className="border-t border-slate-800 pt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold">✅ Approved Claims — Item Handover</h2>
            <p className="mt-1 text-sm text-slate-400">
              Complete the handover after the physical item has been given to the verified claimant.
            </p>
          </div>

          {approvedClaims.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-10 text-center backdrop-blur">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="font-bold text-white">No Approved Claims Awaiting Handover</h3>
              <p className="mt-2 text-sm text-slate-400">Claims approved by an administrator will appear here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {approvedClaims.map((claim) => (
                <article
                  key={claim.claim_id}
                  className="rounded-2xl border border-emerald-900/40 bg-slate-900/80 p-5 backdrop-blur sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">Claim #{claim.claim_id}</p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {claim.lost_item_title || claim.found_item_title || `Ownership Claim #${claim.claim_id}`}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        Claimant: User {claim.claimant_id} · Lost #{claim.lost_report_id} · Found #{claim.found_report_id}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-700/50 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-300">
                      ✅ APPROVED
                    </span>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => completeHandover(claim.claim_id)}
                      disabled={handingOver === claim.claim_id || processing === claim.claim_id}
                      className="rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 px-6 py-2.5 text-sm font-bold text-white hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-100 shadow-lg shadow-cyan-900/40"
                    >
                      {handingOver === claim.claim_id ? "Completing handover..." : "🤝 Complete Handover"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 text-center text-xs text-slate-700">
          LOSTLINK ADMINISTRATION · PES UNIVERSITY RR CAMPUS
        </footer>
      </div>
    </main>
  );
}
