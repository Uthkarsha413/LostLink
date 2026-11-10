import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import { recordClaimTimelineEvents } from "@/lib/timeline";

interface ClaimRow extends RowDataPacket {
  claim_id: number;
  claim_status: string;
  claimant_id: number;
  claimant_name: string;
  lost_report_id: number;
  found_report_id: number;
  lost_item_title: string;
  found_item_title: string;
  finder_id: number;
  finder_name: string;
  lost_status: string;
  found_status: string;
  otp_hash: string | null;
  otp_attempts: number;
  otp_expires_at: Date | null;
  otp_verified_at: Date | null;
  finder_confirmed_at: Date | null;
  claimant_confirmed_at: Date | null;
}

interface UserRow extends RowDataPacket {
  account_status: string;
  roles: string | null;
}

/**
 * GET: Retrieve secure handover state and participant status for a claim.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ claimId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  const { claimId: rawClaimId } = await context.params;
  const claimId = Number(rawClaimId);

  if (!Number.isSafeInteger(claimId) || claimId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid claim ID" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.execute<ClaimRow[]>(
      `SELECT
         c.claim_id,
         c.claim_status,
         c.claimant_id,
         claimant.full_name AS claimant_name,
         found.user_id AS finder_id,
         finder.full_name AS finder_name,
         c.lost_report_id,
         lost.title AS lost_item_title,
         lost.report_status AS lost_status,
         c.found_report_id,
         found.title AS found_item_title,
         found.report_status AS found_status,
         ch.otp_hash,
         COALESCE(ch.otp_attempts, 0) AS otp_attempts,
         ch.otp_expires_at,
         ch.otp_verified_at,
         ch.finder_confirmed_at,
         ch.claimant_confirmed_at
       FROM claims c
       JOIN users claimant ON claimant.user_id = c.claimant_id
       JOIN item_reports lost ON lost.report_id = c.lost_report_id
       JOIN item_reports found ON found.report_id = c.found_report_id
       JOIN users finder ON finder.user_id = found.user_id
       LEFT JOIN claim_handovers ch ON ch.claim_id = c.claim_id
       WHERE c.claim_id = ?`,
      [claimId]
    );

    const claim = rows[0];

    if (!claim) {
      return NextResponse.json(
        { success: false, message: "Claim not found" },
        { status: 404 }
      );
    }

    // Role verification
    const currentUserId = Number(session.userId);
    const isClaimant = currentUserId === claim.claimant_id;
    const isFinder = currentUserId === claim.finder_id;

    const [adminRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = ? AND r.role_name IN ('ADMIN', 'MODERATOR')`,
      [currentUserId]
    );
    const isAdminOrMod = adminRows.length > 0;

    if (!isClaimant && !isFinder && !isAdminOrMod) {
      return NextResponse.json(
        { success: false, message: "Access denied to this claim handover" },
        { status: 403 }
      );
    }

    const now = new Date();
    const otpExpires = claim.otp_expires_at ? new Date(claim.otp_expires_at) : null;
    const otpActive =
      Boolean(claim.otp_hash) &&
      Boolean(otpExpires && now < otpExpires) &&
      !claim.otp_verified_at;

    const attemptsRemaining = Math.max(0, 5 - claim.otp_attempts);

    return NextResponse.json({
      success: true,
      data: {
        claimId: claim.claim_id,
        claimStatus: claim.claim_status,
        lostReportId: claim.lost_report_id,
        foundReportId: claim.found_report_id,
        lostItemTitle: claim.lost_item_title,
        foundItemTitle: claim.found_item_title,
        claimantId: claim.claimant_id,
        claimantName: claim.claimant_name,
        finderId: claim.finder_id,
        finderName: claim.finder_name,
        userRole: {
          isClaimant,
          isFinder,
          isAdmin: isAdminOrMod,
        },
        otpState: {
          generated: Boolean(claim.otp_hash),
          active: otpActive,
          expiresAt: claim.otp_expires_at ? claim.otp_expires_at.toISOString() : null,
          attemptsRemaining,
          verified: Boolean(claim.otp_verified_at),
          verifiedAt: claim.otp_verified_at ? claim.otp_verified_at.toISOString() : null,
        },
        confirmationState: {
          finderConfirmed: Boolean(claim.finder_confirmed_at),
          finderConfirmedAt: claim.finder_confirmed_at
            ? claim.finder_confirmed_at.toISOString()
            : null,
          claimantConfirmed: Boolean(claim.claimant_confirmed_at),
          claimantConfirmedAt: claim.claimant_confirmed_at
            ? claim.claimant_confirmed_at.toISOString()
            : null,
          bothConfirmed: Boolean(claim.finder_confirmed_at && claim.claimant_confirmed_at),
          isCompleted: claim.claim_status === "HANDED_OVER",
        },
      },
    });
  } catch (error) {
    console.error("GET Handover error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to retrieve handover status" },
      { status: 500 }
    );
  }
}

/**
 * POST: Administrator override / direct handover completion with transaction.
 */
export async function POST(
  _request: NextRequest,
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

  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // 1. Verify admin role
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

    // 2. Lock claim and reports
    const [claims] = await connection.query<ClaimRow[]>(
      `SELECT
         c.claim_id,
         c.claim_status,
         c.lost_report_id,
         c.found_report_id,
         l.report_status AS lost_status,
         f.report_status AS found_status
       FROM claims c
       INNER JOIN item_reports l ON l.report_id = c.lost_report_id
       INNER JOIN item_reports f ON f.report_id = c.found_report_id
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

    // 3. Mark claim as HANDED_OVER
    await connection.execute<ResultSetHeader>(
      `UPDATE claims
       SET claim_status = 'HANDED_OVER',
           updated_at = CURRENT_TIMESTAMP
       WHERE claim_id = ?
         AND claim_status = 'APPROVED'`,
      [claimId]
    );

    // 4. Update handover record
    await connection.execute(
      `INSERT INTO claim_handovers (
         claim_id,
         finder_confirmed_at,
         claimant_confirmed_at,
         otp_verified_at,
         updated_at
       )
       VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         finder_confirmed_at = COALESCE(finder_confirmed_at, CURRENT_TIMESTAMP),
         claimant_confirmed_at = COALESCE(claimant_confirmed_at, CURRENT_TIMESTAMP),
         otp_verified_at = COALESCE(otp_verified_at, CURRENT_TIMESTAMP),
         updated_at = CURRENT_TIMESTAMP`,
      [claimId]
    );

    // 5. Trigger context
    await connection.query(
      `SET @lostlink_actor_id = ?, @lostlink_change_source = 'ADMIN'`,
      [session.userId]
    );

    // 6. Close reports
    await connection.execute<ResultSetHeader>(
      `UPDATE item_reports
       SET report_status = 'CLOSED',
           updated_at = CURRENT_TIMESTAMP
       WHERE report_id IN (?, ?)
         AND report_status IN ('ACTIVE', 'MATCHED', 'CLAIMED')`,
      [claim.lost_report_id, claim.found_report_id]
    );

    // 7. Audit log
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
        JSON.stringify({ claim_status: "APPROVED" }),
        JSON.stringify({ claim_status: "HANDED_OVER", report_status: "CLOSED" }),
      ]
    );

    // 8. Timeline events
    await recordClaimTimelineEvents(
      claim.lost_report_id,
      claim.found_report_id,
      {
        claimId,
        actorUserId: Number(session.userId),
        actorRole: "ADMIN",
        stageNumber: 9,
        eventType: "ITEM_RECOVERED",
        eventTitle: "Item Handover Completed by Administrator",
        eventDescription: "Administrator verified physical handover and marked item as recovered.",
        itemStatus: "CLOSED",
      },
      connection
    );

    await connection.commit();
    transactionStarted = false;

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
      } catch (e) {
        console.error("Rollback error:", e);
      }
    }
    console.error("Handover error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to confirm handover" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.query("SET @lostlink_actor_id = NULL, @lostlink_change_source = NULL");
      } catch {}
      connection.release();
    }
  }
}
