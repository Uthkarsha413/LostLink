
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
      <main className="ll-page min-h-screen grid place-items-center">
        <p>Preparing your report form...</p>
      </main>
    );
  }

  return (
    <main className="ll-page min-h-screen">
      <header className="ll-nav">
        <div className="ll-nav-inner">
          <Link href="/" className="ll-brand">
            <span className="ll-logo">L</span>
            <span>
              lostlink<span className="ll-dot">.</span>
            </span>
          </Link>

          <Link href="/" className="ll-login">
            ← Back to home
          </Link>
        </div>
      </header>

      <section className="ll-report-page">
        <div className="ll-report-heading">
          <span className="ll-eyebrow">
            <span>✦</span> PES UNIVERSITY · RR CAMPUS
          </span>

          <h1>
            Help something
            <br />
            <span>find its way back.</span>
          </h1>

          <p>
            Share the details of the item you&apos;ve lost or found.
            LostLink will help connect it with its rightful owner.
          </p>
        </div>

        <div className="ll-report-card">
          {/* Lost / Found selector */}
          <div className="ll-report-tabs">
            <button
              type="button"
              className={reportType === "LOST" ? "active" : ""}
              onClick={() => setReportType("LOST")}
            >
              I lost something
            </button>

            <button
              type="button"
              className={reportType === "FOUND" ? "active" : ""}
              onClick={() => setReportType("FOUND")}
            >
              I found something
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Item information */}
            <div className="ll-form-section">
              <h2>Item information</h2>
              <p>Start with the basic details of the item.</p>

              <label className="ll-field">
                Item name <span>*</span>
                <input
                  required
                  maxLength={150}
                  placeholder="e.g. Black iPhone 15"
                  value={form.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                />
              </label>

              <label className="ll-field">
                Category <span>*</span>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) =>
                    updateField("categoryId", e.target.value)
                  }
                >
                  <option value="">Select a category</option>

                  {categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ll-field">
                Description <span>*</span>
                <textarea
                  required
                  rows={5}
                  maxLength={3000}
                  placeholder="Describe the item, its appearance and any distinctive features..."
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                />
              </label>

              <div className="ll-form-grid">
                <label className="ll-field">
                  Brand
                  <input
                    maxLength={100}
                    placeholder="e.g. Apple"
                    value={form.brand}
                    onChange={(e) =>
                      updateField("brand", e.target.value)
                    }
                  />
                </label>

                <label className="ll-field">
                  Colour
                  <input
                    maxLength={60}
                    placeholder="e.g. Black"
                    value={form.color}
                    onChange={(e) =>
                      updateField("color", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            {/* Location and date */}
            <div className="ll-form-section">
              <h2>Where and when?</h2>
              <p>
                Help narrow down where the item was lost or found.
              </p>

              <label className="ll-field">
                Campus location
                <select
                  value={form.locationId}
                  onChange={(e) =>
                    updateField("locationId", e.target.value)
                  }
                >
                  <option value="">
                    Select a location (optional)
                  </option>

                  {sortedLocations.map((location) => (
                    <option
                      key={location.locationId}
                      value={location.locationId}
                    >
                      {locationLabel(location)}
                    </option>
                  ))}
                </select>

                <small>
                  Some campus locations are provisional and
                  have not yet been physically verified.
                </small>
              </label>

              <label className="ll-field">
                {reportType === "LOST"
                  ? "When did you last have the item?"
                  : "When did you find the item?"}

                <input
                  type="datetime-local"
                  value={form.eventDateTime}
                  onChange={(e) =>
                    updateField("eventDateTime", e.target.value)
                  }
                />
              </label>
            </div>

            {/* Image upload */}
            <div className="ll-form-section">
              <h2>Item photos</h2>
              <p>
                Clear photographs help identify and match your item.
              </p>

              <label className="ll-field">
                Upload images (optional)

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelection}
                />

                <small>
                  JPG, PNG or WebP · Maximum 5 images · 5 MB each
                </small>
              </label>

              {imagePreviews.length > 0 && (
                <div className="ll-image-preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div
                      className="ll-image-preview"
                      key={preview}
                    >
                      <Image
                        src={preview}
                        alt={`Selected item photo ${index + 1}`}
                        width={240}
                        height={180}
                        unoptimized
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="ll-form-footnote">
                Do not upload photographs containing sensitive
                personal information.
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="ll-form-message error">
                {error}
              </div>
            )}

            {success && (
              <div className="ll-form-message success">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="ll-submit-button"
              disabled={submitting}
            >
              {submitting
                ? "Submitting report..."
                : `Submit ${reportType.toLowerCase()} report →`}
            </button>

            <p className="ll-form-footnote">
              Your report will be associated with your
              authenticated LostLink account.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
