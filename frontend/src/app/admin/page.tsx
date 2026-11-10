
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Claim = {
  claim_id: number;
  lost_report_id: number;
  found_report_id: number;
  claimant_id: number;
  claim_status: string;
  submitted_at: string;
  claimant_name?: string;
  lost_item_title?: string;
  found_item_title?: string;
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
      const response = await fetch("/api/claims", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Unable to load claims."
        );
      }

      const data = result.data ?? result.claims ?? [];
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  async function reviewClaim(
    claimId: number,
    decision: "APPROVE" | "REJECT"
  ) {
    const confirmation =
      decision === "APPROVE"
        ? "Approve this ownership claim?"
        : "Reject this ownership claim?";

    if (!window.confirm(confirmation)) return;

    setProcessing(claimId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/claims/${claimId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision,
          reviewComments: comments[claimId] || "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Review action failed."
        );
      }

      setMessage(
        result.message ||
          (decision === "APPROVE"
            ? "Claim approved successfully."
            : "Claim rejected successfully.")
      );

      await loadClaims();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setProcessing(null);
    }
  }

  async function completeHandover(claimId: number) {
    const confirmation = window.confirm(
      "Confirm that the item has physically been handed over to the claimant?"
    );

    if (!confirmation) return;

    setHandingOver(claimId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/claims/${claimId}/handover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Handover failed."
        );
      }

      setMessage(
        result.message || "Item handover completed successfully."
      );

      await loadClaims();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Handover failed."
      );
    } finally {
      setHandingOver(null);
    }
  }

  const pendingClaims = claims.filter(
    (claim) => claim.claim_status === "ADMIN_REVIEW"
  );

  const approvedClaims = claims.filter(
    (claim) => claim.claim_status === "APPROVED"
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <header className="mb-8 border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold tracking-[0.25em] text-cyan-400">
                LOSTLINK • ADMINISTRATION
              </p>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-slate-400 text-sm">
                Review escalated ownership claims, make final decisions,
                and monitor item handovers.
              </p>
            </div>

            {/* Navigation Switcher Tabs */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-1.5 border border-slate-800">
              <span className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md">
                Claims Review
              </span>
              <Link
                href="/admin/analytics"
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Analytics & Reports →
              </Link>
            </div>
          </div>
        </header>

        {/* MESSAGES */}
        {message && (
          <div className="mb-5 rounded-lg border border-green-700 bg-green-950/40 p-4 text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-700 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* CLAIMS AWAITING ADMIN REVIEW */}
        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Claims awaiting decision
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {pendingClaims.length} claim(s) awaiting admin review
              </p>
            </div>

            <button
              onClick={loadClaims}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Loading claims...
            </div>
          ) : pendingClaims.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
              <h3 className="text-lg font-semibold">
                No claims awaiting review
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Escalated claims will appear here when they are ready
                for an administrator decision.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingClaims.map((claim) => (
                <article
                  key={claim.claim_id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg sm:p-6"
                >
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">
                        Claim #{claim.claim_id}
                      </p>

                      <h3 className="mt-1 text-xl font-bold">
                        {claim.lost_item_title ||
                          claim.found_item_title ||
                          `Ownership Claim #${claim.claim_id}`}
                      </h3>
                    </div>

                    <span className="rounded-full border border-amber-700 bg-amber-950/50 px-3 py-1 text-xs font-semibold text-amber-300">
                      ADMIN REVIEW
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-800/70 p-4">
                      <p className="text-xs font-semibold tracking-wider text-slate-400">
                        CLAIMANT
                      </p>

                      <p className="mt-2 font-semibold">
                        {claim.claimant_name ||
                          `User ${claim.claimant_id}`}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        User ID: {claim.claimant_id}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Submitted:{" "}
                        {claim.submitted_at
                          ? new Date(claim.submitted_at).toLocaleString()
                          : "Not available"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-800/70 p-4">
                      <p className="text-xs font-semibold tracking-wider text-slate-400">
                        RELATED REPORTS
                      </p>

                      <p className="mt-2 text-sm">
                        Lost report:{" "}
                        <span className="font-semibold">
                          #{claim.lost_report_id}
                        </span>
                      </p>

                      <p className="mt-1 text-sm">
                        Found report:{" "}
                        <span className="font-semibold">
                          #{claim.found_report_id}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor={`comments-${claim.claim_id}`}
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Admin review comments
                    </label>

                    <textarea
                      id={`comments-${claim.claim_id}`}
                      value={comments[claim.claim_id] || ""}
                      onChange={(event) =>
                        setComments((previous) => ({
                          ...previous,
                          [claim.claim_id]: event.target.value,
                        }))
                      }
                      placeholder="Enter the reason for your decision..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        reviewClaim(claim.claim_id, "APPROVE")
                      }
                      disabled={processing === claim.claim_id}
                      className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                    >
                      {processing === claim.claim_id
                        ? "Processing..."
                        : "Approve Claim"}
                    </button>

                    <button
                      onClick={() =>
                        reviewClaim(claim.claim_id, "REJECT")
                      }
                      disabled={processing === claim.claim_id}
                      className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                    >
                      {processing === claim.claim_id
                        ? "Processing..."
                        : "Reject Claim"}
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
            <h2 className="text-xl font-semibold">
              Approved claims — Item handover
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Complete the handover after the physical item has been
              given to the verified claimant.
            </p>
          </div>

          {approvedClaims.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
              <h3 className="font-semibold">
                No approved claims awaiting handover
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Claims approved by an administrator will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {approvedClaims.map((claim) => (
                <article
                  key={claim.claim_id}
                  className="rounded-xl border border-green-900 bg-slate-900 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">
                        Claim #{claim.claim_id}
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        {claim.lost_item_title ||
                          claim.found_item_title ||
                          `Ownership Claim #${claim.claim_id}`}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        Claimant: User {claim.claimant_id}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Lost Report: #{claim.lost_report_id}
                        {" • "}
                        Found Report: #{claim.found_report_id}
                      </p>
                    </div>

                    <span className="rounded-full border border-green-700 bg-green-950/50 px-3 py-1 text-xs font-semibold text-green-300">
                      APPROVED
                    </span>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => completeHandover(claim.claim_id)}
                      disabled={
                        handingOver === claim.claim_id ||
                        processing === claim.claim_id
                      }
                      className="rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-50"
                    >
                      {handingOver === claim.claim_id
                        ? "Completing handover..."
                        : "Complete Handover"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
