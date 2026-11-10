
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type ReportUser = RowDataPacket & {
  user_id: number;
};

type CategoryRow = RowDataPacket & {
  category_id: number;
};

type LocationRow = RowDataPacket & {
  location_id: number;
};

// ==========================================
// GET: Retrieve, filter and search reports
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type")?.toUpperCase();
    const category = searchParams.get("category");
    const status = searchParams.get("status")?.toUpperCase();
    const search = searchParams.get("search")?.trim();

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit")) || 10)
    );

    if (type && !["LOST", "FOUND"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid report type" },
        { status: 400 }
      );
    }

    if (
      status &&
      !["ACTIVE", "MATCHED", "CLAIMED", "CLOSED", "REJECTED"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid report status" },
        { status: 400 }
      );
    }

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (type) {
      conditions.push("r.report_type = ?");
      values.push(type);
    }

    if (category) {
      conditions.push("c.category_name = ?");
      values.push(category);
    }

    if (status) {
      conditions.push("r.report_status = ?");
      values.push(status);
    }

    if (search) {
      conditions.push("(r.title LIKE ? OR r.description LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM item_reports r
       JOIN categories c ON r.category_id = c.category_id
       ${whereClause}`,
      values
    );

    const total = Number(
      (countRows as RowDataPacket[])[0].total
    );

    const offset = (page - 1) * limit;

    const [reports] = await pool.execute(
      `SELECT
         r.report_id,
         r.report_type,
         r.title,
         r.description,
         r.brand,
         r.color,
         r.event_datetime,
         r.report_status,
         r.created_at,
         c.category_name,
         l.location_name,
         l.location_type,
         l.data_status AS location_data_status
       FROM item_reports r
       JOIN categories c ON r.category_id = c.category_id
       LEFT JOIN campus_locations l ON r.location_id = l.location_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return NextResponse.json({
      success: true,
      message: "Reports retrieved successfully",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: reports,
    });
  } catch (error) {
    console.error("Failed to retrieve reports:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve reports",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST: Create a LOST or FOUND report
// ==========================================

export async function POST(request: NextRequest) {
  // 1. Verify authenticated session
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  // 2. Parse request body
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request" },
      { status: 400 }
    );
  }

  // 3. Validate input fields
  const reportType =
    typeof body.reportType === "string"
      ? body.reportType.trim().toUpperCase()
      : "";

  const shareFinderContact =
    reportType === "FOUND" && body.shareFinderContact === true;

  const title =
    typeof body.title === "string" ? body.title.trim() : "";

  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  const categoryId = Number(body.categoryId);

  const locationId =
    body.locationId === undefined ||
    body.locationId === null ||
    body.locationId === ""
      ? null
      : Number(body.locationId);

  const brand =
    typeof body.brand === "string" ? body.brand.trim() : null;

  const color =
    typeof body.color === "string" ? body.color.trim() : null;

  const eventDateTime =
    typeof body.eventDateTime === "string" &&
    body.eventDateTime.trim()
      ? body.eventDateTime.trim()
      : null;

  if (!["LOST", "FOUND"].includes(reportType)) {
    return NextResponse.json(
      { success: false, message: "Report type must be LOST or FOUND" },
      { status: 400 }
    );
  }

  if (!title || title.length > 150) {
    return NextResponse.json(
      {
        success: false,
        message: "Title is required and must be within 150 characters",
      },
      { status: 400 }
    );
  }

  if (!description || description.length > 10000) {
    return NextResponse.json(
      {
        success: false,
        message: "Description is required and must be within 10000 characters",
      },
      { status: 400 }
    );
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return NextResponse.json(
      { success: false, message: "Select a valid category" },
      { status: 400 }
    );
  }

  if (
    locationId !== null &&
    (!Number.isInteger(locationId) || locationId <= 0)
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid campus location" },
      { status: 400 }
    );
  }

  if (brand && brand.length > 100) {
    return NextResponse.json(
      { success: false, message: "Brand must be within 100 characters" },
      { status: 400 }
    );
  }

  if (color && color.length > 60) {
    return NextResponse.json(
      { success: false, message: "Color must be within 60 characters" },
      { status: 400 }
    );
  }

  let formattedDateTime: string | null = null;

  if (eventDateTime) {
    const date = new Date(eventDateTime);

    if (Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid event date and time" },
        { status: 400 }
      );
    }

    formattedDateTime = date.toISOString().slice(0, 19).replace("T", " ");
  }

  // 4. Database transaction
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.execute<ReportUser[]>(
      `SELECT user_id
       FROM users
       WHERE user_id = ?
       AND account_status = 'ACTIVE'`,
      [session.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Your account is not active" },
        { status: 403 }
      );
    }

    const [categories] = await connection.execute<CategoryRow[]>(
      `SELECT category_id
       FROM categories
       WHERE category_id = ?
       AND is_active = 1`,
      [categoryId]
    );

    if (categories.length === 0) {
      return NextResponse.json(
        { success: false, message: "Selected category is unavailable" },
        { status: 400 }
      );
    }

    if (locationId !== null) {
      const [locations] = await connection.execute<LocationRow[]>(
        `SELECT location_id
         FROM campus_locations
         WHERE location_id = ?
         AND is_active = 1`,
        [locationId]
      );

      if (locations.length === 0) {
        return NextResponse.json(
          { success: false, message: "Selected campus location is unavailable" },
          { status: 400 }
        );
      }
    }

    await connection.beginTransaction();

    await connection.execute(
      "SET @lostlink_actor_id = ?",
      [session.userId]
    );

    await connection.execute(
      "SET @lostlink_change_source = 'STUDENT_REPORT_SUBMISSION'"
    );

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO item_reports (
        user_id,
        category_id,
        location_id,
        report_type,
        title,
        description,
        brand,
        color,
        event_datetime,
        report_status,
        finder_contact_consent,
        finder_contact_consent_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?,
        IF(?, CURRENT_TIMESTAMP, NULL)
      )`,
      [
        session.userId,
        categoryId,
        locationId,
        reportType,
        title,
        description,
        brand || null,
        color || null,
        formattedDateTime,
        shareFinderContact ? 1 : 0,
        shareFinderContact ? 1 : 0,
      ]
    );

    // Record Stage 1: Report Submitted in Item Timeline
    try {
      await connection.execute(
        `INSERT INTO item_timeline_events (
          report_id,
          claim_id,
          actor_user_id,
          actor_role,
          stage_number,
          event_type,
          event_title,
          event_description,
          item_status,
          created_at
        ) VALUES (?, NULL, ?, 'STUDENT', 1, 'REPORT_SUBMITTED', 'Report Submitted', ?, 'ACTIVE', NOW())`,
        [
          result.insertId,
          session.userId,
          `Initial ${reportType.toLowerCase()} report submitted for "${title}".`,
        ]
      );
    } catch (timelineErr) {
      console.error("Timeline Stage 1 record error:", timelineErr);
    }

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: `${reportType} report created successfully`,
        data: {
          reportId: result.insertId,
          reportType,
          title,
          reportStatus: "ACTIVE",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();

    console.error("Report creation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create report" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
