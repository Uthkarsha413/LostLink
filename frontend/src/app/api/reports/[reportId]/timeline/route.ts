import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface ReportMetaRow extends RowDataPacket {
  report_id: number;
  user_id: number;
  reporter_name: string;
  report_type: "LOST" | "FOUND";
  title: string;
  description: string;
  brand: string | null;
  color: string | null;
  event_datetime: Date | null;
  report_status: string;
  created_at: Date;
  category_name: string;
  location_name: string | null;
}

interface TimelineEventRow extends RowDataPacket {
  event_id: number;
  report_id: number;
  claim_id: number | null;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_role: string | null;
  stage_number: number;
  event_type: string;
  event_title: string;
  event_description: string;
  item_status: string;
  created_at: Date;
}

const STAGES_DEFINITIONS = [
  { stage: 1, key: "REPORT_SUBMITTED", label: "Report Submitted" },
  { stage: 2, key: "REPORT_REVIEWED", label: "Report Reviewed" },
  { stage: 3, key: "AI_MATCH_IDENTIFIED", label: "AI Match Identified" },
  { stage: 4, key: "CLAIM_SUBMITTED", label: "Claim Submitted" },
  { stage: 5, key: "CLAIM_REVIEWED", label: "Claim Reviewed" },
  { stage: 6, key: "OTP_GENERATED", label: "Handover OTP Generated" },
  { stage: 7, key: "FINDER_HANDOVER_CONFIRMED", label: "Finder Confirms Handover" },
  { stage: 8, key: "OWNER_RECEIPT_CONFIRMED", label: "Owner Confirms Receipt" },
  { stage: 9, key: "ITEM_RECOVERED", label: "Item Successfully Recovered" },
];

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
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

  try {
    // 1. Fetch report details
    const [reports] = await pool.execute<ReportMetaRow[]>(
      `SELECT
         r.report_id,
         r.user_id,
         u.full_name AS reporter_name,
         r.report_type,
         r.title,
         r.description,
         r.brand,
         r.color,
         r.event_datetime,
         r.report_status,
         r.created_at,
         c.category_name,
         l.location_name
       FROM item_reports r
       JOIN users u ON u.user_id = r.user_id
       JOIN categories c ON c.category_id = r.category_id
       LEFT JOIN campus_locations l ON l.location_id = r.location_id
       WHERE r.report_id = ?`,
      [reportId]
    );

    const report = reports[0];

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found" },
        { status: 404 }
      );
    }

    // 2. Fetch timeline events for this report
    const [events] = await pool.execute<TimelineEventRow[]>(
      `SELECT
         e.event_id,
         e.report_id,
         e.claim_id,
         e.actor_user_id,
         u.full_name AS actor_name,
         e.actor_role,
         e.stage_number,
         e.event_type,
         e.event_title,
         e.event_description,
         e.item_status,
         e.created_at
       FROM item_timeline_events e
       LEFT JOIN users u ON u.user_id = e.actor_user_id
       WHERE e.report_id = ?
       ORDER BY e.created_at ASC, e.stage_number ASC, e.event_id ASC`,
      [reportId]
    );

    // 3. Compute stage progression
    const completedStages = new Set(events.map((e) => e.stage_number));
    const highestStage = events.length > 0
      ? Math.max(...events.map((e) => e.stage_number))
      : 1;

    const stagesSummary = STAGES_DEFINITIONS.map((def) => {
      const isCompleted = completedStages.has(def.stage);
      const isCurrent =
        report.report_status === "CLOSED"
          ? def.stage === 9
          : def.stage === highestStage;

      return {
        stageNumber: def.stage,
        key: def.key,
        label: def.label,
        completed: isCompleted,
        current: isCurrent,
        events: events.filter((e) => e.stage_number === def.stage),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        report: {
          reportId: report.report_id,
          reportType: report.report_type,
          title: report.title,
          description: report.description,
          brand: report.brand,
          color: report.color,
          categoryName: report.category_name,
          locationName: report.location_name,
          reportStatus: report.report_status,
          createdAt: report.created_at.toISOString(),
          reporterName: report.reporter_name,
          isOwner: Number(session.userId) === report.user_id,
        },
        currentStage: highestStage,
        completedStagesCount: completedStages.size,
        totalStages: 9,
        stagesSummary,
        events,
      },
    });
  } catch (error) {
    console.error("Timeline retrieval error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load timeline" },
      { status: 500 }
    );
  }
}
