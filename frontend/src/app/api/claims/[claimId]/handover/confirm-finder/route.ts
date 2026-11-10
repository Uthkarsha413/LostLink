import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordClaimTimelineEvents } from "@/lib/timeline";
import { finalizeRecoveryTransaction } from "@/lib/recovery";
import type { RowDataPacket } from "mysql2";

interface ClaimCheckRow extends RowDataPacket {
  claim_id: number;
  claim_status: string;
  lost_report_id: number;
  found_report_id: number;
  finder_id: number;
  finder_name: string;
  otp_verified_at: Date | null;
  finder_confirmed_at: Date | null;
  claimant_confirmed_at: Date | null;
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

  const { claimId: rawClaimId } = await context.params;
  const claimId = Number(rawClaimId);

  if (!Number.isSafeInteger(claimId) || claimId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid claim ID" },
      { status: 400 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // default to true if no body provided
  }

  const confirmed = body.confirmed !== false;

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch claim and handover state with lock
    const [rows] = await connection.execute<ClaimCheckRow[]>(
      `SELECT
         c.claim_id,
         c.claim_status,
         c.lost_report_id,
         c.found_report_id,
         found.user_id AS finder_id,
         finder.full_name AS finder_name,
         ch.otp_verified_at,
         ch.finder_confirmed_at,
         ch.claimant_confirmed_at
       FROM claims c
       JOIN item_reports found ON found.report_id = c.found_report_id
       JOIN users finder ON finder.user_id = found.user_id
       LEFT JOIN claim_handovers ch ON ch.claim_id = c.claim_id
       WHERE c.claim_id = ?
       FOR UPDATE`,
      [claimId]
    );

    const claim = rows[0];

    if (!claim) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Claim not found" },
        { status: 404 }
      );
    }

    // 2. Authorisation: Only the finder who has the item (or admin) can confirm handover
    const currentUserId = Number(session.userId);
    const isFinder = currentUserId === claim.finder_id;

    const [adminRows] = await connection.execute<RowDataPacket[]>(
      `SELECT 1 FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = ? AND r.role_name = 'ADMIN'`,
      [currentUserId]
    );
    const isAdmin = adminRows.length > 0;

    if (!isFinder && !isAdmin) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only the person who found the item can confirm physical handover.",
        },
        { status: 403 }
      );
    }

    // 3. Claim must be APPROVED
    if (claim.claim_status !== "APPROVED" && claim.claim_status !== "HANDED_OVER") {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: `Handover confirmation requires APPROVED claim. Current status: ${claim.claim_status}`,
        },
        { status: 409 }
      );
    }

    // 4. If claim is already handed over, return success
    if (claim.claim_status === "HANDED_OVER") {
      await connection.commit();
      return NextResponse.json({
        success: true,
        completed: true,
        message: "Handover has already been completed.",
      });
    }

    // 5. Must have verified OTP first
    if (!claim.otp_verified_at) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "You must successfully verify the owner's OTP before confirming handover.",
        },
        { status: 400 }
      );
    }

    // 6. Handle "Not yet"
    if (!confirmed) {
      await connection.execute(
        `UPDATE claim_handovers
         SET finder_confirmed_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE claim_id = ?`,
        [claimId]
      );
      await connection.commit();
      return NextResponse.json({
        success: true,
        confirmed: false,
        message: "Handover confirmation deferred.",
      });
    }

    // 7. Update finder_confirmed_at
    await connection.execute(
      `UPDATE claim_handovers
       SET finder_confirmed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE claim_id = ?`,
      [claimId]
    );

    // 8. Record event in claim_handover_events
    await connection.execute(
      `INSERT INTO claim_handover_events (
         claim_id,
         actor_id,
         event_type,
         event_details
       )
       VALUES (?, ?, 'FINDER_HANDOVER_CONFIRMED', JSON_OBJECT('confirmed_at', CURRENT_TIMESTAMP))`,
      [claimId, session.userId]
    );

    // 9. Record Stage 7 in timeline
    try {
      await recordClaimTimelineEvents(
        claim.lost_report_id,
        claim.found_report_id,
        {
          claimId,
          actorUserId: currentUserId,
          actorRole: "FINDER",
          stageNumber: 7,
          eventType: "FINDER_HANDOVER_CONFIRMED",
          eventTitle: "Finder Confirmed Handover",
          eventDescription: `Finder ${claim.finder_name} verified the OTP and confirmed physical handover of the item to its owner.`,
          itemStatus: "CLAIMED",
        },
        connection
      );
    } catch (timelineErr) {
      console.error("Timeline error (non-fatal):", timelineErr);
    }

    // 10. Check if owner already confirmed. If so, execute final recovery!
    let recoveryResult;
    if (claim.claimant_confirmed_at) {
      recoveryResult = await finalizeRecoveryTransaction(
        connection,
        claimId,
        currentUserId
      );
    }

    await connection.commit();

    if (recoveryResult && recoveryResult.completed) {
      return NextResponse.json({
        success: true,
        completed: true,
        finderConfirmed: true,
        ownerConfirmed: true,
        message: "Both parties have confirmed! Item has been successfully recovered.",
        data: recoveryResult,
      });
    }

    return NextResponse.json({
      success: true,
      completed: false,
      finderConfirmed: true,
      ownerConfirmed: false,
      message: "Handover confirmed. Waiting for confirmation from the other party.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Finder handover confirmation error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to record finder handover confirmation" },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
