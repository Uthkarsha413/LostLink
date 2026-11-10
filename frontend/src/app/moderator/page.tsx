"use client";

import { useCallback, useEffect, useState } from "react";

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
  claim_status: string;
  submitted_at: string;
  claimant_id: number;
  claimant_name: string;
  claimant_email?: string;
  finder_id?: number;
  finder_name?: string;
  finder_email?: string;
  lost_report_id: number;
  lost_item_title: string;
  lost_description?: string;
  lost_brand?: string | null;
  lost_color?: string | null;
  found_report_id: number;
  found_item_title: string;
  found_description?: string;
  found_brand?: string | null;
  found_color?: string | null;
  evidence?: Evidence[];
  reviews?: Review[];
};

type PendingImage = {
  imageId: number;
  reportId: number;
  imageUrl: string;
  originalFilename: string;
  mimeType: string;
  imageQualityStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  isPrimary: boolean;
  uploadedAt: string;
  report: {
    reportType: "LOST" | "FOUND";
    title: string;
    description: string;
    brand: string | null;
    color: string | null;
    reportStatus: string;
    createdAt: string;
    category: string;
    location: string | null;
    reporterName: string;
  };
};

export default function ModeratorPage() {
  const [activeTab, setActiveTab] = useState<"images" | "claims">("images");

  // Claims state
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});

  // Image moderation state
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState("");
  const [imageBusyId, setImageBusyId] = useState<number | null>(null);
  const [imageMessages, setImageMessages] = useState<Record<number, string>>({});
  const [imageFilter, setImageFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/claims", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Unable to load claims.");
      }
      setClaims(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingImages = useCallback(async () => {
    try {
      setImagesLoading(true);
      setImagesError("");
      const response = await fetch("/api/moderation/images", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load pending images.");
      }
      setPendingImages(result.data || []);
    } catch (err) {
      setImagesError(err instanceof Error ? err.message : "Unable to load pending images.");
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
    loadPendingImages();
  }, [loadClaims, loadPendingImages]);

  async function reviewClaim(claimId: number, decision: "ESCALATE" | "REQUEST_INFO") {
    try {
      setBusyId(claimId);
      setMessages((prev) => ({ ...prev, [claimId]: "" }));
      const response = await fetch(`/api/claims/${claimId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewComments: comments[claimId]?.trim() || "" }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Review action failed.");
      }
      setMessages((prev) => ({
        ...prev,
        [claimId]: decision === "ESCALATE"
          ? "✅ Claim successfully escalated to admin review."
          : "📨 Additional information has been requested.",
      }));
      await loadClaims();
    } catch (err) {
      setMessages((prev) => ({ ...prev, [claimId]: err instanceof Error ? err.message : "Unable to process claim." }));
    } finally {
      setBusyId(null);
    }
  }

  async function reviewImage(image: PendingImage, decision: "ACCEPT" | "REJECT") {
    const action = decision === "ACCEPT" ? "accept" : "reject";
    const confirmed = window.confirm(`Are you sure you want to ${action} this image for "${image.report.title}"?`);
    if (!confirmed) return;
    try {
      setImageBusyId(image.imageId);
      setImageMessages((prev) => ({ ...prev, [image.imageId]: "" }));
      const response = await fetch(`/api/reports/${image.reportId}/images/${image.imageId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Image review action failed.");
      }
      setImageMessages((prev) => ({
        ...prev,
        [image.imageId]: decision === "ACCEPT" ? "✅ Image accepted." : "❌ Image rejected.",
      }));
      setPendingImages((prev) => prev.filter((item) => item.imageId !== image.imageId));
    } catch (err) {
      setImageMessages((prev) => ({
        ...prev,
        [image.imageId]: err instanceof Error ? err.message : "Unable to process image review.",
      }));
    } finally {
      setImageBusyId(null);
    }
  }

  const filteredImages = pendingImages.filter((img) => imageFilter === "ALL" || img.report.reportType === imageFilter);

  const canReviewStatuses = ["SUBMITTED", "AI_REVIEW_PENDING", "MODERATOR_REVIEW"];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.3em] text-indigo-400 uppercase">
                🛡️ LostLink · Moderation Panel
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                  Moderator Dashboard
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Review uploaded item images for quality, inspect ownership claims, and forward eligible claims to administrators.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-center min-w-[80px]">
                <p className="text-xs text-indigo-400 font-semibold">Images</p>
                <p className="text-2xl font-black text-white mt-0.5">{pendingImages.length}</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center min-w-[80px]">
                <p className="text-xs text-amber-400 font-semibold">Claims</p>
                <p className="text-2xl font-black text-white mt-0.5">{claims.length}</p>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="mt-6 flex gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1 w-fit">
            <button
              onClick={() => setActiveTab("images")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === "images"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🖼️ Image Review
              {pendingImages.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                  {pendingImages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("claims")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === "claims"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📋 Claims Review
              {claims.length > 0 && (
                <span className="ml-2 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                  {claims.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* IMAGE REVIEW TAB */}
        {activeTab === "images" && (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Image Quality Review</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Inspect uploaded images before allowing them into AI search.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Filter pills */}
                <div className="flex gap-1 rounded-lg bg-slate-900 border border-slate-800 p-1">
                  {(["ALL", "LOST", "FOUND"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setImageFilter(f)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        imageFilter === f
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {f === "ALL" ? "All" : f === "LOST" ? "🔍 Lost" : "📦 Found"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={loadPendingImages}
                  disabled={imagesLoading}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {imagesLoading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>
            </div>

            {/* Summary row */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Pending", value: pendingImages.length, color: "amber" },
                { label: "Lost Items", value: pendingImages.filter((i) => i.report.reportType === "LOST").length, color: "rose" },
                { label: "Found Items", value: pendingImages.filter((i) => i.report.reportType === "FOUND").length, color: "emerald" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border bg-slate-900/80 p-5 backdrop-blur ${
                    stat.color === "amber"
                      ? "border-amber-900/40"
                      : stat.color === "rose"
                      ? "border-rose-900/40"
                      : "border-emerald-900/40"
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wider ${
                    stat.color === "amber" ? "text-amber-400" : stat.color === "rose" ? "text-rose-400" : "text-emerald-400"
                  }`}>{stat.label}</p>
                  <p className={`mt-2 text-3xl font-black ${
                    stat.color === "amber" ? "text-amber-300" : stat.color === "rose" ? "text-rose-300" : "text-emerald-300"
                  }`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {imagesLoading && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="mt-4 text-sm">Loading pending images...</p>
              </div>
            )}

            {imagesError && (
              <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
                {imagesError}
              </div>
            )}

            {!imagesLoading && !imagesError && filteredImages.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-lg font-bold">Queue Clear</h3>
                <p className="mt-2 text-sm text-slate-400">No images awaiting review in this filter.</p>
              </div>
            )}

            {!imagesLoading && !imagesError && filteredImages.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                {filteredImages.map((image) => (
                  <article
                    key={image.imageId}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur transition-all hover:border-indigo-500/40"
                  >
                    {/* Image preview */}
                    <a href={image.imageUrl} target="_blank" rel="noopener noreferrer" className="block bg-slate-950 relative">
                      <img
                        src={image.imageUrl}
                        alt={image.report.title}
                        className="h-56 w-full object-contain"
                      />
                      <span className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-bold ${
                        image.report.reportType === "LOST"
                          ? "bg-rose-500/90 text-white"
                          : "bg-emerald-500/90 text-white"
                      }`}>
                        {image.report.reportType}
                      </span>
                    </a>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Report #{image.reportId} · Image #{image.imageId}
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-white">{image.report.title}</h3>
                        </div>
                        <span className="shrink-0 rounded-full border border-amber-700/60 bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-300">
                          PENDING
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {image.report.category}
                        </span>
                        {image.isPrimary && (
                          <span className="rounded-md border border-purple-700/50 bg-purple-950/40 px-2 py-1 text-xs font-semibold text-purple-300">
                            Primary Image
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-300 line-clamp-2">{image.report.description}</p>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-800/50 p-3 text-xs">
                        <div>
                          <p className="text-slate-500">Brand</p>
                          <p className="mt-0.5 font-medium text-slate-200">{image.report.brand || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Color</p>
                          <p className="mt-0.5 font-medium text-slate-200">{image.report.color || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Location</p>
                          <p className="mt-0.5 font-medium text-slate-200">{image.report.location || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Reporter</p>
                          <p className="mt-0.5 font-medium text-slate-200">{image.report.reporterName}</p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-600">
                        {image.originalFilename} · Uploaded {new Date(image.uploadedAt).toLocaleString()}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => reviewImage(image, "ACCEPT")}
                          disabled={imageBusyId === image.imageId}
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-100"
                        >
                          {imageBusyId === image.imageId ? "Processing..." : "✓ Accept"}
                        </button>
                        <button
                          onClick={() => reviewImage(image, "REJECT")}
                          disabled={imageBusyId === image.imageId}
                          className="rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-100"
                        >
                          {imageBusyId === image.imageId ? "Processing..." : "✕ Reject"}
                        </button>
                      </div>

                      {imageMessages[image.imageId] && (
                        <p className="mt-3 rounded-lg bg-slate-800 p-3 text-sm font-medium text-slate-200">
                          {imageMessages[image.imageId]}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CLAIMS REVIEW TAB */}
        {activeTab === "claims" && (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Claims Awaiting Review</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Review ownership claims and escalate eligible claims to administrators.
                </p>
              </div>
              <button
                onClick={loadClaims}
                disabled={loading}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {loading && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="mt-4 text-sm">Loading claims...</p>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">{error}</div>
            )}

            {!loading && !error && claims.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-lg font-bold">No Claims Available</h3>
                <p className="mt-2 text-sm text-slate-400">
                  There are currently no claims assigned for your review.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {claims.map((claim) => {
                const canReview = canReviewStatuses.includes(claim.claim_status);

                return (
                  <article
                    key={claim.claim_id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur transition-all hover:border-indigo-500/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Claim #{claim.claim_id}</p>
                        <h3 className="mt-1 text-xl font-bold text-white">{claim.lost_item_title}</h3>
                      </div>
                      <span className="rounded-full border border-amber-700/60 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300">
                        {claim.claim_status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 rounded-xl bg-slate-800/50 p-4 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">👤 Claimant</p>
                        <p className="mt-2 font-semibold text-white">{claim.claimant_name}</p>
                        <p className="text-xs text-slate-500">User ID: {claim.claimant_id}{claim.claimant_email ? ` · ${claim.claimant_email}` : ""}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">📅 Submitted</p>
                        <p className="mt-2 font-medium text-slate-200">{new Date(claim.submitted_at).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-rose-900/30 bg-slate-900/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">🔍 Lost Item Details</p>
                        <p className="mt-1 font-semibold text-white">{claim.lost_item_title}</p>
                        <p className="text-xs text-slate-400 mt-1">Report #{claim.lost_report_id}</p>
                        {claim.lost_description && (
                          <p className="mt-2 text-xs text-slate-300 italic border-l-2 border-rose-500/50 pl-2">"{claim.lost_description}"</p>
                        )}
                        <div className="mt-2 flex gap-2 text-[11px] text-slate-400">
                          {claim.lost_brand && <span>Brand: <strong className="text-slate-200">{claim.lost_brand}</strong></span>}
                          {claim.lost_color && <span>Color: <strong className="text-slate-200">{claim.lost_color}</strong></span>}
                        </div>
                      </div>
                      <div className="rounded-lg border border-teal-900/30 bg-slate-900/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">📦 Found Item Details</p>
                        <p className="mt-1 font-semibold text-white">{claim.found_item_title}</p>
                        <p className="text-xs text-slate-400 mt-1">Report #{claim.found_report_id} {claim.finder_name ? `· Found by ${claim.finder_name}` : ""}</p>
                        {claim.found_description && (
                          <p className="mt-2 text-xs text-slate-300 italic border-l-2 border-teal-500/50 pl-2">"{claim.found_description}"</p>
                        )}
                        <div className="mt-2 flex gap-2 text-[11px] text-slate-400">
                          {claim.found_brand && <span>Brand: <strong className="text-slate-200">{claim.found_brand}</strong></span>}
                          {claim.found_color && <span>Color: <strong className="text-slate-200">{claim.found_color}</strong></span>}
                        </div>
                      </div>
                    </div>

                    {/* OWNERSHIP EVIDENCE DOSSIER */}
                    <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                          <span>🧾</span> Ownership Evidence Dossier
                        </h4>
                        <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                          {claim.evidence && claim.evidence.length > 0 ? `${claim.evidence.length} piece(s) of evidence` : "No evidence attached yet"}
                        </span>
                      </div>

                      {claim.evidence && claim.evidence.length > 0 ? (
                        <div className="space-y-2.5">
                          {claim.evidence.map((ev, idx) => (
                            <div key={ev.evidence_id || idx} className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-3 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                                  {ev.evidence_type === "PURCHASE_PROOF" ? "🧾 Purchase Proof / Receipt" :
                                   ev.evidence_type === "UNIQUE_MARK" ? "🔍 Unique Mark / Scratch / Serial" :
                                   ev.evidence_type === "DESCRIPTION" ? "📝 Private Description" : "📎 Other Evidence"}
                                </span>
                                <span className="text-[10px] text-slate-500">{new Date(ev.submitted_at).toLocaleString()}</span>
                              </div>
                              <p className="mt-2 text-sm text-slate-200 bg-slate-950/70 p-2.5 rounded border border-slate-800 leading-relaxed font-mono">
                                {ev.evidence_text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-700 p-3 text-center text-xs text-slate-400">
                          ⚠️ The claimant has not yet provided text/file evidence. You can click <strong>"Request More Info"</strong> below to ask for serial numbers, receipts, or distinctive marks.
                        </div>
                      )}
                    </div>

                    {canReview && (
                      <div className="mt-6 border-t border-slate-800 pt-5">
                        <label
                          htmlFor={`comments-${claim.claim_id}`}
                          className="block text-sm font-semibold text-slate-300"
                        >
                          Review Comments
                        </label>
                        <textarea
                          id={`comments-${claim.claim_id}`}
                          rows={3}
                          maxLength={5000}
                          value={comments[claim.claim_id] || ""}
                          onChange={(e) =>
                            setComments((prev) => ({ ...prev, [claim.claim_id]: e.target.value }))
                          }
                          placeholder="Record your findings or explain what additional information is needed..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 transition-colors"
                        />

                        <div className="mt-3 flex flex-wrap gap-3">
                          <button
                            onClick={() => reviewClaim(claim.claim_id, "ESCALATE")}
                            disabled={busyId === claim.claim_id}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-100"
                          >
                            {busyId === claim.claim_id ? "Processing..." : "⬆️ Escalate to Admin"}
                          </button>
                          <button
                            onClick={() => reviewClaim(claim.claim_id, "REQUEST_INFO")}
                            disabled={busyId === claim.claim_id}
                            className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-all"
                          >
                            Request More Info
                          </button>
                        </div>
                      </div>
                    )}

                    {messages[claim.claim_id] && (
                      <p className="mt-4 rounded-xl bg-slate-800 p-3 text-sm font-medium text-slate-200">
                        {messages[claim.claim_id]}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-12 text-center text-xs text-slate-700">
          LOSTLINK MODERATION PANEL · PES UNIVERSITY RR CAMPUS
        </footer>
      </div>
    </main>
  );
}
