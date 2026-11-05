
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";
import { connection } from "next/server";

type MyReportRow = RowDataPacket & {
  report_id: number;
  report_type: "LOST" | "FOUND";
  title: string;
  description: string;
  brand: string | null;
  color: string | null;
  event_datetime: string | null;
  report_status: string;
  created_at: string;
  category_name: string;
  location_name: string | null;
  image_id: number | null;
};

export async function GET(request: NextRequest) {
  await connection();

  try {
    // Verify the logged-in user
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status")?.toUpperCase();
    const type = searchParams.get("type")?.toUpperCase();

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit")) || 10)
    );

    if (
      status &&
      !["ACTIVE", "MATCHED", "CLAIMED", "CLOSED", "REJECTED"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid report status" },
        { status: 400 }
      );
    }

    if (type && !["LOST", "FOUND"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid report type" },
        { status: 400 }
      );
    }

    const conditions = ["r.user_id = ?"];
    const values: (string | number)[] = [session.userId];

    if (status) {
      conditions.push("r.report_status = ?");
      values.push(status);
    }

    if (type) {
      conditions.push("r.report_type = ?");
      values.push(type);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM item_reports r
       ${whereClause}`,
      values
    );

    const total = Number(countRows[0].total);
    const offset = (page - 1) * limit;

    const [reports] = await pool.execute<MyReportRow[]>(
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
         (
           SELECT ri.image_id
           FROM report_images ri
           WHERE ri.report_id = r.report_id
           ORDER BY ri.image_id ASC
           LIMIT 1
         ) AS image_id
       FROM item_reports r
       JOIN categories c
         ON r.category_id = c.category_id
       LEFT JOIN campus_locations l
         ON r.location_id = l.location_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return NextResponse.json({
      success: true,
      message: "Your reports retrieved successfully",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: reports,
    });
  } catch (error) {
    console.error("Failed to retrieve your reports:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve your reports",
      },
      { status: 500 }
    );
  }
}
