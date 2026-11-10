import type { PoolConnection } from "mysql2/promise";
import { recordClaimTimelineEvents } from "@/lib/timeline";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface ClaimLockRow extends RowDataPacket {
  claim_id: number;
  claim_status: string;
  claimant_id: number;
  lost_report_id: number;
  found_report_id: number;
  lost_status: string;
  found_status: string;
  finder_id: number;
  otp_verified_at: Date | null;
  finder_confirmed_at: Date | null;
  claimant_confirmed_at: Date | null;
}

export interface FinalRecoveryResult {
  completed: boolean;
  waitingFor?: "FINDER" | "OWNER";
  message: string;
  claimId: number;
  claimStatus: string;
  reportStatus?: string;
}

/**
 * Execute final recovery transaction when both parties have confirmed.
 * Concurrency-safe: locks the claim, reports, and handover record FOR UPDATE.
 */
export async function finalizeRecoveryTransaction(
  connection: PoolConnection,
  claimId: number,
  actorUserId: number
): Promise<FinalRecoveryResult> {
  // 1. Lock and validate claim, reports and handover record
  const [rows] = await connection.execute<ClaimLockRow[]>(
    `SELECT
       c.claim_id,
       c.claim_status,
       c.claimant_id,
       c.lost_report_id,
       c.found_report_id,
       lost.report_status AS lost_status,
       found.report_status AS found_status,
       found.user_id AS finder_id,
       ch.otp_verified_at,
       ch.finder_confirmed_at,
       ch.claimant_confirmed_at
     FROM claims c
     INNER JOIN item_reports lost ON lost.report_id = c.lost_report_id
     INNER JOIN item_reports found ON found.report_id = c.found_report_id
     INNER JOIN claim_handovers ch ON ch.claim_id = c.claim_id
     WHERE c.claim_id = ?
     FOR UPDATE`,
    [claimId]
  );

  const claim = rows[0];

  if (!claim) {
    throw new Error("Claim or handover record not found");
  }

  // Idempotency: If already handed over, return immediately
  if (claim.claim_status === "HANDED_OVER") {
    return {
      completed: true,
      message: "Handover has already been completed.",
      claimId,
      claimStatus: "HANDED_OVER",
      reportStatus: "CLOSED",
    };
  }

  // Verify OTP verification status
  if (!claim.otp_verified_at) {
    throw new Error("Cannot finalize handover: OTP has not been verified");
  }

  // Check finder confirmation status
  if (!claim.finder_confirmed_at) {
    return {
      completed: false,
      waitingFor: "FINDER",
      message: "Waiting for confirmation from the finder.",
      claimId,
      claimStatus: claim.claim_status,
    };
  }

  // Check owner confirmation status
  if (!claim.claimant_confirmed_at) {
    return {
      completed: false,
      waitingFor: "OWNER",
      message: "Waiting for confirmation from the owner.",
      claimId,
      claimStatus: claim.claim_status,
    };
  }

  // BOTH confirmed! Execute final recovery updates.

  // 1. Update claim status to HANDED_OVER
  const [claimUpdate] = await connection.execute<ResultSetHeader>(
    `UPDATE claims
     SET claim_status = 'HANDED_OVER',
         updated_at = CURRENT_TIMESTAMP
     WHERE claim_id = ?
       AND claim_status = 'APPROVED'`,
    [claimId]
  );

  if (claimUpdate.affectedRows !== 1) {
    throw new Error("Failed to update claim to HANDED_OVER status");
  }

  // 2. Set database trigger context
  await connection.query(
    `SET @lostlink_actor_id = ?, @lostlink_change_source = 'SYSTEM'`,
    [actorUserId]
  );

  // 3. Update both reports to CLOSED
  const [reportUpdate] = await connection.execute<ResultSetHeader>(
    `UPDATE item_reports
     SET report_status = 'CLOSED',
         updated_at = CURRENT_TIMESTAMP
     WHERE report_id IN (?, ?)
       AND report_status IN ('ACTIVE', 'MATCHED', 'CLAIMED')`,
    [claim.lost_report_id, claim.found_report_id]
  );

  if (reportUpdate.affectedRows < 1) {
    throw new Error("Failed to update associated item reports to CLOSED");
  }

  // 4. Insert handover completion event
  await connection.execute(
    `INSERT INTO claim_handover_events (
       claim_id,
       actor_id,
       event_type,
       event_details
     )
     VALUES (?, ?, 'HANDOVER_COMPLETED', JSON_OBJECT('completed_at', CURRENT_TIMESTAMP))`,
    [claimId, actorUserId]
  );

  // 5. Insert Stage 9 timeline events for both reports
  await recordClaimTimelineEvents(
    claim.lost_report_id,
    claim.found_report_id,
    {
      claimId,
      actorUserId,
      actorRole: "SYSTEM",
      stageNumber: 9,
      eventType: "ITEM_RECOVERED",
      eventTitle: "Item Successfully Recovered",
      eventDescription:
        "Dual confirmation completed: Finder confirmed physical handover and owner confirmed receipt. Item successfully recovered and reports closed.",
      itemStatus: "CLOSED",
    },
    connection
  );

  // 6. Record in admin_audit_logs
  await connection.execute(
    `INSERT INTO admin_audit_logs (
       actor_id,
       action_type,
       entity_type,
       entity_id,
       old_values,
       new_values
     )
     VALUES (?, 'SECURE_HANDOVER_COMPLETED', 'CLAIM', ?, ?, ?)`,
    [
      actorUserId,
      claimId,
      JSON.stringify({
        claim_status: claim.claim_status,
        lost_report_status: claim.lost_status,
        found_report_status: claim.found_status,
      }),
      JSON.stringify({
        claim_status: "HANDED_OVER",
        lost_report_status: "CLOSED",
        found_report_status: "CLOSED",
        dual_confirmed: true,
      }),
    ]
  );

  // Trigger post-commit Qdrant vector cleanup asynchronously
  triggerVectorCleanup(claim.lost_report_id, claim.found_report_id);

  return {
    completed: true,
    message: "Handover successfully completed! Item has been recovered.",
    claimId,
    claimStatus: "HANDED_OVER",
    reportStatus: "CLOSED",
  };
}

/**
 * Clean up Qdrant vectors after commit (best-effort, non-blocking)
 */
function triggerVectorCleanup(lostReportId: number, foundReportId: number) {
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  const internalToken = process.env.LOSTLINK_INTERNAL_TOKEN;

  if (!aiServiceUrl || !internalToken) return;

  const reportIds = [lostReportId, foundReportId];
  Promise.allSettled(
    reportIds.map(async (reportId) => {
      const response = await fetch(`${aiServiceUrl}/reports/cleanup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${internalToken}`,
        },
        body: JSON.stringify({ report_id: reportId }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        throw new Error(`Cleanup failed: ${response.status}`);
      }
      return reportId;
    })
  ).catch((err) => {
    console.error("Async Qdrant cleanup error (non-fatal):", err);
  });
}
