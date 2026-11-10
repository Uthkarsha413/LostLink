"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Claim = {
  claim_id: number;
  claim_status: string;
  submitted_at: string;
  claimant_id: number;
  claimant_name: string;
  finder_id?: number;
  finder_name?: string;
  lost_report_id: number;
  lost_item_title: string;
  found_report_id: number;
  found_item_title: string;
  is_claimant?: boolean | number;
  is_finder?: boolean | number;
  otp_verified?: boolean | number;
  finder_confirmed?: boolean | number;
  claimant_confirmed?: boolean | number;
};

type EvidenceType =
  | "PURCHASE_PROOF"
  | "UNIQUE_MARK"
  | "DESCRIPTION"
  | "OTHER";

const evidenceOptions: { value: EvidenceType; label: string }[] = [
  { value: "PURCHASE_PROOF", label: "Purchase proof" },
  { value: "UNIQUE_MARK", label: "Unique mark or feature" },
  { value: "DESCRIPTION", label: "Item description" },
  { value: "OTHER", label: "Other evidence" },
];

interface HandoverDetail {
  claimId: number;
  claimStatus: string;
  lostReportId: number;
  foundReportId: number;
  lostItemTitle: string;
  foundItemTitle: string;
  claimantId: number;
  claimantName: string;
  finderId: number;
  finderName: string;
  userRole: {
    isClaimant: boolean;
    isFinder: boolean;
    isAdmin: boolean;
  };
  otpState: {
    generated: boolean;
    active: boolean;
    expiresAt: string | null;
    attemptsRemaining: number;
    verified: boolean;
    verifiedAt: string | null;
  };
  confirmationState: {
    finderConfirmed: boolean;
    finderConfirmedAt: string | null;
    claimantConfirmed: boolean;
    claimantConfirmedAt: string | null;
    bothConfirmed: boolean;
    isCompleted: boolean;
  };
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Record<number, EvidenceType>>({});
  const [evidenceTexts, setEvidenceTexts] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});

  // Finder contact details
  const [finderContacts, setFinderContacts] = useState<
    Record<number, { finderName: string; phoneNumber: string | null; email: string | null }>
  >({});
  const [contactLoadingId, setContactLoadingId] = useState<number | null>(null);
  const [contactMessages, setContactMessages] = useState<Record<number, string>>({});

  // Handover state
  const [handovers, setHandovers] = useState<Record<number, HandoverDetail>>({});
  const [activeOtps, setActiveOtps] = useState<Record<number, { otp: string; expiresAt: string }>>({});
  const [inputOtps, setInputOtps] = useState<Record<number, string>>({});
  const [verifyingOtpId, setVerifyingOtpId] = useState<number | null>(null);
  const [generatingOtpId, setGeneratingOtpId] = useState<number | null>(null);
  const [confirmingPartyId, setConfirmingPartyId] = useState<number | null>(null);
  const [handoverMessages, setHandoverMessages] = useState<Record<number, { text: string; error?: boolean }>>({});

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/claims");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load claims.");
      }

      const claimList = result.data || [];
      setClaims(claimList);

      // Auto-load handover details for approved or handed over claims
      claimList.forEach((c: Claim) => {
        if (c.claim_status === "APPROVED" || c.claim_status === "HANDED_OVER") {
          loadHandoverDetail(c.claim_id);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHandoverDetail = useCallback(async (claimId: number) => {
    try {
      const res = await fetch(`/api/claims/${claimId}/handover`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) {
        setHandovers((prev) => ({ ...prev, [claimId]: json.data }));
      }
    } catch (e) {
      console.error(`Failed to load handover for claim ${claimId}:`, e);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  async function generateOtp(claimId: number) {
    try {
      setGeneratingOtpId(claimId);
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: "" } }));

      const res = await fetch(`/api/claims/${claimId}/handover/otp`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to generate OTP.");
      }

      setActiveOtps((prev) => ({
        ...prev,
        [claimId]: { otp: json.data.otp, expiresAt: json.data.expiresAt },
      }));

      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: "Handover OTP generated! Share this 6-digit code with the finder in person.",
          error: false,
        },
      }));

      await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: err instanceof Error ? err.message : "Unable to generate OTP.",
          error: true,
        },
      }));
    } finally {
      setGeneratingOtpId(null);
    }
  }

  async function verifyOtp(claimId: number) {
    const otp = inputOtps[claimId]?.trim();
    if (!otp || !/^\d{6}$/.test(otp)) {
      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: { text: "Please enter a valid 6-digit numeric OTP.", error: true },
      }));
      return;
    }

    try {
      setVerifyingOtpId(claimId);
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: "" } }));

      const res = await fetch(`/api/claims/${claimId}/handover/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "OTP verification failed.");
      }

      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: "✓ OTP verified successfully! Now confirm physical handover below.",
          error: false,
        },
      }));

      await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: err instanceof Error ? err.message : "Failed to verify OTP.",
          error: true,
        },
      }));
    } finally {
      setVerifyingOtpId(null);
    }
  }

  async function confirmFinder(claimId: number, confirmed: boolean) {
    try {
      setConfirmingPartyId(claimId);
      const res = await fetch(`/api/claims/${claimId}/handover/confirm-finder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Confirmation failed.");
      }

      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: json.completed
            ? "🎉 Both parties confirmed! Item has been successfully recovered."
            : "Handover confirmed by finder. Waiting for confirmation from the owner.",
          error: false,
        },
      }));

      await loadClaims();
      await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: err instanceof Error ? err.message : "Failed to confirm handover.",
          error: true,
        },
      }));
    } finally {
      setConfirmingPartyId(null);
    }
  }

  async function confirmOwner(claimId: number, confirmed: boolean) {
    try {
      setConfirmingPartyId(claimId);
      const res = await fetch(`/api/claims/${claimId}/handover/confirm-owner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Confirmation failed.");
      }

      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: json.completed
            ? "🎉 Both parties confirmed! Item has been successfully recovered."
            : "Receipt confirmed by owner. Waiting for confirmation from the finder.",
          error: false,
        },
      }));

      await loadClaims();
      await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({
        ...prev,
        [claimId]: {
          text: err instanceof Error ? err.message : "Failed to confirm receipt.",
          error: true,
        },
      }));
    } finally {
      setConfirmingPartyId(null);
    }
  }

  async function submitEvidence(claimId: number) {
    const evidenceText = evidenceTexts[claimId]?.trim();
    const evidenceType = selectedTypes[claimId] || "DESCRIPTION";

    if (!evidenceText) {
      setMessages((prev) => ({
        ...prev,
        [claimId]: "Please enter your evidence before submitting.",
      }));
      return;
    }

    try {
      setSubmittingId(claimId);
      setMessages((prev) => ({ ...prev, [claimId]: "" }));

      const response = await fetch(`/api/claims/${claimId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceType, evidenceText }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Evidence submission failed.");
      }

      setMessages((prev) => ({
        ...prev,
        [claimId]: "Evidence submitted successfully!",
      }));

      setEvidenceTexts((prev) => ({ ...prev, [claimId]: "" }));
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [claimId]: err instanceof Error ? err.message : "Unable to submit evidence.",
      }));
    } finally {
      setSubmittingId(null);
    }
  }

  async function viewFinderContact(claimId: number) {
    try {
      setContactLoadingId(claimId);
      setContactMessages((prev) => ({ ...prev, [claimId]: "" }));

      const response = await fetch(`/api/claims/${claimId}/finder-contact`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to retrieve finder contact.");
      }

      setFinderContacts((prev) => ({ ...prev, [claimId]: result.data }));
    } catch (err) {
      setContactMessages((prev) => ({
        ...prev,
        [claimId]: err instanceof Error ? err.message : "Unable to retrieve finder contact.",
      }));
    } finally {
      setContactLoadingId(null);
    }
  }

  function statusColor(status: string) {
    if (status === "HANDED_OVER") {
      return "text-emerald-700 bg-emerald-100 border border-emerald-300";
    }
    if (status === "APPROVED") {
      return "text-green-700 bg-green-100 border border-green-300";
    }
    if (status === "REJECTED") {
      return "text-red-700 bg-red-100 border border-red-300";
    }
    return "text-amber-700 bg-amber-100 border border-amber-300";
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10 sm:px-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-4xl">
        {/* Top Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              LostLink Verification
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
              Ownership Claims & Secure Handover
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Track your submitted claims, submit evidence, and execute secure OTP-verified item handovers.
            </p>
          </div>

          <button
            onClick={loadClaims}
            disabled={loading}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700/70 disabled:opacity-50 transition-colors"
          >
            {loading ? "Refreshing..." : "↻ Refresh Claims"}
          </button>
        </div>

        {/* Global Loading / Error */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-8 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
            <p className="mt-2 text-sm">Loading ownership claims...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && claims.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-12 text-center shadow-sm">
            <div className="text-4xl">📂</div>
            <h3 className="mt-3 font-bold text-slate-900 dark:text-white text-lg">No claims found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              When an item is matched and an ownership claim is submitted, it will appear here.
            </p>
            <Link
              href="/matches"
              className="mt-5 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110"
            >
              Browse AI Matches
            </Link>
          </div>
        )}

        {/* Claims List */}
        <div className="space-y-8">
          {claims.map((claim) => {
            const canSubmitEvidence = [
              "SUBMITTED",
              "AI_REVIEW_PENDING",
              "MODERATOR_REVIEW",
              "ADMIN_REVIEW",
            ].includes(claim.claim_status);

            const isApprovedOrHandedOver = ["APPROVED", "HANDED_OVER"].includes(
              claim.claim_status
            );

            const handover = handovers[claim.claim_id];
            const activeOtp = activeOtps[claim.claim_id];
            const isUserClaimant = Boolean(claim.is_claimant);
            const isUserFinder = Boolean(claim.is_finder);

            return (
              <section
                key={claim.claim_id}
                className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm backdrop-blur"
              >
                {/* Header */}
                <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                          Claim #{claim.claim_id}
                        </span>
                        {isUserClaimant && (
                          <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                            YOU ARE OWNER
                          </span>
                        )}
                        {isUserFinder && (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                            YOU ARE FINDER
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                        {claim.lost_item_title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Submitted: {new Date(claim.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(
                          claim.claim_status
                        )}`}
                      >
                        {claim.claim_status.replaceAll("_", " ")}
                      </span>
                      <Link
                        href={`/reports/${claim.lost_report_id}/timeline`}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="View 9-Stage Timeline"
                      >
                        🧭 Track Timeline
                      </Link>
                    </div>
                  </div>

                  {/* Summary of Lost and Found reports */}
                  <div className="mt-4 grid gap-3 rounded-xl bg-white dark:bg-slate-900/60 p-3.5 border border-slate-200/80 dark:border-slate-800 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-400">
                        Lost Item (Claimant)
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{claim.lost_item_title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Report #{claim.lost_report_id}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-400">
                        Found Item (Finder)
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{claim.found_item_title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Report #{claim.found_report_id}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-6">
                  {/* SECURE HANDOVER WORKFLOW (WHEN APPROVED OR COMPLETED) */}
                  {isApprovedOrHandedOver && (
                    <div className="rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-50/40 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-xs">
                            🔐
                          </span>
                          <h4 className="text-lg font-bold text-slate-900">
                            Secure Handover & Dual Confirmation
                          </h4>
                        </div>
                        {handover?.confirmationState.bothConfirmed && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold">
                            ✓ RECOVERED
                          </span>
                        )}
                      </div>

                      {/* Notification message */}
                      {handoverMessages[claim.claim_id]?.text && (
                        <div
                          className={`mt-4 rounded-xl p-3.5 text-sm font-medium ${
                            handoverMessages[claim.claim_id].error
                              ? "bg-red-50 border border-red-200 text-red-700"
                              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                          }`}
                        >
                          {handoverMessages[claim.claim_id].text}
                        </div>
                      )}

                      {/* STEP 1: OTP GENERATION (FOR OWNER) */}
                      {(isUserClaimant || handover?.userRole?.isAdmin) && (
                        <div className="mt-5 rounded-xl border border-cyan-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm">
                                Step 1 — Owner Handover OTP
                              </h5>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Generate a single-use 6-digit code. Share this code with the finder in person.
                              </p>
                            </div>
                            <button
                              onClick={() => generateOtp(claim.claim_id)}
                              disabled={
                                generatingOtpId === claim.claim_id ||
                                handover?.confirmationState.isCompleted ||
                                handover?.otpState.verified
                              }
                              className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                            >
                              {generatingOtpId === claim.claim_id
                                ? "Generating..."
                                : activeOtp
                                ? "↻ Regenerate OTP"
                                : "🔑 Generate Handover OTP"}
                            </button>
                          </div>

                          {/* Plaintext OTP display if generated */}
                          {activeOtp && (
                            <div className="mt-4 rounded-xl border border-cyan-300 bg-cyan-50/70 p-4 text-center">
                              <p className="text-xs font-bold tracking-wider uppercase text-cyan-800">
                                Your Secure 6-Digit Handover Code
                              </p>
                              <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-cyan-900 font-mono">
                                {activeOtp.otp}
                              </div>
                              <p className="mt-2 text-xs text-cyan-700 font-medium">
                                ⏱ Valid for 10 minutes (expires:{" "}
                                {new Date(activeOtp.expiresAt).toLocaleTimeString()})
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                Show this to the finder during physical item handover.
                              </p>
                            </div>
                          )}

                          {handover?.otpState.verified && (
                            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium">
                              ✓ OTP has been verified by the finder at{" "}
                              {handover.otpState.verifiedAt &&
                                new Date(handover.otpState.verifiedAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 2: FINDER OTP VERIFICATION (FOR FINDER) */}
                      {(isUserFinder || handover?.userRole?.isAdmin) && (
                        <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
                          <h5 className="font-bold text-slate-900 text-sm">
                            Step 2 — Finder Verification
                          </h5>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ask the owner for their 6-digit OTP and enter it below to verify their identity.
                          </p>

                          {handover?.otpState.verified ? (
                            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
                              ✓ OTP Verified Successfully! Proceed to confirm item handover below.
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="Enter 6-digit OTP"
                                value={inputOtps[claim.claim_id] || ""}
                                onChange={(e) =>
                                  setInputOtps((prev) => ({
                                    ...prev,
                                    [claim.claim_id]: e.target.value.replace(/\D/g, ""),
                                  }))
                                }
                                className="w-44 rounded-lg border border-slate-300 p-2 text-center text-lg font-mono font-bold tracking-widest outline-none focus:border-cyan-500"
                              />
                              <button
                                onClick={() => verifyOtp(claim.claim_id)}
                                disabled={verifyingOtpId === claim.claim_id}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {verifyingOtpId === claim.claim_id
                                  ? "Verifying..."
                                  : "Verify OTP"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 3 & 4: DUAL CONFIRMATIONS */}
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {/* Finder Handover Confirmation Card */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <span className="text-xs font-bold uppercase text-slate-500">
                            Finder Confirmation
                          </span>
                          <p className="mt-1 font-semibold text-slate-800 text-sm">
                            &quot;Have you physically handed over this item to its rightful owner?&quot;
                          </p>

                          {handover?.confirmationState.finderConfirmed ? (
                            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium">
                              ✓ Handover confirmed by Finder
                            </div>
                          ) : isUserFinder || handover?.userRole?.isAdmin ? (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => confirmFinder(claim.claim_id, true)}
                                disabled={
                                  confirmingPartyId === claim.claim_id ||
                                  !handover?.otpState.verified
                                }
                                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              >
                                Yes, I handed it over
                              </button>
                              <button
                                onClick={() => confirmFinder(claim.claim_id, false)}
                                disabled={confirmingPartyId === claim.claim_id}
                                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              >
                                Not yet
                              </button>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-500">
                              Awaiting confirmation from finder.
                            </p>
                          )}
                        </div>

                        {/* Owner Receipt Confirmation Card */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <span className="text-xs font-bold uppercase text-slate-500">
                            Owner Confirmation
                          </span>
                          <p className="mt-1 font-semibold text-slate-800 text-sm">
                            &quot;Have you received your lost item?&quot;
                          </p>

                          {handover?.confirmationState.claimantConfirmed ? (
                            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium">
                              ✓ Receipt confirmed by Owner
                            </div>
                          ) : isUserClaimant || handover?.userRole?.isAdmin ? (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => confirmOwner(claim.claim_id, true)}
                                disabled={
                                  confirmingPartyId === claim.claim_id ||
                                  !handover?.otpState.verified
                                }
                                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                Yes, I received my item
                              </button>
                              <button
                                onClick={() => confirmOwner(claim.claim_id, false)}
                                disabled={confirmingPartyId === claim.claim_id}
                                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              >
                                Not yet
                              </button>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-500">
                              Awaiting confirmation from owner.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dual Confirmation Status Banner */}
                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-100/70 p-3.5 text-center text-xs">
                        {handover?.confirmationState.bothConfirmed ? (
                          <div className="text-emerald-800 font-bold text-sm">
                            🎉 Both parties have confirmed! Transaction complete & item successfully recovered.
                          </div>
                        ) : handover?.confirmationState.finderConfirmed ? (
                          <span className="text-slate-700 font-medium">
                            Finder confirmed. Waiting for confirmation from the owner.
                          </span>
                        ) : handover?.confirmationState.claimantConfirmed ? (
                          <span className="text-slate-700 font-medium">
                            Owner confirmed. Waiting for confirmation from the finder.
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Handover in progress. Both parties must confirm before the item is marked as recovered.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info (if available) */}
                  {isApprovedOrHandedOver && (
                    <div className="border-t border-slate-200 pt-5">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        Finder Contact Details
                      </h4>
                      {!finderContacts[claim.claim_id] && (
                        <button
                          onClick={() => viewFinderContact(claim.claim_id)}
                          disabled={contactLoadingId === claim.claim_id}
                          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {contactLoadingId === claim.claim_id
                            ? "Loading contact..."
                            : "View finder contact"}
                        </button>
                      )}
                      {finderContacts[claim.claim_id] && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                          <p>
                            <strong>Name:</strong> {finderContacts[claim.claim_id].finderName}
                          </p>
                          {finderContacts[claim.claim_id].phoneNumber && (
                            <p>
                              <strong>Phone:</strong>{" "}
                              <a
                                href={`tel:${finderContacts[claim.claim_id].phoneNumber}`}
                                className="text-blue-600 underline"
                              >
                                {finderContacts[claim.claim_id].phoneNumber}
                              </a>
                            </p>
                          )}
                          {finderContacts[claim.claim_id].email && (
                            <p>
                              <strong>Email:</strong>{" "}
                              <a
                                href={`mailto:${finderContacts[claim.claim_id].email}`}
                                className="text-blue-600 underline"
                              >
                                {finderContacts[claim.claim_id].email}
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evidence Form if awaiting review */}
                  {canSubmitEvidence && (
                    <div className="border-t border-slate-200 pt-5">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        Submit Ownership Evidence
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Provide proof to help administrators verify your ownership claim.
                      </p>

                      <div className="mt-3 grid gap-3">
                        <select
                          value={selectedTypes[claim.claim_id] || "DESCRIPTION"}
                          onChange={(e) =>
                            setSelectedTypes((prev) => ({
                              ...prev,
                              [claim.claim_id]: e.target.value as EvidenceType,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                        >
                          {evidenceOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <textarea
                          value={evidenceTexts[claim.claim_id] || ""}
                          onChange={(e) =>
                            setEvidenceTexts((prev) => ({
                              ...prev,
                              [claim.claim_id]: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Describe identifying marks, serial numbers, or purchase details..."
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-blue-500"
                        />

                        <button
                          onClick={() => submitEvidence(claim.claim_id)}
                          disabled={submittingId === claim.claim_id}
                          className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {submittingId === claim.claim_id ? "Submitting..." : "Submit Evidence"}
                        </button>
                        {messages[claim.claim_id] && (
                          <p className="text-xs text-emerald-700 font-medium">
                            {messages[claim.claim_id]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
