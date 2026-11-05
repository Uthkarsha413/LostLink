
"use client";

import { useCallback, useEffect, useState } from "react";

type Claim = {
  claim_id: number;
  claim_status: string;
  submitted_at: string;
  claimant_id: number;
  claimant_name: string;
  lost_report_id: number;
  lost_item_title: string;
  found_report_id: number;
  found_item_title: string;
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
  const [imageMessages, setImageMessages] = useState<
    Record<number, string>
  >({});
  const [imageFilter, setImageFilter] = useState<"ALL" | "LOST" | "FOUND">(
    "ALL"
  );

  // ==========================================
  // Load claims
  // ==========================================

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/claims", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "Unable to load claims."
        );
      }

      setClaims(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // Load pending images
  // ==========================================

  const loadPendingImages = useCallback(async () => {
    try {
      setImagesLoading(true);
      setImagesError("");

      const response = await fetch("/api/moderation/images", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load pending images."
        );
      }

      setPendingImages(result.data || []);
    } catch (err) {
      setImagesError(
        err instanceof Error
          ? err.message
          : "Unable to load pending images."
      );
    } finally {
      setImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
    loadPendingImages();
  }, [loadClaims, loadPendingImages]);

  // ==========================================
  // Review claim
  // ==========================================

  async function reviewClaim(
    claimId: number,
    decision: "ESCALATE" | "REQUEST_INFO"
  ) {
    try {
      setBusyId(claimId);

      setMessages((previous) => ({
        ...previous,
        [claimId]: "",
      }));

      const response = await fetch(`/api/claims/${claimId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision,
          reviewComments: comments[claimId]?.trim() || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "Review action failed."
        );
      }

      setMessages((previous) => ({
        ...previous,
        [claimId]:
          decision === "ESCALATE"
            ? "Claim successfully escalated to admin review."
            : "Additional information has been requested.",
      }));

      await loadClaims();
    } catch (err) {
      setMessages((previous) => ({
        ...previous,
        [claimId]:
          err instanceof Error
            ? err.message
            : "Unable to process claim.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  // ==========================================
  // Review report image
  // ==========================================

  async function reviewImage(
    image: PendingImage,
    decision: "ACCEPT" | "REJECT"
  ) {
    const action = decision === "ACCEPT" ? "accept" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this image for "${image.report.title}"?`
    );

    if (!confirmed) return;

    try {
      setImageBusyId(image.imageId);

      setImageMessages((previous) => ({
        ...previous,
        [image.imageId]: "",
      }));

      const response = await fetch(
        `/api/reports/${image.reportId}/images/${image.imageId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decision }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Image review action failed."
        );
      }

      setImageMessages((previous) => ({
        ...previous,
        [image.imageId]:
          decision === "ACCEPT"
            ? "Image accepted successfully."
            : "Image rejected successfully.",
      }));

      // Remove the reviewed image from the pending queue.
      setPendingImages((previous) =>
        previous.filter((item) => item.imageId !== image.imageId)
      );
    } catch (err) {
      setImageMessages((previous) => ({
        ...previous,
        [image.imageId]:
          err instanceof Error
            ? err.message
            : "Unable to process image review.",
      }));
    } finally {
      setImageBusyId(null);
    }
  }

  const filteredImages = pendingImages.filter((image) => {
    return (
      imageFilter === "ALL" ||
      image.report.reportType === imageFilter
    );
  });

  // ==========================================
  // Dashboard UI
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Dashboard header */}
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            LostLink • Moderation
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Moderator Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Review uploaded item images, inspect ownership claims,
            and forward eligible claims to administrators.
          </p>
        </div>

        {/* ==================================
            IMAGE QUALITY REVIEW
        ================================== */}

        <section className="mb-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Image Quality Review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Inspect uploaded images before allowing them into AI search.
              </p>
            </div>

            <button
              onClick={loadPendingImages}
              disabled={imagesLoading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {imagesLoading ? "Refreshing..." : "Refresh Images"}
            </button>
          </div>

          {/* Image summary */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Pending images
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {pendingImages.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Lost item images
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {pendingImages.filter(
                  (image) => image.report.reportType === "LOST"
                ).length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Found item images
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {pendingImages.filter(
                  (image) => image.report.reportType === "FOUND"
                ).length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(["ALL", "LOST", "FOUND"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setImageFilter(filter)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  imageFilter === filter
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {filter === "ALL"
                  ? "All Images"
                  : `${filter} Items`}
              </button>
            ))}
          </div>

          {/* Loading */}
          {imagesLoading && (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading pending images...
            </div>
          )}

          {/* Error */}
          {imagesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {imagesError}
            </div>
          )}

          {/* Empty state */}
          {!imagesLoading &&
            !imagesError &&
            filteredImages.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="text-4xl">✓</div>

                <h3 className="mt-3 text-lg font-semibold text-slate-800">
                  No pending images
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  There are no images awaiting review in this filter.
                </p>
              </div>
            )}

          {/* Image cards */}
          {!imagesLoading && !imagesError && (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredImages.map((image) => (
                <article
                  key={image.imageId}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Image preview */}
                  <a
                    href={image.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-100"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.report.title}
                      className="h-64 w-full object-contain"
                    />
                  </a>

                  <div className="p-5">
                    {/* Title and status */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Report #{image.reportId} · Image #{image.imageId}
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-slate-900">
                          {image.report.title}
                        </h3>
                      </div>

                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        PENDING
                      </span>
                    </div>

                    {/* Report type */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          image.report.reportType === "LOST"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {image.report.reportType}
                      </span>

                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {image.report.category}
                      </span>

                      {image.isPrimary && (
                        <span className="rounded-md bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                          Primary Image
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Description
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {image.report.description}
                      </p>
                    </div>

                    {/* Item metadata */}
                    <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-xs text-slate-500">Brand</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {image.report.brand || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Color</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {image.report.color || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {image.report.location || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Reported by</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {image.report.reporterName}
                        </p>
                      </div>
                    </div>

                    {/* Upload details */}
                    <div className="mt-4 text-xs text-slate-500">
                      <p>
                        Filename: {image.originalFilename}
                      </p>

                      <p className="mt-1">
                        Uploaded:{" "}
                        {new Date(image.uploadedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Moderation buttons */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          reviewImage(image, "ACCEPT")
                        }
                        disabled={imageBusyId === image.imageId}
                        className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {imageBusyId === image.imageId
                          ? "Processing..."
                          : "✓ Accept Image"}
                      </button>

                      <button
                        onClick={() =>
                          reviewImage(image, "REJECT")
                        }
                        disabled={imageBusyId === image.imageId}
                        className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {imageBusyId === image.imageId
                          ? "Processing..."
                          : "✕ Reject Image"}
                      </button>
                    </div>

                    {/* Review result */}
                    {imageMessages[image.imageId] && (
                      <p
                        role="status"
                        className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700"
                      >
                        {imageMessages[image.imageId]}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ==================================
            CLAIMS REVIEW
        ================================== */}

        <section className="border-t border-slate-200 pt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Claims Awaiting Review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review ownership claims and escalate eligible claims.
              </p>
            </div>

            <button
              onClick={loadClaims}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Claims"}
            </button>
          </div>

          {loading && (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading claims...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && claims.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <h3 className="font-semibold text-slate-800">
                No claims available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are currently no claims assigned for your review.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {claims.map((claim) => {
              const canReview = [
                "SUBMITTED",
                "AI_REVIEW_PENDING",
                "MODERATOR_REVIEW",
              ].includes(claim.claim_status);

              return (
                <section
                  key={claim.claim_id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        Claim #{claim.claim_id}
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-slate-900">
                        {claim.lost_item_title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      {claim.claim_status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Claimant
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {claim.claimant_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        User ID: {claim.claimant_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Submitted
                      </p>

                      <p className="mt-1 text-sm text-slate-800">
                        {new Date(claim.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Lost item
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {claim.lost_item_title}
                      </p>

                      <p className="text-xs text-slate-500">
                        Report #{claim.lost_report_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Found item
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {claim.found_item_title}
                      </p>

                      <p className="text-xs text-slate-500">
                        Report #{claim.found_report_id}
                      </p>
                    </div>
                  </div>

                  {canReview && (
                    <div className="mt-6 border-t border-slate-200 pt-5">
                      <label
                        htmlFor={`comments-${claim.claim_id}`}
                        className="block text-sm font-semibold text-slate-800"
                      >
                        Review comments
                      </label>

                      <textarea
                        id={`comments-${claim.claim_id}`}
                        rows={3}
                        maxLength={5000}
                        value={comments[claim.claim_id] || ""}
                        onChange={(event) =>
                          setComments((previous) => ({
                            ...previous,
                            [claim.claim_id]: event.target.value,
                          }))
                        }
                        placeholder="Record your findings or explain what additional information is needed..."
                        className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                      />

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            reviewClaim(claim.claim_id, "ESCALATE")
                          }
                          disabled={busyId === claim.claim_id}
                          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {busyId === claim.claim_id
                            ? "Processing..."
                            : "Escalate to Admin"}
                        </button>

                        <button
                          onClick={() =>
                            reviewClaim(claim.claim_id, "REQUEST_INFO")
                          }
                          disabled={busyId === claim.claim_id}
                          className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Request More Information
                        </button>
                      </div>
                    </div>
                  )}

                  {messages[claim.claim_id] && (
                    <p
                      role="status"
                      className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700"
                    >
                      {messages[claim.claim_id]}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
