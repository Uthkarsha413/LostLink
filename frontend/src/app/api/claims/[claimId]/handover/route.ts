
import { NextRequest, NextResponse } from "next/server";

import type { RowDataPacket, ResultSetHeader } from "mysql2";

import { getSession } from "@/lib/session";

import pool from "@/lib/db";

interface ClaimRow extends RowDataPacket {
  claim_id: number;
  claim_status: string;
  lost_report_id: number;
  found_report_id: number;
  lost_status: string;
  found_status: string;
}

interface UserRow extends RowDataPacket {
  account_status: string;
  roles: string | null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ claimId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  const { claimId: claimIdText } = await context.params;
  const claimId = Number(claimIdText);

  if (!Number.isSafeInteger(claimId) || claimId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid claim ID" },
      { status: 400 }
    );
  }

  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null =
    null;

  let transactionStarted = false;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // 1. Verify that the current user is an active administrator.

    const [users] = await connection.query<UserRow[]>(
      `SELECT
         u.account_status,
         GROUP_CONCAT(r.role_name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.user_id
       LEFT JOIN roles r ON r.role_id = ur.role_id
       WHERE u.user_id = ?
       GROUP BY u.user_id
       FOR UPDATE`,
      [session.userId]
    );

    const user = users[0];

    if (
      !user ||
      user.account_status !== "ACTIVE" ||
      !user.roles?.split(",").includes("ADMIN")
    ) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { success: false, message: "Administrator access required" },
        { status: 403 }
      );
    }

    // 2. Lock the claim and its two associated reports.

    const [claims] = await connection.query<ClaimRow[]>(
      `SELECT
         c.claim_id,
         c.claim_status,
         c.lost_report_id,
         c.found_report_id,
         l.report_status AS lost_status,
         f.report_status AS found_status
       FROM claims c
       INNER JOIN item_reports l
         ON l.report_id = c.lost_report_id
       INNER JOIN item_reports f
         ON f.report_id = c.found_report_id
       WHERE c.claim_id = ?
       FOR UPDATE`,
      [claimId]
    );

    const claim = claims[0];

    if (!claim) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { success: false, message: "Claim not found" },
        { status: 404 }
      );
    }

    // 3. Only approved claims can be handed over.

    if (claim.claim_status !== "APPROVED") {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message: `Handover requires APPROVED status. Current status: ${claim.claim_status}`,
        },
        { status: 409 }
      );
    }

    // 4. Ensure both reports can be closed.

    const allowedReportStatuses = ["ACTIVE", "MATCHED", "CLAIMED"];

    if (
      !allowedReportStatuses.includes(claim.lost_status) ||
      !allowedReportStatuses.includes(claim.found_status)
    ) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message:
            "One or both reports cannot be closed in their current status",
        },
        { status: 409 }
      );
    }

    // 5. Mark the claim as handed over.

    const [claimUpdate] = await connection.execute<ResultSetHeader>(
      `UPDATE claims
       SET claim_status = 'HANDED_OVER',
           updated_at = CURRENT_TIMESTAMP
       WHERE claim_id = ?
         AND claim_status = 'APPROVED'`,
      [claimId]
    );

    if (claimUpdate.affectedRows !== 1) {
      throw new Error("Claim status could not be updated");
    }

    // 6. Explicitly set the trigger context on this connection.

    await connection.query(
      `SET
         @lostlink_actor_id = ?,
         @lostlink_change_source = 'ADMIN'`,
      [session.userId]
    );

    // 7. Close both related reports.

    const [reportUpdate] = await connection.execute<ResultSetHeader>(
      `UPDATE item_reports
       SET report_status = 'CLOSED'
       WHERE report_id IN (?, ?)
         AND report_status IN ('ACTIVE', 'MATCHED', 'CLAIMED')`,
      [claim.lost_report_id, claim.found_report_id]
    );

    if (reportUpdate.affectedRows !== 2) {
      throw new Error(
        `Expected to close 2 reports, but updated ${reportUpdate.affectedRows}`
      );
    }

    // 8. Record the handover in the administrator audit log.

    await connection.execute(
      `INSERT INTO admin_audit_logs (
         actor_id,
         action_type,
         entity_type,
         entity_id,
         old_values,
         new_values
       )
       VALUES (?, 'CLAIM_HANDOVER', 'CLAIM', ?, ?, ?)`,
      [
        session.userId,
        claimId,
        JSON.stringify({
          claim_status: "APPROVED",
          lost_report_status: claim.lost_status,
          found_report_status: claim.found_status,
        }),
        JSON.stringify({
          claim_status: "HANDED_OVER",
          lost_report_status: "CLOSED",
          found_report_status: "CLOSED",
        }),
      ]
    );

    // 9. Commit all MySQL changes together.

    await connection.commit();
    transactionStarted = false;

    // 10. Clean up Qdrant vectors AFTER successful MySQL commit.
    // Cleanup failures must never undo a successful handover.

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    const internalToken = process.env.LOSTLINK_INTERNAL_TOKEN;

    if (aiServiceUrl && internalToken) {
      const reportIds = [
        claim.lost_report_id,
        claim.found_report_id,
      ];

      try {
        const cleanupResults = await Promise.allSettled(
          reportIds.map(async (reportId) => {
            const response = await fetch(
              `${aiServiceUrl}/reports/cleanup`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${internalToken}`,
                },
                body: JSON.stringify({
                  report_id: reportId,
                }),
                cache: "no-store",
                signal: AbortSignal.timeout(15000),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Cleanup failed for report ${reportId}: HTTP ${response.status}`
              );
            }

            return reportId;
          })
        );

        cleanupResults.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(
              `Qdrant cleanup failed for report ${reportIds[index]}:`,
              result.reason
            );
          } else {
            console.log(
              `Qdrant cleanup successful for report ${result.value}`
            );
          }
        });
      } catch (cleanupError) {
        console.error(
          "Unexpected Qdrant cleanup error:",
          cleanupError
        );
      }
    } else {
      console.error(
        "Qdrant cleanup skipped: AI_SERVICE_URL or LOSTLINK_INTERNAL_TOKEN is missing."
      );
    }

    // 11. Return successful handover response.

    return NextResponse.json({
      success: true,
      message: "Item handover confirmed successfully",
      data: {
        claimId,
        claimStatus: "HANDED_OVER",
        lostReportId: claim.lost_report_id,
        foundReportId: claim.found_report_id,
        reportStatus: "CLOSED",
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Handover rollback error:", rollbackError);
      }
    }

    console.error("Handover error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to confirm handover",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      // Clear trigger context before returning the connection to the pool.

      try {
        await connection.query(
          "SET @lostlink_actor_id = NULL, @lostlink_change_source = NULL"
        );
      } catch (resetError) {
        console.error("Trigger context reset error:", resetError);
      }

      connection.release();
    }
  }
}
