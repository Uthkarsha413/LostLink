
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

type ReviewerRow = RowDataPacket & {
  role_name: string;
};

type ImageRow = RowDataPacket & {
  image_id: number;
  report_id: number;
  image_quality_status: "PENDING" | "ACCEPTED" | "REJECTED";
};

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      reportId: string;
      imageId: string;
    }>;
  }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const { reportId: rawReportId, imageId: rawImageId } =
    await context.params;

  const reportId = Number(rawReportId);
  const imageId = Number(rawImageId);

  if (
    !Number.isSafeInteger(reportId) ||
    reportId <= 0 ||
    !Number.isSafeInteger(imageId) ||
    imageId <= 0
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid report or image ID" },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request" },
      { status: 400 }
    );
  }

  const decision =
    typeof body.decision === "string"
      ? body.decision.trim().toUpperCase()
      : "";

  if (!["ACCEPT", "REJECT"].includes(decision)) {
    return NextResponse.json(
      {
        success: false,
        message: "Decision must be ACCEPT or REJECT",
      },
      { status: 400 }
    );
  }

  const newStatus =
    decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Verify the reviewer's actual database role.
    const [roleRows] = await connection.execute<ReviewerRow[]>(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       JOIN users u ON u.user_id = ur.user_id
       WHERE ur.user_id = ?
         AND u.account_status = 'ACTIVE'
         AND r.role_name IN ('MODERATOR', 'ADMIN')`,
      [session.userId]
    );

    const roles = roleRows.map((row) => row.role_name);

    if (!roles.includes("MODERATOR") && !roles.includes("ADMIN")) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Review permission denied" },
        { status: 403 }
      );
    }

    // 2. Lock the image record while reviewing it.
    const [imageRows] = await connection.execute<ImageRow[]>(
      `SELECT
         image_id,
         report_id,
         image_quality_status
       FROM report_images
       WHERE image_id = ?
         AND report_id = ?
       FOR UPDATE`,
      [imageId, reportId]
    );

    if (imageRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Report image not found" },
        { status: 404 }
      );
    }

    const image = imageRows[0];
    const oldStatus = image.image_quality_status;

    if (oldStatus === newStatus) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: `Image is already ${newStatus}`,
        },
        { status: 409 }
      );
    }

    // 3. Update image quality status.
    await connection.execute(
      `UPDATE report_images
       SET image_quality_status = ?
       WHERE image_id = ?
         AND report_id = ?`,
      [newStatus, imageId, reportId]
    );

    // 4. Record the moderation action in the audit log.
    await connection.execute(
      `INSERT INTO admin_audit_logs (
        actor_id,
        action_type,
        entity_type,
        entity_id,
        old_values,
        new_values
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session.userId,
        `IMAGE_${decision}`,
        "REPORT_IMAGE",
        imageId,
        JSON.stringify({
          report_id: reportId,
          image_quality_status: oldStatus,
        }),
        JSON.stringify({
          report_id: reportId,
          image_quality_status: newStatus,
        }),
      ]
    );

    await connection.commit();

    // 5. Synchronize updated image metadata with Qdrant.
    let indexing: {
      success: boolean;
      message: string;
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

      const indexingData = await indexingResponse.json();

      indexing = {
        success:
          indexingResponse.ok &&
          indexingData.success === true &&
          indexingData.result?.indexed === true,
        message:
          indexingData.message ||
          (indexingResponse.ok
            ? "Indexing request completed."
            : "AI indexing service returned an error."),
      };
    } catch (error) {
      console.error("Image moderation indexing error:", error);

      indexing = {
        success: false,
        message: "Database updated, but Qdrant synchronization failed.",
      };
    }

    return NextResponse.json({
      success: true,
      message: `Image ${newStatus.toLowerCase()} successfully`,
      data: {
        reportId,
        imageId,
        previousStatus: oldStatus,
        imageQualityStatus: newStatus,
        reviewedBy: roles,
        indexing,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Image moderation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process image moderation",
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
