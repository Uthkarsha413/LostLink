
"use client";

import { useState } from "react";
import Link from "next/link";

type ItemDetails = {
  title: string | null;
  description: string | null;
  category: string | null;
  brand: string | null;
  colour: string | null;
  location: string | null;
};

type Match = {
  lost_report_id: number;
  found_report_id: number;
  lost_item: ItemDetails;
  found_item: ItemDetails;
  qdrant_similarity: number;
  matching_model: string;
  final_score: number;
  match_percentage: number;
  recommendation: string;
  component_scores: {
    semantic: number;
    category: number;
    brand: number;
    colour: number;
    location: number;
    time: number;
  };
  available_signals: number;
  note: string;
};

type ClipResult = {
  report_id: number;
  image_id: number;
  report_type: "LOST" | "FOUND";
  title: string | null;
  category: string | null;
  brand: string | null;
  color: string | null;
  location: string | null;
  image_quality_status: string;
  similarity_score: number;
  similarity_percentage: number;
};

type ClaimMessage = {
  reportId: number;
  type: "success" | "error";
  message: string;
};

function ItemCard({
  label,
  reportId,
  item,
}: {
  label: string;
  reportId: number;
  item: ItemDetails;
}) {
  const details = [
    ["Category", item.category],
    ["Brand", item.brand],
    ["Colour", item.colour],
    ["Location", item.location],
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#101625] p-5">
      <p className="text-xs font-semibold tracking-[0.2em] text-violet-400">
        {label}
      </p>

      <h3 className="mt-3 text-lg font-semibold text-white">
        {item.title || "Untitled item"}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        Report #{reportId}
      </p>

      <p className="mt-4 min-h-16 text-sm leading-6 text-slate-300">
        {item.description || "No description available."}
      </p>

      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        {details.map(([name, value]) => (
          <div
            key={name}
            className="flex justify-between gap-3 text-xs"
          >
            <span className="text-slate-500">{name}</span>
            <span className="text-right text-slate-200">
              {value || "Not specified"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  // Existing hybrid matching state
  const [reportId, setReportId] = useState("5");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // CLIP search state
  const [clipQuery, setClipQuery] = useState("");
  const [clipTarget, setClipTarget] =
    useState<"LOST" | "FOUND">("FOUND");
  const [clipResults, setClipResults] = useState<ClipResult[]>([]);
  const [clipLoading, setClipLoading] = useState(false);
  const [clipError, setClipError] = useState("");
  const [clipSearched, setClipSearched] = useState(false);

  // Claim state
  const [claimLoadingId, setClaimLoadingId] =
    useState<number | null>(null);
  const [claimMessage, setClaimMessage] =
    useState<ClaimMessage | null>(null);

  // Existing hybrid matching function
  async function findMatches(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMatches([]);
    setSearched(false);
    setClaimMessage(null);

    try {
      const response = await fetch(
        `/api/matching?reportId=${encodeURIComponent(reportId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to find matches.");
      }

      setMatches(data.result.matches || []);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // CLIP natural-language search function
  async function findClipMatches(e: React.FormEvent) {
    e.preventDefault();

    setClipLoading(true);
    setClipError("");
    setClipResults([]);
    setClipSearched(false);

    try {
      const response = await fetch("/api/matching", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query_text: clipQuery,
          target_report_type: clipTarget,
          limit: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to search items.");
      }

      setClipResults(data.results || []);
      setClipSearched(true);
    } catch (err) {
      setClipError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setClipLoading(false);
    }
  }

  // Existing ownership claim function
  async function submitClaim(match: Match) {
    setClaimLoadingId(match.found_report_id);
    setClaimMessage(null);

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lostReportId: match.lost_report_id,
          foundReportId: match.found_report_id,
          matchId: null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to submit your claim.");
      }

      setClaimMessage({
        reportId: match.found_report_id,
        type: "success",
        message: "Your ownership claim has been submitted successfully.",
      });
    } catch (err) {
      setClaimMessage({
        reportId: match.found_report_id,
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong.",
      });
    } finally {
      setClaimLoadingId(null);
    }
  }

  function recommendationLabel(value: string) {
    return value.replaceAll("_", " ");
  }

  const scoreLabels = [
    ["Semantic similarity", "semantic"],
    ["Category", "category"],
    ["Brand", "brand"],
    ["Colour", "colour"],
    ["Location", "location"],
    ["Time", "time"],
  ] as const;

  return (
    <main className="min-h-screen bg-[#080b14] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-10 inline-flex text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to LostLink
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-violet-400">
            LOSTLINK INTELLIGENCE
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            AI Match Finder<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Discover potential lost-and-found connections using semantic
            similarity, item attributes and campus information.
          </p>
        </div>

        {/* CLIP Natural Language Search */}
        <section className="mb-8 rounded-2xl border border-violet-400/20 bg-violet-400/[0.04] p-5 sm:p-7">
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-400">
            CLIP · VISUAL INTELLIGENCE
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Search items using AI
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Describe the appearance of an item. CLIP compares your text
            description with images stored in the LostLink vector database.
          </p>

          <form onSubmit={findClipMatches} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="clipQuery"
                className="mb-2 block text-sm text-slate-300"
              >
                Describe the item
              </label>

              <input
                id="clipQuery"
                type="text"
                required
                minLength={2}
                maxLength={500}
                value={clipQuery}
                onChange={(e) => setClipQuery(e.target.value)}
                placeholder="Example: A black smartphone with a large screen"
                className="w-full rounded-xl border border-white/10 bg-[#101625] px-4 py-3 text-white outline-none focus:border-violet-400"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={clipTarget}
                onChange={(e) =>
                  setClipTarget(e.target.value as "LOST" | "FOUND")
                }
                className="rounded-xl border border-white/10 bg-[#101625] px-4 py-3 text-white outline-none focus:border-violet-400"
              >
                <option value="FOUND">Search FOUND items</option>
                <option value="LOST">Search LOST items</option>
              </select>

              <button
                type="submit"
                disabled={clipLoading}
                className="flex-1 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {clipLoading ? "Searching with CLIP..." : "Search with CLIP →"}
              </button>
            </div>
          </form>

          {clipError && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {clipError}
            </p>
          )}

          {clipLoading && (
            <p className="mt-4 text-sm text-violet-300">
              Comparing your description with stored item images...
            </p>
          )}

          {clipSearched && !clipLoading && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="text-lg font-semibold text-white">
                CLIP Search Results ({clipResults.length})
              </h3>

              {clipResults.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  No matching images found. Try another description.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {clipResults.map((item) => (
                    <article
                      key={`${item.report_id}-${item.image_id}`}
                      className="rounded-xl border border-white/10 bg-[#101625] p-4"
                    >
                      {/* Retrieved item image */}
                      <img
                        src={`/api/reports/${item.report_id}/images?imageId=${item.image_id}`}
                        alt={item.title || "Matched lost-and-found item"}
                        className="mb-4 h-52 w-full rounded-lg border border-white/10 object-contain bg-[#080b14]"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold tracking-wider text-violet-400">
                            {item.report_type} REPORT #{item.report_id}
                          </p>

                          <h4 className="mt-2 font-semibold text-white">
                            {item.title || "Untitled item"}
                          </h4>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-violet-300">
                            {item.similarity_percentage.toFixed(1)}%
                          </p>

                          <p className="text-xs text-slate-500">
                            Cosine similarity
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <p className="text-slate-400">
                          Category:{" "}
                          <span className="text-slate-200">
                            {item.category || "—"}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Brand:{" "}
                          <span className="text-slate-200">
                            {item.brand || "—"}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Colour:{" "}
                          <span className="text-slate-200">
                            {item.color || "—"}
                          </span>
                        </p>

                        <p className="text-slate-400">
                          Location:{" "}
                          <span className="text-slate-200">
                            {item.location || "—"}
                          </span>
                        </p>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Image quality status: {item.image_quality_status}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-amber-200/70">
            CLIP similarity is a visual retrieval score, not an ownership
            probability or proof. Human verification is still required.
          </p>
        </section>

        {/* Existing Hybrid Match Finder */}
        <form
          onSubmit={findMatches}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7"
        >
          <label
            htmlFor="reportId"
            className="mb-3 block text-sm font-medium text-slate-200"
          >
            Enter your LOST report ID
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="reportId"
              type="number"
              min="1"
              required
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              placeholder="Example: 5"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101625] px-4 py-3 text-white outline-none transition focus:border-violet-400"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analysing..." : "Find AI Matches →"}
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Enter an existing active LOST report ID from the database.
          </p>
        </form>

        {loading && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />

            <p className="text-sm text-slate-300">
              Comparing reports and calculating similarity...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {searched && !loading && (
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest text-slate-500">
                  SEARCH RESULTS
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Potential matches
                </h2>
              </div>

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                {matches.length} found
              </span>
            </div>

            {matches.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <p className="text-lg font-medium">
                  No matches found yet
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Try again when more relevant FOUND reports are available.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {matches.map((match) => (
                  <article
                    key={match.found_report_id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-widest text-slate-500">
                          AI MATCH RESULT
                        </p>

                        <h3 className="mt-2 text-xl font-semibold">
                          LOST #{match.lost_report_id} → FOUND #
                          {match.found_report_id}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-bold text-violet-300">
                          {match.match_percentage.toFixed(1)}%
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Match score
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, match.match_percentage)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-5 inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                      {recommendationLabel(match.recommendation)}
                    </div>

                    {/* LOST and FOUND item comparison */}
                    <div className="mt-7">
                      <h4 className="mb-4 text-sm font-semibold">
                        Item comparison
                      </h4>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ItemCard
                          label="LOST ITEM"
                          reportId={match.lost_report_id}
                          item={match.lost_item}
                        />

                        <ItemCard
                          label="FOUND ITEM"
                          reportId={match.found_report_id}
                          item={match.found_item}
                        />
                      </div>
                    </div>

                    {/* Similarity breakdown */}
                    <div className="mt-8">
                      <h4 className="mb-4 text-sm font-semibold">
                        Similarity breakdown
                      </h4>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {scoreLabels.map(([label, key]) => {
                          const value =
                            (match.component_scores?.[key] ?? 0) * 100;

                          return (
                            <div key={key}>
                              <div className="mb-2 flex justify-between text-xs">
                                <span className="text-slate-400">
                                  {label}
                                </span>

                                <span className="text-slate-200">
                                  {value.toFixed(1)}%
                                </span>
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-violet-400"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, value)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-4">
                      <p className="text-xs text-slate-500">
                        Matching engine: {match.matching_model}
                      </p>

                      <p className="mt-2 text-xs leading-6 text-slate-400">
                        {match.note}
                      </p>
                    </div>

                    {/* Ownership claim submission */}
                    <div className="mt-6 border-t border-white/10 pt-5">
                      <button
                        type="button"
                        onClick={() => submitClaim(match)}
                        disabled={claimLoadingId !== null}
                        className="w-full rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {claimLoadingId === match.found_report_id
                          ? "Submitting claim..."
                          : "Submit Ownership Claim →"}
                      </button>

                      {claimMessage?.reportId === match.found_report_id && (
                        <p
                          className={`mt-3 text-sm ${
                            claimMessage.type === "success"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {claimMessage.message}
                        </p>
                      )}

                      <p className="mt-3 text-center text-xs text-slate-500">
                        You may be asked to provide evidence of ownership.
                        Final approval is subject to admin verification.
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Ownership verification disclaimer */}
        <div className="mt-10 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
          <p className="text-xs leading-6 text-amber-200/80">
            Important: AI similarity scores identify potential candidates;
            they do not establish ownership. Final ownership verification
            must be completed by an authorised reviewer.
          </p>
        </div>
      </div>
    </main>
  );
}
