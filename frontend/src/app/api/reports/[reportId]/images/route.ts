
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  mkdir,
  writeFile,
  unlink,
  readFile,
} from "fs/promises";
import path from "path";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const STORAGE_DIR = path.join(
  process.cwd(),
  "private_uploads",
  "reports"
);

type ReportRow = RowDataPacket & {
  report_id: number;
};

type ImageCountRow = RowDataPacket & {
  image_count: number;
};

function detectImageType(buffer: Buffer): string | null {
  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) {
    return "image/png";
  }

  // WebP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// ==========================================
// POST: Upload report images
// ==========================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const { reportId: rawReportId } = await context.params;
  const reportId = Number(rawReportId);

  if (!Number.isSafeInteger(reportId) || reportId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid report ID" },
      { status: 400 }
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid upload request" },
      { status: 400 }
    );
  }

  const images = formData.getAll("images");

  if (
    images.length === 0 ||
    images.some((image) => !(image instanceof File))
  ) {
    return NextResponse.json(
      { success: false, message: "Select at least one image" },
      { status: 400 }
    );
  }

  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      {
        success: false,
        message: `You can upload a maximum of ${MAX_IMAGES} images`,
      },
      { status: 400 }
    );
  }

  const files: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    storageKey: string;
  }[] = [];

  for (const image of images as File[]) {
    if (image.size === 0 || image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Each image must be between 1 byte and 5 MB",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const mimeType = detectImageType(buffer);

    if (!mimeType) {
      return NextResponse.json(
        {
          success: false,
          message: "Only valid JPEG, PNG and WebP images are allowed",
        },
        { status: 400 }
      );
    }

    const extension =
      mimeType === "image/jpeg"
        ? ".jpg"
        : mimeType === "image/png"
          ? ".png"
          : ".webp";

    files.push({
      buffer,
      mimeType,
      originalName: path.basename(image.name).slice(0, 255),
      storageKey: `${randomUUID()}${extension}`,
    });
  }

  const connection = await pool.getConnection();
  const savedPaths: string[] = [];

  let transactionStarted = false;
  let transactionCommitted = false;

  try {
    // Verify report ownership.
    const [reports] = await connection.execute<ReportRow[]>(
      `SELECT report_id
       FROM item_reports
       WHERE report_id = ? AND user_id = ?`,
      [reportId, session.userId]
    );

    if (reports.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found or you do not own this report",
        },
        { status: 404 }
      );
    }

    // Check existing image count.
    const [counts] = await connection.execute<ImageCountRow[]>(
      `SELECT COUNT(*) AS image_count
       FROM report_images
       WHERE report_id = ?`,
      [reportId]
    );

    const existingCount = Number(counts[0].image_count);

    if (existingCount + files.length > MAX_IMAGES) {
      return NextResponse.json(
        {
          success: false,
          message: `This report can have at most ${MAX_IMAGES} images`,
        },
        { status: 400 }
      );
    }

    await mkdir(STORAGE_DIR, { recursive: true });

    // Save files outside the public directory.
    for (const file of files) {
      const filePath = path.join(STORAGE_DIR, file.storageKey);

      await writeFile(filePath, file.buffer, { flag: "wx" });
      savedPaths.push(filePath);
    }

    await connection.beginTransaction();
    transactionStarted = true;

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      await connection.execute<ResultSetHeader>(
        `INSERT INTO report_images (
          report_id,
          storage_key,
          original_filename,
          mime_type,
          file_size_bytes,
          image_quality_status,
          is_primary
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        [
          reportId,
          file.storageKey,
          file.originalName,
          file.mimeType,
          file.buffer.length,
          existingCount === 0 && index === 0 ? 1 : 0,
        ]
      );
    }

    await connection.commit();
    transactionCommitted = true;

    // Automatically index report images in Qdrant.
    let indexingResult = {
      success: false,
      message: "Image uploaded, but CLIP indexing was not completed.",
    };

    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

      const indexingResponse = await fetch(
        `${aiServiceUrl}/clip/index/report/${reportId}`,
        {
          method: "POST",
          cache: "no-store",
          signal: AbortSignal.timeout(30000),
        }
      );

      if (indexingResponse.ok) {
        const indexingData = await indexingResponse.json();

        indexingResult = {
          success:
            indexingData.success === true &&
            indexingData.result?.indexed === true,
          message:
            indexingData.message ||
            "Indexing request completed.",
        };
      } else {
        console.error(
          "CLIP indexing failed:",
          await indexingResponse.text()
        );
      }
    } catch (indexingError) {
      console.error(
        "CLIP indexing service unavailable:",
        indexingError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Images uploaded successfully",
        data: {
          reportId,
          uploadedCount: files.length,
          indexing: indexingResult,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (transactionStarted && !transactionCommitted) {
      await connection.rollback();
    }

    // Remove saved files only if the database transaction failed.
    if (!transactionCommitted) {
      await Promise.all(
        savedPaths.map((filePath) =>
          unlink(filePath).catch(() => undefined)
        )
      );
    }

    console.error("Image upload error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to upload images" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// ==========================================
// GET: Retrieve a private report image
// Access: Report owner, active moderator or admin
// ==========================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const { reportId: rawReportId } = await context.params;
  const reportId = Number(rawReportId);

  if (!Number.isSafeInteger(reportId) || reportId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid report ID" },
      { status: 400 }
    );
  }

  const imageId = Number(
    request.nextUrl.searchParams.get("imageId")
  );

  if (!Number.isSafeInteger(imageId) || imageId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid image ID" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         ri.storage_key,
         ri.mime_type
       FROM report_images ri
       INNER JOIN item_reports ir
         ON ir.report_id = ri.report_id
       WHERE ri.report_id = ?
        AND ri.image_id = ?
        AND (
           ir.user_id = ?
           OR EXISTS (
             SELECT 1
             FROM user_roles ur
             INNER JOIN roles r
               ON r.role_id = ur.role_id
             INNER JOIN users u
               ON u.user_id = ur.user_id
             WHERE ur.user_id = ?
               AND u.account_status = 'ACTIVE'
               AND r.role_name IN ('MODERATOR', 'ADMIN')
           )
         )
       LIMIT 1`,
      [
        reportId,
        imageId,
        session.userId,
        session.userId,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Image not found or access denied",
        },
        { status: 404 }
      );
    }

    const imagePath = path.join(
      STORAGE_DIR,
      path.basename(rows[0].storage_key)
    );

    const imageBuffer = await readFile(imagePath);

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": rows[0].mime_type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Image retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve image" },
      { status: 500 }
    );
  }
}
