import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordClaimTimelineEvents } from "@/lib/timeline";
import type { RowDataPacket } from "mysql2";

interface ClaimCheckRow extends RowDataPacket {
  claim_id: number;
  claim_status: string;
  claimant_id: number;
  lost_report_id: number;
  found_report_id: number;
  finder_id: number;
  otp_verified_at: Date | null;
}

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

  const { claimId: rawClaimId } = await context.params;
  const claimId = Number(rawClaimId);

  if (!Number.isSafeInteger(claimId) || claimId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid claim ID" },
      { status: 400 }
    );
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch claim, participants and status with row lock.
    const [claims] = await connection.execute<ClaimCheckRow[]>(
      `SELECT
         c.claim_id,
         c.claim_status,
         c.claimant_id,
         c.lost_report_id,
         c.found_report_id,
         found.user_id AS finder_id,
         ch.otp_verified_at
       FROM claims c
       JOIN item_reports found ON found.report_id = c.found_report_id
       LEFT JOIN claim_handovers ch ON ch.claim_id = c.claim_id
       WHERE c.claim_id = ?
       FOR UPDATE`,
      [claimId]
    );

    const claim = claims[0];

    if (!claim) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Claim not found" },
        { status: 404 }
      );
    }

    // 2. Authorisation check: only claimant or admin can generate/request OTP.
    const currentUserId = Number(session.userId);
    const isClaimant = currentUserId === claim.claimant_id;

    // Check if user has ADMIN role
    const [adminRows] = await connection.execute<RowDataPacket[]>(
      `SELECT 1 FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = ? AND r.role_name = 'ADMIN'`,
      [currentUserId]
    );
    const isAdmin = adminRows.length > 0;

    if (!isClaimant && !isAdmin) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only the verified owner or an administrator can generate the handover OTP.",
        },
        { status: 403 }
      );
    }

    // 3. Claim status validation: must be APPROVED.
    if (claim.claim_status !== "APPROVED") {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: `Handover OTP can only be generated for APPROVED claims. Current status: ${claim.claim_status}`,
        },
        { status: 409 }
      );
    }

    // 4. Prevent OTP generation if already verified.
    if (claim.otp_verified_at) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "OTP has already been verified for this handover.",
        },
        { status: 409 }
      );
    }

    // 5. Generate cryptographically secure random 6-digit OTP.
    const otpNumber = crypto.randomInt(100000, 1000000);
    const otp = otpNumber.toString();

    // 6. Compute SHA-256 hash.
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // 7. 10-minute expiry time.
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 8. Store only the hash, reset attempts, set expiry in claim_handovers.
    await connection.execute(
      `INSERT INTO claim_handovers (
         claim_id,
         otp_hash,
         otp_attempts,
         otp_expires_at,
         otp_verified_at,
         updated_at
       )
       VALUES (?, ?, 0, ?, NULL, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         otp_hash = VALUES(otp_hash),
         otp_attempts = 0,
         otp_expires_at = VALUES(otp_expires_at),
         otp_verified_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
      [claimId, otpHash, expiresAt]
    );

    // 9. Record handover event.
    await connection.execute(
      `INSERT INTO claim_handover_events (
         claim_id,
         actor_id,
         event_type,
         event_details
       )
       VALUES (?, ?, 'OTP_GENERATED', JSON_OBJECT('expires_at', ?))`,
      [claimId, session.userId, expiresAt.toISOString()]
    );

    // 10. Record Stage 6 in item tracking timeline for both reports.
    try {
      await recordClaimTimelineEvents(
        claim.lost_report_id,
        claim.found_report_id,
        {
          claimId,
          actorUserId: currentUserId,
          actorRole: isClaimant ? "OWNER" : "ADMIN",
          stageNumber: 6,
          eventType: "OTP_GENERATED",
          eventTitle: "Handover OTP Generated",
          eventDescription:
            "Secure 6-digit verification code generated for physical handover. Valid for 10 minutes.",
          itemStatus: "CLAIMED",
        },
        connection
      );
    } catch (timelineErr) {
      console.error("Timeline error (non-fatal):", timelineErr);
    }

    await connection.commit();

    // 11. Return plaintext OTP only to the verified recipient.
    return NextResponse.json({
      success: true,
      message: "Handover OTP generated successfully",
      data: {
        claimId,
        otp,
        expiresAt: expiresAt.toISOString(),
        expiresInSeconds: 600,
        securityNote:
          "Share this 6-digit code with the finder ONLY in person when receiving your item.",
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("OTP generation error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to generate handover OTP" },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
