
import { NextResponse, connection } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface RoleRow extends RowDataPacket {
  role_name: string;
}

interface PendingImageRow extends RowDataPacket {
  image_id: number;
  report_id: number;
  storage_key: string;
  original_filename: string | null;
  mime_type: string;
  image_quality_status: "PENDING" | "ACCEPTED" | "REJECTED";
  is_primary: number;
  uploaded_at: Date;

  report_type: "LOST" | "FOUND";
  title: string;
  description: string;
  brand: string | null;
  color: string | null;
  report_status: string;
  report_created_at: Date;

  category_name: string;
  location_name: string | null;
  reporter_name: string;
}

export async function GET() {
  try {
    // Ensure this handler runs in the context of an incoming request.
    await connection();

    // Verify the signed-in user.
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Check whether the user has an active MODERATOR or ADMIN role.
    const [roleRows] = await pool.execute<RoleRow[]>(
      `SELECT r.role_name
       FROM users u
       JOIN user_roles ur
         ON ur.user_id = u.user_id
       JOIN roles r
         ON r.role_id = ur.role_id
       WHERE u.user_id = ?
         AND u.account_status = 'ACTIVE'
         AND r.role_name IN ('MODERATOR', 'ADMIN')`,
      [session.userId]
    );

    const canReview = roleRows.some(
      (row) =>
        row.role_name === "MODERATOR" ||
        row.role_name === "ADMIN"
    );

    if (!canReview) {
      return NextResponse.json(
        {
          success: false,
          message: "Review permission denied",
        },
        { status: 403 }
      );
    }

    // Retrieve all images awaiting quality review.
    const [images] = await pool.execute<PendingImageRow[]>(
      `SELECT
         ri.image_id,
         ri.report_id,
         ri.storage_key,
         ri.original_filename,
         ri.mime_type,
         ri.image_quality_status,
         ri.is_primary,
         ri.uploaded_at,

         ir.report_type,
         ir.title,
         ir.description,
         ir.brand,
         ir.color,
         ir.report_status,
         ir.created_at AS report_created_at,

         c.category_name,

         cl.location_name,

         COALESCE(
           NULLIF(TRIM(u.full_name), ''),
           CONCAT('User #', u.user_id)
         ) AS reporter_name

       FROM report_images ri

       INNER JOIN item_reports ir
         ON ir.report_id = ri.report_id

       INNER JOIN users u
         ON u.user_id = ir.user_id

       INNER JOIN categories c
         ON c.category_id = ir.category_id

       LEFT JOIN campus_locations cl
         ON cl.location_id = ir.location_id

       WHERE ri.image_quality_status = 'PENDING'

       ORDER BY ri.uploaded_at ASC, ri.image_id ASC`
    );

    // Format the response for the moderator dashboard.
    const data = images.map((image) => ({
      imageId: image.image_id,
      reportId: image.report_id,

      imageUrl: `/api/reports/${image.report_id}/images?imageId=${image.image_id}`,

      originalFilename: image.original_filename,
      mimeType: image.mime_type,
      imageQualityStatus: image.image_quality_status,
      isPrimary: Boolean(image.is_primary),
      uploadedAt: image.uploaded_at,

      report: {
        reportType: image.report_type,
        title: image.title,
        description: image.description,
        brand: image.brand,
        color: image.color,
        reportStatus: image.report_status,
        createdAt: image.report_created_at,
        category: image.category_name,
        location: image.location_name,
        reporterName: image.reporter_name,
      },
    }));

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Pending image moderation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve pending images",
      },
      { status: 500 }
    );
  }
}
