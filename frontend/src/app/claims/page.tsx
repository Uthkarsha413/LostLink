
"use client";

import { useCallback, useEffect, useState } from "react";

type Claim = {
  claim_id: number;
  claim_status: string;
  submitted_at: string;
  claimant_name: string;
  lost_report_id: number;
  lost_item_title: string;
  found_report_id: number;
  found_item_title: string;
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

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<
    Record<number, EvidenceType>
  >({});
  const [evidenceTexts, setEvidenceTexts] = useState<
    Record<number, string>
  >({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/claims");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load claims.");
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

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  async function submitEvidence(claimId: number) {
    const evidenceText = evidenceTexts[claimId]?.trim();
    const evidenceType = selectedTypes[claimId] || "DESCRIPTION";

    if (!evidenceText) {
      setMessages((previous) => ({
        ...previous,
        [claimId]: "Please enter your evidence before submitting.",
      }));
      return;
    }

    try {
      setSubmittingId(claimId);
      setMessages((previous) => ({ ...previous, [claimId]: "" }));

      const response = await fetch(
        `/api/claims/${claimId}/evidence`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            evidenceType,
            evidenceText,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Evidence submission failed.");
      }

      setMessages((previous) => ({
        ...previous,
        [claimId]: "Evidence submitted successfully!",
      }));

      setEvidenceTexts((previous) => ({
        ...previous,
        [claimId]: "",
      }));
    } catch (err) {
      setMessages((previous) => ({
        ...previous,
        [claimId]:
          err instanceof Error
            ? err.message
            : "Unable to submit evidence.",
      }));
    } finally {
      setSubmittingId(null);
    }
  }

  function statusColor(status: string) {
    if (status === "APPROVED" || status === "HANDED_OVER") {
      return "text-green-700 bg-green-100";
    }

    if (status === "REJECTED") {
      return "text-red-700 bg-red-100";
    }

    return "text-amber-700 bg-amber-100";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            LostLink
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Claims
          </h1>

          <p className="mt-2 text-slate-600">
            Track your ownership claims and submit evidence to help
            moderators verify your item.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Your submitted claims
          </h2>

          <button
            onClick={loadClaims}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading your claims...
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && claims.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <h3 className="font-semibold text-slate-800">
              No claims found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Claims you submit for found items will appear here.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {claims.map((claim) => {
            const canSubmitEvidence = [
              "SUBMITTED",
              "AI_REVIEW_PENDING",
              "MODERATOR_REVIEW",
              "ADMIN_REVIEW",
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

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                      claim.claim_status
                    )}`}
                  >
                    {claim.claim_status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Your lost item
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
                      Possible found item
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {claim.found_item_title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Report #{claim.found_report_id}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  Submitted:{" "}
                  {new Date(claim.submitted_at).toLocaleString()}
                </p>

                {canSubmitEvidence ? (
                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <h4 className="font-semibold text-slate-900">
                      Submit ownership evidence
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Provide details that help verify this item belongs
                      to you. Do not include passwords or sensitive
                      personal information.
                    </p>

                    <label
                      htmlFor={`type-${claim.claim_id}`}
                      className="mt-4 block text-sm font-medium text-slate-700"
                    >
                      Evidence type
                    </label>

                    <select
                      id={`type-${claim.claim_id}`}
                      value={
                        selectedTypes[claim.claim_id] || "DESCRIPTION"
                      }
                      onChange={(event) =>
                        setSelectedTypes((previous) => ({
                          ...previous,
                          [claim.claim_id]: event.target.value as EvidenceType,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500"
                    >
                      {evidenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label
                      htmlFor={`evidence-${claim.claim_id}`}
                      className="mt-4 block text-sm font-medium text-slate-700"
                    >
                      Evidence details
                    </label>

                    <textarea
                      id={`evidence-${claim.claim_id}`}
                      value={evidenceTexts[claim.claim_id] || ""}
                      onChange={(event) =>
                        setEvidenceTexts((previous) => ({
                          ...previous,
                          [claim.claim_id]: event.target.value,
                        }))
                      }
                      rows={4}
                      maxLength={5000}
                      placeholder="Describe identifying marks, purchase details, or other proof..."
                      className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                    />

                    <div className="mt-2 text-right text-xs text-slate-400">
                      {(evidenceTexts[claim.claim_id] || "").length}/5000
                    </div>

                    <button
                      onClick={() => submitEvidence(claim.claim_id)}
                      disabled={submittingId === claim.claim_id}
                      className="mt-3 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingId === claim.claim_id
                        ? "Submitting..."
                        : "Submit evidence"}
                    </button>

                    {messages[claim.claim_id] && (
                      <p
                        role="status"
                        className="mt-3 text-sm font-medium text-slate-700"
                      >
                        {messages[claim.claim_id]}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    Evidence submission is unavailable for this claim
                    because its status is {claim.claim_status}.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
