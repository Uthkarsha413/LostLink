import type { PoolConnection } from "mysql2/promise";
import pool from "@/lib/db";

export interface TimelineEventInput {
  reportId: number;
  claimId?: number | null;
  actorUserId?: number | null;
  actorRole?: string;
  stageNumber: number;
  eventType: string;
  eventTitle: string;
  eventDescription: string;
  itemStatus: string;
  createdAt?: Date;
}

/**
 * Record an event in the item tracking timeline.
 * If a connection is provided, runs within that connection/transaction; otherwise uses the pool.
 */
export async function recordTimelineEvent(
  event: TimelineEventInput,
  connection?: PoolConnection
): Promise<void> {
  const query = `
    INSERT INTO item_timeline_events (
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
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    event.reportId,
    event.claimId ?? null,
    event.actorUserId ?? null,
    event.actorRole ?? "SYSTEM",
    event.stageNumber,
    event.eventType,
    event.eventTitle,
    event.eventDescription,
    event.itemStatus,
    event.createdAt ? event.createdAt : new Date(),
  ];

  if (connection) {
    await connection.execute(query, values);
  } else {
    await pool.execute(query, values);
  }
}

/**
 * Record a timeline event for both the lost report and found report linked to a claim.
 */
export async function recordClaimTimelineEvents(
  lostReportId: number,
  foundReportId: number,
  event: Omit<TimelineEventInput, "reportId">,
  connection?: PoolConnection
): Promise<void> {
  await recordTimelineEvent(
    { ...event, reportId: lostReportId },
    connection
  );
  await recordTimelineEvent(
    { ...event, reportId: foundReportId },
    connection
  );
}
