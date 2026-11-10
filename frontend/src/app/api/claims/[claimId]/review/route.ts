
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordClaimTimelineEvents } from "@/lib/timeline";
import type { RowDataPacket } from "mysql2";

type ReviewerRow = RowDataPacket & {
  role_name: string;
};

type ClaimRow = RowDataPacket & {
  claim_id: number;
  claim_status: string;
  lost_report_id: number;
  found_report_id: number;
  claimant_id: number;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ claimId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
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

  const decision =
    typeof body.decision === "string"
      ? body.decision.trim().toUpperCase()
      : "";

const rawComments = body.reviewComments ?? body.comments;

const comments =
  typeof rawComments === "string"
    ? rawComments.trim()
    : "";

  if (comments.length > 5000) {
    return NextResponse.json(
      { success: false, message: "Comments are too long" },
      { status: 400 }
    );
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Get the reviewer's actual database role.
    const [roleRows] = await connection.execute<ReviewerRow[]>(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       JOIN users u ON u.user_id = ur.user_id
       WHERE ur.user_id = ?
         AND u.account_status = 'ACTIVE'
       AND r.role_name IN ('MODERATOR', 'ADMIN')`,
      [session.userId]
    );

    const roles = roleRows.map((row) => row.role_name);

    const isAdmin = roles.includes("ADMIN");
    const isModerator = roles.includes("MODERATOR");

    if (!isAdmin && !isModerator) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Review permission denied" },
        { status: 403 }
      );
    }

    // 2. Lock the claim while reviewing it.
    const [claimRows] = await connection.execute<ClaimRow[]>(
      `SELECT claim_id, claim_status, lost_report_id, found_report_id, claimant_id
       FROM claims
       WHERE claim_id = ?
       FOR UPDATE`,
      [claimId]
    );

    if (claimRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Claim not found" },
        { status: 404 }
      );
    }

    const claim = claimRows[0];
    const oldStatus = claim.claim_status;

    let newStatus: string;
    let reviewerRole: "MODERATOR" | "ADMIN";

    // 3. Moderator review.
    if (!isAdmin && isModerator) {
      reviewerRole = "MODERATOR";

      if (!["SUBMITTED", "MODERATOR_REVIEW"].includes(oldStatus)) {
        await connection.rollback();

        return NextResponse.json(
          { success: false, message: "Claim is not awaiting moderator review" },
          { status: 409 }
        );
      }

      if (!["ESCALATE", "REQUEST_INFO"].includes(decision)) {
        await connection.rollback();

        return NextResponse.json(
          {
            success: false,
            message: "Moderator may only escalate or request information",
          },
          { status: 400 }
        );
      }

      newStatus =
        decision === "ESCALATE"
          ? "ADMIN_REVIEW"
          : "MODERATOR_REVIEW";
    }

    // 4. Admin final decision.
    else {
      reviewerRole = "ADMIN";

      if (oldStatus !== "ADMIN_REVIEW") {
        await connection.rollback();

        return NextResponse.json(
          { success: false, message: "Claim is not awaiting admin review" },
          { status: 409 }
        );
      }

      if (!["APPROVE", "REJECT"].includes(decision)) {
        await connection.rollback();

        return NextResponse.json(
          {
            success: false,
            message: "Admin must approve or reject the claim",
          },
          { status: 400 }
        );
      }

      newStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
    }

    // 5. Save review history.
    await connection.execute(
      `INSERT INTO claim_reviews (
        claim_id,
        reviewer_id,
        reviewer_role,
        decision,
        review_comments
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        claimId,
        session.userId,
        reviewerRole,
        decision,
        comments || null,
      ]
    );

    // 6. Update claim status.
    await connection.execute(
      `UPDATE claims
       SET claim_status = ?
       WHERE claim_id = ?`,
      [newStatus, claimId]
    );

    // If approved, ensure claim_handovers entry is ready.
    if (newStatus === "APPROVED") {
      await connection.execute(
        `INSERT INTO claim_handovers (claim_id)
         VALUES (?)
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [claimId]
      );
    }

    // 7. Record timeline stage 5 for both reports.
    try {
      await recordClaimTimelineEvents(
        claim.lost_report_id,
        claim.found_report_id,
        {
          claimId,
          actorUserId: Number(session.userId),
          actorRole: reviewerRole,
          stageNumber: 5,
          eventType: "CLAIM_REVIEWED",
          eventTitle:
            newStatus === "APPROVED"
              ? "Claim Approved by Administrator"
              : "Claim Rejected by Administrator",
          eventDescription:
            newStatus === "APPROVED"
              ? "Ownership claim has been approved. Secure OTP handover verification is now unlocked."
              : `Ownership claim was rejected.${comments ? ` Reason: ${comments}` : ""}`,
          itemStatus: newStatus === "APPROVED" ? "CLAIMED" : "ACTIVE",
        },
        connection
      );
    } catch (timelineErr) {
      console.error("Timeline recording error (non-fatal):", timelineErr);
    }

    // 8. Record audit history.
    await connection.execute(
      `INSERT INTO admin_audit_logs (
        actor_id,
        action_type,
        entity_type,
        entity_id,
        old_values,
        new_values
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session.userId,
        `CLAIM_${decision}`,
        "CLAIM",
        claimId,
        JSON.stringify({ claim_status: oldStatus }),
        JSON.stringify({
          claim_status: newStatus,
          decision,
          reviewer_role: reviewerRole,
        }),
      ]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Claim review recorded successfully",
      data: {
        claimId,
        previousStatus: oldStatus,
        claimStatus: newStatus,
        decision,
        reviewerRole,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Claim review error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to process claim review" },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
