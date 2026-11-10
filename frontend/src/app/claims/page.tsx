"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Claim = {
  claim_id: number; claim_status: string; submitted_at: string; claimant_id: number;
  claimant_name: string; finder_id?: number; finder_name?: string;
  lost_report_id: number; lost_item_title: string; found_report_id: number; found_item_title: string;
  is_claimant?: boolean | number; is_finder?: boolean | number; otp_verified?: boolean | number;
  finder_confirmed?: boolean | number; claimant_confirmed?: boolean | number;
};

type EvidenceType = "PURCHASE_PROOF" | "UNIQUE_MARK" | "DESCRIPTION" | "OTHER";

const evidenceOptions: { value: EvidenceType; label: string }[] = [
  { value: "PURCHASE_PROOF", label: "🧾 Purchase proof" },
  { value: "UNIQUE_MARK", label: "🔍 Unique mark or feature" },
  { value: "DESCRIPTION", label: "📝 Item description" },
  { value: "OTHER", label: "📎 Other evidence" },
];

interface HandoverDetail {
  claimId: number; claimStatus: string; lostReportId: number; foundReportId: number;
  lostItemTitle: string; foundItemTitle: string; claimantId: number; claimantName: string;
  finderId: number; finderName: string;
  userRole: { isClaimant: boolean; isFinder: boolean; isAdmin: boolean; };
  otpState: { generated: boolean; active: boolean; expiresAt: string | null; attemptsRemaining: number; verified: boolean; verifiedAt: string | null; };
  confirmationState: { finderConfirmed: boolean; finderConfirmedAt: string | null; claimantConfirmed: boolean; claimantConfirmedAt: string | null; bothConfirmed: boolean; isCompleted: boolean; };
}

function statusBadge(status: string) {
  if (status === "HANDED_OVER") return "border-emerald-700/60 bg-emerald-950/40 text-emerald-300";
  if (status === "APPROVED") return "border-cyan-700/60 bg-cyan-950/40 text-cyan-300";
  if (status === "REJECTED") return "border-red-700/60 bg-red-950/40 text-red-300";
  return "border-amber-700/60 bg-amber-950/40 text-amber-300";
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Record<number, EvidenceType>>({});
  const [evidenceTexts, setEvidenceTexts] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [finderContacts, setFinderContacts] = useState<Record<number, { finderName: string; phoneNumber: string | null; email: string | null }>>({});
  const [contactLoadingId, setContactLoadingId] = useState<number | null>(null);
  const [contactMessages, setContactMessages] = useState<Record<number, string>>({});
  const [handovers, setHandovers] = useState<Record<number, HandoverDetail>>({});
  const [activeOtps, setActiveOtps] = useState<Record<number, { otp: string; expiresAt: string }>>({});
  const [inputOtps, setInputOtps] = useState<Record<number, string>>({});
  const [verifyingOtpId, setVerifyingOtpId] = useState<number | null>(null);
  const [generatingOtpId, setGeneratingOtpId] = useState<number | null>(null);
  const [confirmingPartyId, setConfirmingPartyId] = useState<number | null>(null);
  const [handoverMessages, setHandoverMessages] = useState<Record<number, { text: string; error?: boolean }>>({});

  const loadHandoverDetail = useCallback(async (claimId: number) => {
    try {
      const res = await fetch(`/api/claims/${claimId}/handover`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) setHandovers((prev) => ({ ...prev, [claimId]: json.data }));
    } catch (e) { console.error(`Failed to load handover for claim ${claimId}:`, e); }
  }, []);

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const response = await fetch("/api/claims");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to load claims.");
      const claimList = result.data || [];
      setClaims(claimList);
      claimList.forEach((c: Claim) => {
        if (c.claim_status === "APPROVED" || c.claim_status === "HANDED_OVER") loadHandoverDetail(c.claim_id);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [loadHandoverDetail]);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  async function generateOtp(claimId: number) {
    try {
      setGeneratingOtpId(claimId);
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: "" } }));
      const res = await fetch(`/api/claims/${claimId}/handover/otp`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to generate OTP.");
      setActiveOtps((prev) => ({ ...prev, [claimId]: { otp: json.data.otp, expiresAt: json.data.expiresAt } }));
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: "🔑 OTP generated! Share this code with the finder in person.", error: false } }));
      await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: err instanceof Error ? err.message : "Unable to generate OTP.", error: true } }));
    } finally { setGeneratingOtpId(null); }
  }

  async function verifyOtp(claimId: number) {
    const otp = inputOtps[claimId]?.trim();
    if (!otp || !/^\d{6}$/.test(otp)) {
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: "Please enter a valid 6-digit OTP.", error: true } }));
      return;
    }
    try {
      setVerifyingOtpId(claimId);
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: "" } }));
      const res = await fetch(`/api/claims/${claimId}/handover/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "OTP verification failed.");
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: "✅ OTP verified! Now confirm physical handover below.", error: false } }));
      await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: err instanceof Error ? err.message : "Failed to verify OTP.", error: true } }));
    } finally { setVerifyingOtpId(null); }
  }

  async function confirmFinder(claimId: number, confirmed: boolean) {
    try {
      setConfirmingPartyId(claimId);
      const res = await fetch(`/api/claims/${claimId}/handover/confirm-finder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Confirmation failed.");
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: json.completed ? "🎉 Both parties confirmed! Item recovered." : "Handover confirmed by finder. Waiting for owner.", error: false } }));
      await loadClaims(); await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: err instanceof Error ? err.message : "Failed to confirm.", error: true } }));
    } finally { setConfirmingPartyId(null); }
  }

  async function confirmOwner(claimId: number, confirmed: boolean) {
    try {
      setConfirmingPartyId(claimId);
      const res = await fetch(`/api/claims/${claimId}/handover/confirm-owner`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Confirmation failed.");
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: json.completed ? "🎉 Both parties confirmed! Item recovered." : "Receipt confirmed by owner. Waiting for finder.", error: false } }));
      await loadClaims(); await loadHandoverDetail(claimId);
    } catch (err) {
      setHandoverMessages((prev) => ({ ...prev, [claimId]: { text: err instanceof Error ? err.message : "Failed to confirm.", error: true } }));
    } finally { setConfirmingPartyId(null); }
  }

  async function submitEvidence(claimId: number) {
    const evidenceText = evidenceTexts[claimId]?.trim();
    const evidenceType = selectedTypes[claimId] || "DESCRIPTION";
    if (!evidenceText) { setMessages((prev) => ({ ...prev, [claimId]: "Please enter your evidence before submitting." })); return; }
    try {
      setSubmittingId(claimId); setMessages((prev) => ({ ...prev, [claimId]: "" }));
      const response = await fetch(`/api/claims/${claimId}/evidence`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidenceType, evidenceText }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Evidence submission failed.");
      setMessages((prev) => ({ ...prev, [claimId]: "✅ Evidence submitted successfully!" }));
      setEvidenceTexts((prev) => ({ ...prev, [claimId]: "" }));
    } catch (err) {
      setMessages((prev) => ({ ...prev, [claimId]: err instanceof Error ? err.message : "Unable to submit evidence." }));
    } finally { setSubmittingId(null); }
  }

  async function viewFinderContact(claimId: number) {
    try {
      setContactLoadingId(claimId); setContactMessages((prev) => ({ ...prev, [claimId]: "" }));
      const response = await fetch(`/api/claims/${claimId}/finder-contact`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to retrieve finder contact.");
      setFinderContacts((prev) => ({ ...prev, [claimId]: result.data }));
    } catch (err) {
      setContactMessages((prev) => ({ ...prev, [claimId]: err instanceof Error ? err.message : "Unable to retrieve finder contact." }));
    } finally { setContactLoadingId(null); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase mb-1">🔑 LostLink Verification</p>
            <h1 className="text-3xl font-black tracking-tight text-white">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                Claims &amp; Secure Handover
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Track your submitted claims, submit evidence, and execute secure OTP-verified item handovers.
            </p>
          </div>
          <button
            onClick={loadClaims}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-4 text-sm">Loading ownership claims...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && claims.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-14 text-center backdrop-blur">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-bold">No Claims Found</h3>
            <p className="mt-2 text-sm text-slate-400">
              When an item is matched and an ownership claim is submitted, it will appear here.
            </p>
            <Link
              href="/matches"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
            >
              🤖 Browse AI Matches
            </Link>
          </div>
        )}

        {/* Claims List */}
        <div className="space-y-8">
          {claims.map((claim) => {
            const canSubmitEvidence = ["SUBMITTED","AI_REVIEW_PENDING","MODERATOR_REVIEW","ADMIN_REVIEW"].includes(claim.claim_status);
            const isApprovedOrHandedOver = ["APPROVED","HANDED_OVER"].includes(claim.claim_status);
            const handover = handovers[claim.claim_id];
            const activeOtp = activeOtps[claim.claim_id];
            const isUserClaimant = Boolean(claim.is_claimant);
            const isUserFinder = Boolean(claim.is_finder);

            return (
              <section
                key={claim.claim_id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur transition-all hover:border-slate-700"
              >
                {/* Claim header */}
                <div className="border-b border-slate-800 bg-slate-800/40 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-500">Claim #{claim.claim_id}</span>
                        {isUserClaimant && (
                          <span className="rounded-full border border-blue-700/50 bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                            👤 YOU ARE OWNER
                          </span>
                        )}
                        {isUserFinder && (
                          <span className="rounded-full border border-emerald-700/50 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            📦 YOU ARE FINDER
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-xl font-bold text-white">{claim.lost_item_title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📅 Submitted: {new Date(claim.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadge(claim.claim_status)}`}>
                        {claim.claim_status.replaceAll("_", " ")}
                      </span>
                      <Link
                        href={`/reports/${claim.lost_report_id}/timeline`}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        🧭 Timeline
                      </Link>
                    </div>
                  </div>

                  {/* Report summary */}
                  <div className="mt-4 grid gap-3 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-500">🔍 Lost Item (Claimant)</span>
                      <p className="font-semibold text-white mt-1">{claim.lost_item_title}</p>
                      <p className="text-xs text-slate-500">Report #{claim.lost_report_id}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-500">📦 Found Item (Finder)</span>
                      <p className="font-semibold text-white mt-1">{claim.found_item_title}</p>
                      <p className="text-xs text-slate-500">Report #{claim.found_report_id}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-6">
                  {/* SECURE HANDOVER WORKFLOW */}
                  {isApprovedOrHandedOver && (
                    <div className="rounded-2xl border-2 border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 to-blue-950/20 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/30 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm">🔐</span>
                          <h4 className="text-lg font-bold text-white">Secure Handover &amp; Dual Confirmation</h4>
                        </div>
                        {handover?.confirmationState.bothConfirmed && (
                          <span className="rounded-full border border-emerald-700/50 bg-emerald-950/40 px-3 py-1 text-xs font-bold text-emerald-300">
                            🎉 RECOVERED
                          </span>
                        )}
                      </div>

                      {/* Status message */}
                      {handoverMessages[claim.claim_id]?.text && (
                        <div className={`mt-4 rounded-xl p-3.5 text-sm font-medium ${
                          handoverMessages[claim.claim_id].error
                            ? "border border-red-800 bg-red-950/40 text-red-300"
                            : "border border-emerald-800 bg-emerald-950/40 text-emerald-300"
                        }`}>
                          {handoverMessages[claim.claim_id].text}
                        </div>
                      )}

                      {/* STEP 1: OTP Generation (Owner) */}
                      {(isUserClaimant || handover?.userRole?.isAdmin) && (
                        <div className="mt-5 rounded-xl border border-cyan-800/40 bg-slate-900/60 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h5 className="font-bold text-white text-sm">Step 1 — Owner Handover OTP</h5>
                              <p className="text-xs text-slate-400 mt-0.5">Generate a single-use 6-digit code and share it with the finder in person.</p>
                            </div>
                            <button
                              onClick={() => generateOtp(claim.claim_id)}
                              disabled={generatingOtpId === claim.claim_id || handover?.confirmationState.isCompleted || handover?.otpState.verified}
                              className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all"
                            >
                              {generatingOtpId === claim.claim_id ? "Generating..." : activeOtp ? "↻ Regenerate OTP" : "🔑 Generate OTP"}
                            </button>
                          </div>

                          {activeOtp && (
                            <div className="mt-4 rounded-xl border border-cyan-700/50 bg-cyan-950/30 p-5 text-center">
                              <p className="text-xs font-bold tracking-widest uppercase text-cyan-400">Your Secure 6-Digit Handover Code</p>
                              <div className="mt-3 text-4xl font-black tracking-[0.35em] text-cyan-300 font-mono drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                {activeOtp.otp}
                              </div>
                              <p className="mt-3 text-xs text-cyan-500 font-medium">
                                ⏱ Expires: {new Date(activeOtp.expiresAt).toLocaleTimeString()} (10 minutes)
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">Show this to the finder during the physical item handover only.</p>
                            </div>
                          )}

                          {handover?.otpState.verified && (
                            <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/40 p-2.5 text-xs text-emerald-300 font-medium">
                              ✅ OTP verified by the finder at {handover.otpState.verifiedAt && new Date(handover.otpState.verifiedAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 2: Finder OTP Verification */}
                      {(isUserFinder || handover?.userRole?.isAdmin) && (
                        <div className="mt-5 rounded-xl border border-emerald-800/40 bg-slate-900/60 p-4">
                          <h5 className="font-bold text-white text-sm">Step 2 — Finder Verification</h5>
                          <p className="text-xs text-slate-400 mt-0.5">Ask the owner for their 6-digit OTP and enter it to verify their identity.</p>

                          {handover?.otpState.verified ? (
                            <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-medium">
                              ✅ OTP Verified! Proceed to confirm item handover below.
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={inputOtps[claim.claim_id] || ""}
                                onChange={(e) => setInputOtps((prev) => ({ ...prev, [claim.claim_id]: e.target.value.replace(/\D/g, "") }))}
                                className="w-40 rounded-xl border border-slate-700 bg-slate-800 p-3 text-center text-2xl font-black tracking-[0.3em] text-cyan-300 font-mono outline-none focus:border-cyan-500 transition-colors"
                              />
                              <button
                                onClick={() => verifyOtp(claim.claim_id)}
                                disabled={verifyingOtpId === claim.claim_id}
                                className="rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all"
                              >
                                {verifyingOtpId === claim.claim_id ? "Verifying..." : "✓ Verify OTP"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 3 & 4: Dual Confirmations */}
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {/* Finder Confirmation */}
                        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                          <span className="text-xs font-bold uppercase text-slate-400">📦 Finder Confirmation</span>
                          <p className="mt-2 font-semibold text-slate-200 text-sm">&quot;Have you physically handed over this item?&quot;</p>

                          {handover?.confirmationState.finderConfirmed ? (
                            <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/40 p-2.5 text-xs text-emerald-300 font-medium">
                              ✅ Handover confirmed by Finder
                            </div>
                          ) : isUserFinder || handover?.userRole?.isAdmin ? (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => confirmFinder(claim.claim_id, true)}
                                disabled={confirmingPartyId === claim.claim_id || !handover?.otpState.verified}
                                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-all"
                              >
                                ✓ Yes, I handed it over
                              </button>
                              <button
                                onClick={() => confirmFinder(claim.claim_id, false)}
                                disabled={confirmingPartyId === claim.claim_id}
                                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                              >
                                Not yet
                              </button>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-500">Awaiting confirmation from finder.</p>
                          )}
                        </div>

                        {/* Owner Confirmation */}
                        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                          <span className="text-xs font-bold uppercase text-slate-400">👤 Owner Confirmation</span>
                          <p className="mt-2 font-semibold text-slate-200 text-sm">&quot;Have you received your lost item?&quot;</p>

                          {handover?.confirmationState.claimantConfirmed ? (
                            <div className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/40 p-2.5 text-xs text-emerald-300 font-medium">
                              ✅ Receipt confirmed by Owner
                            </div>
                          ) : isUserClaimant || handover?.userRole?.isAdmin ? (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => confirmOwner(claim.claim_id, true)}
                                disabled={confirmingPartyId === claim.claim_id || !handover?.otpState.verified}
                                className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-all"
                              >
                                ✓ Yes, I received it
                              </button>
                              <button
                                onClick={() => confirmOwner(claim.claim_id, false)}
                                disabled={confirmingPartyId === claim.claim_id}
                                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                              >
                                Not yet
                              </button>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-500">Awaiting confirmation from owner.</p>
                          )}
                        </div>
                      </div>

                      {/* Completion Status Banner */}
                      <div className={`mt-5 rounded-xl border p-3.5 text-center text-xs font-semibold ${
                        handover?.confirmationState.bothConfirmed
                          ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-300"
                          : "border-slate-700 bg-slate-900/60 text-slate-400"
                      }`}>
                        {handover?.confirmationState.bothConfirmed
                          ? "🎉 Both parties confirmed! Item successfully recovered and transaction complete."
                          : handover?.confirmationState.finderConfirmed
                          ? "⏳ Finder confirmed. Waiting for owner confirmation."
                          : handover?.confirmationState.claimantConfirmed
                          ? "⏳ Owner confirmed. Waiting for finder confirmation."
                          : "Both parties must confirm before the item is marked as recovered."}
                      </div>
                    </div>
                  )}

                  {/* Finder Contact */}
                  {isApprovedOrHandedOver && (
                    <div className="border-t border-slate-800 pt-5">
                      <h4 className="font-bold text-white text-sm">📞 Finder Contact Details</h4>
                      {contactMessages[claim.claim_id] && (
                        <p className="mt-2 text-xs text-red-400">{contactMessages[claim.claim_id]}</p>
                      )}
                      {!finderContacts[claim.claim_id] ? (
                        <button
                          onClick={() => viewFinderContact(claim.claim_id)}
                          disabled={contactLoadingId === claim.claim_id}
                          className="mt-3 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-60 transition-all"
                        >
                          {contactLoadingId === claim.claim_id ? "Loading..." : "View Finder Contact"}
                        </button>
                      ) : (
                        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-200 space-y-1.5">
                          <p><strong className="text-slate-400 font-semibold">Name:</strong> {finderContacts[claim.claim_id].finderName}</p>
                          {finderContacts[claim.claim_id].phoneNumber && (
                            <p><strong className="text-slate-400 font-semibold">Phone:</strong>{" "}
                              <a href={`tel:${finderContacts[claim.claim_id].phoneNumber}`} className="text-cyan-400 underline">
                                {finderContacts[claim.claim_id].phoneNumber}
                              </a>
                            </p>
                          )}
                          {finderContacts[claim.claim_id].email && (
                            <p><strong className="text-slate-400 font-semibold">Email:</strong>{" "}
                              <a href={`mailto:${finderContacts[claim.claim_id].email}`} className="text-cyan-400 underline">
                                {finderContacts[claim.claim_id].email}
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evidence Form */}
                  {canSubmitEvidence && (
                    <div className="border-t border-slate-800 pt-5">
                      <h4 className="font-bold text-white text-sm">📎 Submit Ownership Evidence</h4>
                      <p className="mt-1 text-xs text-slate-400">Provide proof to help administrators verify your ownership claim.</p>

                      <div className="mt-4 space-y-3">
                        <select
                          value={selectedTypes[claim.claim_id] || "DESCRIPTION"}
                          onChange={(e) => setSelectedTypes((prev) => ({ ...prev, [claim.claim_id]: e.target.value as EvidenceType }))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                        >
                          {evidenceOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        <textarea
                          value={evidenceTexts[claim.claim_id] || ""}
                          onChange={(e) => setEvidenceTexts((prev) => ({ ...prev, [claim.claim_id]: e.target.value }))}
                          rows={3}
                          placeholder="Describe identifying marks, serial numbers, or purchase details..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 transition-colors"
                        />

                        <button
                          onClick={() => submitEvidence(claim.claim_id)}
                          disabled={submittingId === claim.claim_id}
                          className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-60 transition-all"
                        >
                          {submittingId === claim.claim_id ? "Submitting..." : "Submit Evidence →"}
                        </button>

                        {messages[claim.claim_id] && (
                          <p className="text-xs font-semibold text-emerald-400">{messages[claim.claim_id]}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-10 text-center text-xs text-slate-700">
          LOSTLINK VERIFICATION SYSTEM · OTP-SECURED HANDOVER
        </footer>
      </div>
    </main>
  );
}
