
"use client";

import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CampusLocationSelector from "../components/CampusLocationSelector";

type Category = {
  categoryId: number;
  categoryName: string;
  description: string | null;
};

type Location = {
  locationId: number;
  parentLocationId: number | null;
  locationCode: string;
  locationName: string;
  locationType: string;
  dataStatus: string;
};

export default function ReportPage() {
  const router = useRouter();

  const [reportType, setReportType] =
    useState<"LOST" | "FOUND">("LOST");

  const [shareFinderContact, setShareFinderContact] =
    useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    locationId: "",
    brand: "",
    color: "",
    eventDateTime: "",
  });

  // Load categories, locations and authentication
  useEffect(() => {
    async function loadData() {
      try {
        const [
          categoryResponse,
          locationResponse,
          authResponse,
        ] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/locations", { cache: "no-store" }),
          fetch("/api/auth/me", { cache: "no-store" }),
        ]);

        const categoryResult = await categoryResponse.json();
        const locationResult = await locationResponse.json();
        const authResult = await authResponse.json();

        if (!authResponse.ok || !authResult.success) {
          router.push("/login");
          return;
        }

        if (!categoryResult.success || !locationResult.success) {
          throw new Error("Unable to load form information.");
        }

        setCategories(categoryResult.data);
        setLocations(locationResult.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the form."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Update form fields
  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Select and validate images
  function handleImageSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (selectedFiles.length > 5) {
      setError("You can upload a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    for (const file of selectedFiles) {
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, PNG and WebP images are allowed.");
        event.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be 5 MB or smaller.");
        event.target.value = "";
        return;
      }

      if (file.size === 0) {
        setError("An image cannot be empty.");
        event.target.value = "";
        return;
      }
    }

    imagePreviews.forEach((preview) =>
      URL.revokeObjectURL(preview)
    );

    setError("");
    setImageFiles(selectedFiles);

    setImagePreviews(
      selectedFiles.map((file) =>
        URL.createObjectURL(file)
      )
    );

    event.target.value = "";
  }

  // Remove selected image
  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles((previous) =>
      previous.filter((_, i) => i !== index)
    );

    setImagePreviews((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  // Submit report and upload photographs
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.categoryId) {
      setError("Please select an item category.");
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create report
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          title: form.title.trim(),
          description: form.description.trim(),
          categoryId: Number(form.categoryId),
          locationId: form.locationId
            ? Number(form.locationId)
            : null,
          brand: form.brand.trim() || null,
          color: form.color.trim() || null,
          eventDateTime: form.eventDateTime || null,
          shareFinderContact: reportType === "FOUND" && shareFinderContact,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit your report."
        );
      }

      const reportId = result.data.reportId;

      // Step 2: Upload images
      let imageMessage = "";

      if (imageFiles.length > 0) {
        const imageData = new FormData();

        imageFiles.forEach((file) => {
          imageData.append("images", file);
        });

        const imageResponse = await fetch(
          `/api/reports/${reportId}/images`,
          {
            method: "POST",
            body: imageData,
          }
        );

        const imageResult = await imageResponse.json();

        if (!imageResponse.ok || !imageResult.success) {
          imageMessage =
            " The report was created, but image upload failed. You can retry the images later.";
        } else {
          imageMessage =
            ` ${imageFiles.length} image(s) uploaded successfully.`;
        }
      }

      setSuccess(
        `Your ${reportType.toLowerCase()} report was submitted successfully. Report ID: ${reportId}.${imageMessage}`
      );

      // Reset form
      setForm({
        title: "",
        categoryId: "",
        description: "",
        locationId: "",
        brand: "",
        color: "",
        eventDateTime: "",
      });
      setShareFinderContact(false);

      imagePreviews.forEach((preview) =>
        URL.revokeObjectURL(preview)
      );

      setImageFiles([]);
      setImagePreviews([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Sort campus locations
  const sortedLocations = [...locations].sort((a, b) => {
    const order: Record<string, number> = {
      CAMPUS: 0,
      BLOCK: 1,
      FLOOR: 2,
      AREA: 3,
      ROOM: 4,
    };

    return (
      (order[a.locationType] ?? 5) -
        (order[b.locationType] ?? 5) ||
      a.locationCode.localeCompare(b.locationCode)
    );
  });

  function locationLabel(location: Location) {
    const provisional =
      location.dataStatus !== "VERIFIED"
        ? " · Unverified"
        : "";

    return `${location.locationName} (${location.locationType})${provisional}`;
  }

  // Loading screen
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm tracking-widest uppercase">Preparing your form…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
            📋 LostLink · Report an Item
          </p>
          <h1 className="text-4xl font-black sm:text-5xl leading-tight">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Help something find<br />its way back.
            </span>
          </h1>
          <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-lg mx-auto">
            Share the details of the item you&apos;ve lost or found.
            LostLink will help connect it with its rightful owner.
          </p>
        </div>

        {/* Lost / Found toggle */}
        <div className="mb-8 flex rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5 backdrop-blur gap-1.5">
          <button
            type="button"
            onClick={() => setReportType("LOST")}
            className={`flex-1 rounded-xl py-3 px-4 text-sm font-bold transition-all ${
              reportType === "LOST"
                ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            😟 I lost something
          </button>
          <button
            type="button"
            onClick={() => setReportType("FOUND")}
            className={`flex-1 rounded-xl py-3 px-4 text-sm font-bold transition-all ${
              reportType === "FOUND"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🎉 I found something
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Item Information */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📦 Item Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">Start with the basic details of the item.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Item name <span className="text-rose-400">*</span>
              </label>
              <input
                required
                maxLength={150}
                placeholder="e.g. Black iPhone 15"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={5}
                maxLength={3000}
                placeholder="Describe the item, its appearance and any distinctive features..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 transition-all resize-none"
              />
              <p className="text-xs text-slate-600 mt-1 text-right">{form.description.length}/3000</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                <input
                  maxLength={100}
                  placeholder="e.g. Apple"
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Colour</label>
                <input
                  maxLength={60}
                  placeholder="e.g. Black"
                  value={form.color}
                  onChange={(e) => updateField("color", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Where & When */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📍 Where &amp; When?
              </h2>
              <p className="text-xs text-slate-500 mt-1">Help narrow down where the item was {reportType === "LOST" ? "lost" : "found"}.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">Campus location</label>
                {form.locationId && (
                  <button
                    type="button"
                    onClick={() => updateField("locationId", "")}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Clear location
                  </button>
                )}
              </div>
              <CampusLocationSelector
                locations={locations as any}
                selectedId={form.locationId}
                onChange={(val) => updateField("locationId", val)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {reportType === "LOST"
                  ? "When did you last have the item?"
                  : "When did you find the item?"}
              </label>
              <input
                type="datetime-local"
                value={form.eventDateTime}
                onChange={(e) => updateField("eventDateTime", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white outline-none focus:border-cyan-400 transition-all [color-scheme:dark]"
              />
            </div>

            {reportType === "FOUND" && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={shareFinderContact}
                    onChange={(e) => setShareFinderContact(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setShareFinderContact(!shareFinderContact)}
                    className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                      shareFinderContact
                        ? "bg-cyan-500 border-cyan-500"
                        : "border-slate-600 bg-slate-800"
                    }`}
                  >
                    {shareFinderContact && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                  I agree to share my contact details. My registered phone number and email address
                  may be shared with the rightful claimant only after an administrator approves the
                  claim. <span className="text-slate-500">This is optional.</span>
                </span>
              </label>
            )}
          </div>

          {/* Section 3: Item Photos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🖼️ Item Photos
              </h2>
              <p className="text-xs text-slate-500 mt-1">Clear photographs help identify and match your item.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Upload images <span className="text-slate-500">(optional)</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/40 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all group">
                <div className="text-center">
                  <span className="text-3xl">📸</span>
                  <p className="text-sm text-slate-400 mt-1 group-hover:text-cyan-400 transition-colors">
                    Click to upload photos
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">JPG, PNG or WebP · Max 5 images · 5 MB each</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelection}
                  className="hidden"
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={preview}
                    className="relative rounded-xl overflow-hidden border border-slate-700 group"
                  >
                    <Image
                      src={preview}
                      alt={`Selected item photo ${index + 1}`}
                      width={240}
                      height={180}
                      unoptimized
                      style={{
                        width: "100%",
                        height: "140px",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-600">
              🔒 Do not upload photographs containing sensitive personal information.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur flex items-start gap-3">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 backdrop-blur flex items-start gap-3">
              <span className="text-lg flex-shrink-0">✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-base"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Submitting report…
              </span>
            ) : (
              `Submit ${reportType === "LOST" ? "😟 Lost" : "🎉 Found"} Report →`
            )}
          </button>

          <p className="text-center text-xs text-slate-600">
            🔒 Your report will be associated with your authenticated LostLink account.
          </p>
        </form>
      </div>
    </main>
  );
}
