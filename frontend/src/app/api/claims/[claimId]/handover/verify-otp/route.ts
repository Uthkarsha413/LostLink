import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { RowDataPacket } from "mysql2";

interface ClaimCheckRow extends RowDataPacket {
  claim_id: number;
  claim_status: string;
  claimant_id: number;
  finder_id: number;
  lost_report_id: number;
  found_report_id: number;
  otp_hash: string | null;
  otp_attempts: number;
  otp_expires_at: Date | null;
  otp_verified_at: Date | null;
}

const MAX_OTP_ATTEMPTS = 5;

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request" },
      { status: 400 }
    );
  }

  const rawOtp = body.otp;
  const otp = typeof rawOtp === "string" ? rawOtp.trim() : "";

  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { success: false, message: "Please provide a valid 6-digit numeric OTP" },
      { status: 400 }
    );
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch claim, finder, and handover metadata with row lock.
    const [claims] = await connection.execute<ClaimCheckRow[]>(
      `SELECT
         c.claim_id,
         c.claim_status,
         c.claimant_id,
         c.lost_report_id,
         c.found_report_id,
         found.user_id AS finder_id,
         ch.otp_hash,
         COALESCE(ch.otp_attempts, 0) AS otp_attempts,
         ch.otp_expires_at,
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

    // 2. Authorisation: Only the finder (or admin) can verify the claimant's OTP.
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
            "Access denied. Only the finder who holds the item can verify the handover OTP.",
        },
        { status: 403 }
      );
    }

    // 3. Claim status validation.
    if (claim.claim_status !== "APPROVED") {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: `OTP verification requires APPROVED status. Current status: ${claim.claim_status}`,
        },
        { status: 409 }
      );
    }

    // 4. Check if already verified.
    if (claim.otp_verified_at) {
      await connection.commit();
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "OTP has already been verified. Proceed to physical handover confirmation.",
      });
    }

    // 5. Ensure OTP has been generated.
    if (!claim.otp_hash || !claim.otp_expires_at) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message:
            "No active OTP found. Please ask the item owner to generate a handover OTP first.",
        },
        { status: 400 }
      );
    }

    // 6. Check attempt count.
    if (claim.otp_attempts >= MAX_OTP_ATTEMPTS) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum verification attempts exceeded. Please ask the owner to generate a fresh OTP.",
        },
        { status: 429 }
      );
    }

    // 7. Check expiration.
    const now = new Date();
    const expiresAt = new Date(claim.otp_expires_at);

    if (now > expiresAt) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "OTP has expired. Please ask the item owner to generate a new OTP.",
        },
        { status: 410 }
      );
    }

    // 8. Hash input OTP and compare with stored hash using constant-time comparison.
    const inputHash = crypto.createHash("sha256").update(otp).digest("hex");

    const inputHashBuf = Buffer.from(inputHash, "utf8");
    const storedHashBuf = Buffer.from(claim.otp_hash, "utf8");

    const isMatch =
      inputHashBuf.length === storedHashBuf.length &&
      crypto.timingSafeEqual(inputHashBuf, storedHashBuf);

    if (!isMatch) {
      const newAttempts = claim.otp_attempts + 1;

      await connection.execute(
        `UPDATE claim_handovers
         SET otp_attempts = ?
         WHERE claim_id = ?`,
        [newAttempts, claimId]
      );

      await connection.execute(
        `INSERT INTO claim_handover_events (
           claim_id,
           actor_id,
           event_type,
           event_details
         )
         VALUES (?, ?, 'OTP_VERIFICATION_FAILED', JSON_OBJECT('attempt', ?))`,
        [claimId, session.userId, newAttempts]
      );

      await connection.commit();

      const remainingAttempts = Math.max(0, MAX_OTP_ATTEMPTS - newAttempts);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
          attemptsRemaining: remainingAttempts,
        },
        { status: 400 }
      );
    }

    // 9. Match! Set otp_verified_at.
    await connection.execute(
      `UPDATE claim_handovers
       SET otp_verified_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE claim_id = ?`,
      [claimId]
    );

    // 10. Record handover event.
    await connection.execute(
      `INSERT INTO claim_handover_events (
         claim_id,
         actor_id,
         event_type,
         event_details
       )
       VALUES (?, ?, 'OTP_VERIFIED', JSON_OBJECT('verified_at', CURRENT_TIMESTAMP))`,
      [claimId, session.userId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. Please confirm that you have physically handed over the item.",
      data: {
        claimId,
        otpVerified: true,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to verify OTP" },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
