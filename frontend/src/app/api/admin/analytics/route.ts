import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface RoleCheckRow extends RowDataPacket {
  role_name: string;
}

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  // 1. Authorisation: Administrator Role-Based Access Control
  const [roles] = await pool.execute<RoleCheckRow[]>(
    `SELECT r.role_name
     FROM user_roles ur
     JOIN roles r ON r.role_id = ur.role_id
     JOIN users u ON u.user_id = ur.user_id
     WHERE ur.user_id = ?
       AND u.account_status = 'ACTIVE'
       AND r.role_name = 'ADMIN'`,
    [session.userId]
  );

  if (roles.length === 0) {
    return NextResponse.json(
      { success: false, message: "Forbidden: Administrator privileges required" },
      { status: 403 }
    );
  }

  // 2. Parse date filters
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const customStart = searchParams.get("startDate");
  const customEnd = searchParams.get("endDate");

  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  let rangeLabel = "Last 30 Days";

  if (range === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    rangeLabel = "Today";
  } else if (range === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    rangeLabel = "Last 7 Days";
  } else if (range === "semester") {
    // PES University semester: Aug-Dec (Odd) or Jan-Jul (Even)
    const isOdd = now.getMonth() >= 7;
    startDate = isOdd
      ? new Date(now.getFullYear(), 7, 1)
      : new Date(now.getFullYear(), 0, 1);
    rangeLabel = isOdd
      ? `Fall Semester ${now.getFullYear()}`
      : `Spring Semester ${now.getFullYear()}`;
  } else if (range === "custom" && customStart && customEnd) {
    startDate = new Date(`${customStart}T00:00:00`);
    endDate = new Date(`${customEnd}T23:59:59`);
    rangeLabel = `${customStart} to ${customEnd}`;
  } else if (range === "all") {
    startDate = new Date("2020-01-01T00:00:00");
    rangeLabel = "All Time";
  } else {
    // Default 30d
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    rangeLabel = "Last 30 Days";
  }

  const startIso = startDate.toISOString().slice(0, 19).replace("T", " ");
  const endIso = endDate.toISOString().slice(0, 19).replace("T", " ");

  try {
    // 3. KPI Statistics Cards using Conditional Aggregation
    const [reportKpis] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total_reports,
         COALESCE(SUM(CASE WHEN report_type = 'LOST' THEN 1 ELSE 0 END), 0) AS total_lost,
         COALESCE(SUM(CASE WHEN report_type = 'FOUND' THEN 1 ELSE 0 END), 0) AS total_found,
         COALESCE(SUM(CASE WHEN report_status IN ('ACTIVE', 'MATCHED') THEN 1 ELSE 0 END), 0) AS active_reports,
         COALESCE(SUM(CASE WHEN report_status = 'CLOSED' THEN 1 ELSE 0 END), 0) AS recovered_items,
         COALESCE(SUM(CASE WHEN report_type = 'FOUND' AND report_status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS unclaimed_items
       FROM item_reports
       WHERE created_at BETWEEN ? AND ?`,
      [startIso, endIso]
    );

    const [claimKpis] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total_claims,
         COALESCE(SUM(CASE WHEN claim_status IN ('SUBMITTED', 'MODERATOR_REVIEW', 'ADMIN_REVIEW', 'AI_REVIEW_PENDING') THEN 1 ELSE 0 END), 0) AS pending_claims,
         COALESCE(SUM(CASE WHEN claim_status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS approved_claims,
         COALESCE(SUM(CASE WHEN claim_status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejected_claims,
         COALESCE(SUM(CASE WHEN claim_status = 'HANDED_OVER' THEN 1 ELSE 0 END), 0) AS handed_over_claims
       FROM claims
       WHERE submitted_at BETWEEN ? AND ?`,
      [startIso, endIso]
    );

    const rKpi = reportKpis[0];
    const cKpi = claimKpis[0];

    const kpis = {
      totalLost: Number(rKpi.total_lost),
      totalFound: Number(rKpi.total_found),
      activeReports: Number(rKpi.active_reports),
      pendingClaims: Number(cKpi.pending_claims),
      approvedClaims: Number(cKpi.approved_claims),
      recoveredItems: Number(rKpi.recovered_items),
      rejectedClaims: Number(cKpi.rejected_claims),
      unclaimedItems: Number(rKpi.unclaimed_items),
      totalReports: Number(rKpi.total_reports),
      totalClaims: Number(cKpi.total_claims),
    };

    // 4. Chart 1: Lost vs Found items breakdown
    const [lostVsFound] = await pool.execute<RowDataPacket[]>(
      `SELECT
         report_type,
         COUNT(*) AS count,
         COALESCE(SUM(CASE WHEN report_status IN ('ACTIVE', 'MATCHED') THEN 1 ELSE 0 END), 0) AS active_count,
         COALESCE(SUM(CASE WHEN report_status = 'CLOSED' THEN 1 ELSE 0 END), 0) AS closed_count
       FROM item_reports
       WHERE created_at BETWEEN ? AND ?
       GROUP BY report_type`,
      [startIso, endIso]
    );

    // 5. Chart 2: Report trends (grouped by date)
    const [trends] = await pool.execute<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(created_at, '%Y-%m-%d') AS label,
         COALESCE(SUM(CASE WHEN report_type = 'LOST' THEN 1 ELSE 0 END), 0) AS lost,
         COALESCE(SUM(CASE WHEN report_type = 'FOUND' THEN 1 ELSE 0 END), 0) AS found,
         COUNT(*) AS total
       FROM item_reports
       WHERE created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY label ASC`,
      [startIso, endIso]
    );

    // 6. Chart 3: Item categories distribution (Doughnut / Pie)
    const [categories] = await pool.execute<RowDataPacket[]>(
      `SELECT
         c.category_name AS name,
         COUNT(r.report_id) AS value,
         COALESCE(SUM(CASE WHEN r.report_type = 'LOST' THEN 1 ELSE 0 END), 0) AS lost_count,
         COALESCE(SUM(CASE WHEN r.report_type = 'FOUND' THEN 1 ELSE 0 END), 0) AS found_count
       FROM categories c
       INNER JOIN item_reports r ON r.category_id = c.category_id
       WHERE r.created_at BETWEEN ? AND ?
       GROUP BY c.category_id, c.category_name
       ORDER BY value DESC`,
      [startIso, endIso]
    );

    // 7. Chart 4: Recovery statistics (Recovered vs Unresolved)
    const [recoveryStats] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN report_status = 'CLOSED' THEN 1 ELSE 0 END), 0) AS recovered,
         COALESCE(SUM(CASE WHEN report_status IN ('ACTIVE', 'MATCHED', 'CLAIMED') THEN 1 ELSE 0 END), 0) AS unresolved,
         COALESCE(SUM(CASE WHEN report_status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejected,
         COUNT(*) AS total
       FROM item_reports
       WHERE created_at BETWEEN ? AND ?`,
      [startIso, endIso]
    );

    const rec = recoveryStats[0];
    const totalRecReports = Number(rec.total) || 1;
    const recoveryRate = Math.round((Number(rec.recovered) / totalRecReports) * 100);

    const recoveryData = {
      recovered: Number(rec.recovered),
      unresolved: Number(rec.unresolved),
      rejected: Number(rec.rejected),
      recoveryRate,
    };

    // 8. Chart 5: Most frequently reported campus locations
    const [locations] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(l.location_name, 'Campus General') AS name,
         COUNT(r.report_id) AS count,
         COALESCE(SUM(CASE WHEN r.report_type = 'LOST' THEN 1 ELSE 0 END), 0) AS lost,
         COALESCE(SUM(CASE WHEN r.report_type = 'FOUND' THEN 1 ELSE 0 END), 0) AS found
       FROM item_reports r
       LEFT JOIN campus_locations l ON l.location_id = r.location_id
       WHERE r.created_at BETWEEN ? AND ?
       GROUP BY l.location_id, l.location_name
       ORDER BY count DESC
       LIMIT 8`,
      [startIso, endIso]
    );

    // 9. Chart 6: Claim approval and rejection statistics
    const [claimStats] = await pool.execute<RowDataPacket[]>(
      `SELECT
         claim_status AS status,
         COUNT(*) AS count
       FROM claims
       WHERE submitted_at BETWEEN ? AND ?
       GROUP BY claim_status
       ORDER BY count DESC`,
      [startIso, endIso]
    );

    return NextResponse.json({
      success: true,
      filter: {
        range,
        rangeLabel,
        startDate: startIso,
        endDate: endIso,
      },
      kpis,
      charts: {
        lostVsFound,
        trends,
        categories,
        recovery: recoveryData,
        locations,
        claims: claimStats,
      },
    });
  } catch (error) {
    console.error("Admin Analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to calculate analytics" },
      { status: 500 }
    );
  }
}
