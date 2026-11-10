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
  claimant_id: number;
  claimant_name: string;
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
         c.claimant_id,
         claimant.full_name AS claimant_name,
         ch.otp_verified_at,
         ch.finder_confirmed_at,
         ch.claimant_confirmed_at
       FROM claims c
       JOIN users claimant ON claimant.user_id = c.claimant_id
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

    // 2. Authorisation: Only the claimant / owner (or admin) can confirm receipt
    const currentUserId = Number(session.userId);
    const isOwner = currentUserId === claim.claimant_id;

    const [adminRows] = await connection.execute<RowDataPacket[]>(
      `SELECT 1 FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = ? AND r.role_name = 'ADMIN'`,
      [currentUserId]
    );
    const isAdmin = adminRows.length > 0;

    if (!isOwner && !isAdmin) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only the verified item owner can confirm receipt of the item.",
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
          message: `Receipt confirmation requires APPROVED claim. Current status: ${claim.claim_status}`,
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
          message:
            "Physical handover requires OTP verification by the finder before receipt can be confirmed.",
        },
        { status: 400 }
      );
    }

    // 6. Handle "Not yet"
    if (!confirmed) {
      await connection.execute(
        `UPDATE claim_handovers
         SET claimant_confirmed_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE claim_id = ?`,
        [claimId]
      );
      await connection.commit();
      return NextResponse.json({
        success: true,
        confirmed: false,
        message: "Receipt confirmation deferred.",
      });
    }

    // 7. Update claimant_confirmed_at
    await connection.execute(
      `UPDATE claim_handovers
       SET claimant_confirmed_at = CURRENT_TIMESTAMP,
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
       VALUES (?, ?, 'CLAIMANT_RECEIPT_CONFIRMED', JSON_OBJECT('confirmed_at', CURRENT_TIMESTAMP))`,
      [claimId, session.userId]
    );

    // 9. Record Stage 8 in timeline
    try {
      await recordClaimTimelineEvents(
        claim.lost_report_id,
        claim.found_report_id,
        {
          claimId,
          actorUserId: currentUserId,
          actorRole: "OWNER",
          stageNumber: 8,
          eventType: "OWNER_RECEIPT_CONFIRMED",
          eventTitle: "Owner Confirmed Receipt",
          eventDescription: `Owner ${claim.claimant_name} confirmed receipt of their lost belongings.`,
          itemStatus: "CLOSED",
        },
        connection
      );
    } catch (timelineErr) {
      console.error("Timeline error (non-fatal):", timelineErr);
    }

    // 10. Check if finder already confirmed. If so, execute final recovery!
    let recoveryResult;
    if (claim.finder_confirmed_at) {
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
      finderConfirmed: false,
      ownerConfirmed: true,
      message: "Receipt confirmed. Waiting for confirmation from the other party.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Owner receipt confirmation error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to record owner receipt confirmation" },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
