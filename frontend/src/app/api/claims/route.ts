
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordClaimTimelineEvents } from "@/lib/timeline";
import type { RowDataPacket } from "mysql2";

interface ClaimProcedureRow {
  claim_id: number | string;
  claim_status: string;
  message: string;
}

interface ModeratorRow extends RowDataPacket {
  user_id: number;
}

export async function POST(request: NextRequest) {
  let connection;

  try {
    // 1. Verify login.
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Validate request.
    const body = await request.json();

    const foundReportId = Number(body.foundReportId);
    const lostReportId = Number(body.lostReportId);

    const matchId =
      body.matchId === undefined ||
      body.matchId === null ||
      body.matchId === ""
        ? null
        : Number(body.matchId);

    if (
      !Number.isSafeInteger(foundReportId) ||
      foundReportId <= 0 ||
      !Number.isSafeInteger(lostReportId) ||
      lostReportId <= 0 ||
      (matchId !== null &&
        (!Number.isSafeInteger(matchId) || matchId <= 0))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid report or match ID" },
        { status: 400 }
      );
    }

    // 3. Connect to database.
    connection = await pool.getConnection();

    // 4. Submit claim using the existing stored procedure.
    const [results] = await connection.query(
      "CALL sp_submit_claim(?, ?, ?, ?)",
      [
        foundReportId,
        lostReportId,
        session.userId,
        matchId,
      ]
    );

    const resultSets = results as Array<
      Array<ClaimProcedureRow>
    >;

    const claim = resultSets[0]?.[0];

    if (!claim?.claim_id) {
      throw new Error("Claim procedure did not return a claim ID");
    }

    const claimId = Number(claim.claim_id);

    // 5. Get the claimant's name and item details.
    const [reportRows] = await connection.execute<RowDataPacket[]>(
      `SELECT
         lost.title AS lost_title,
         found.title AS found_title,
         claimant.full_name AS claimant_name
       FROM item_reports lost
       JOIN item_reports found
         ON found.report_id = ?
       JOIN users claimant
         ON claimant.user_id = ?
       WHERE lost.report_id = ?`,
      [foundReportId, session.userId, lostReportId]
    );

    const report = reportRows[0];

    if (!report) {
      throw new Error("Unable to retrieve claim details");
    }

    // 6. Find all active moderators.
    const [moderators] = await connection.execute<ModeratorRow[]>(
      `SELECT DISTINCT u.user_id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
       WHERE u.account_status = 'ACTIVE'
         AND r.role_name = 'MODERATOR'`,
      []
    );

    // 7. Create notifications for moderators.
    for (const moderator of moderators) {
      const [notificationResult] = await connection.execute(
        `INSERT INTO notifications (
           user_id,
           notification_type,
           title,
           message,
           reference_type,
           reference_id
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          moderator.user_id,
          "CLAIM_SUBMITTED",
          "New ownership claim submitted",
          `${report.claimant_name} submitted a claim for "${report.lost_title}". Possible found item: "${report.found_title}".`,
          "CLAIM",
          claimId,
        ]
      );

      const notificationId = (
        notificationResult as { insertId: number | bigint }
      ).insertId;

      // Create an in-app delivery record.
      await connection.execute(
        `INSERT INTO notification_deliveries (
           notification_id,
           channel,
           delivery_status
         )
         VALUES (?, 'IN_APP', 'SENT')`,
        [notificationId]
      );
    }

    // 8. Record stage 4 timeline events for both reports.
    try {
      await recordClaimTimelineEvents(
        lostReportId,
        foundReportId,
        {
          claimId,
          actorUserId: Number(session.userId),
          actorRole: "STUDENT",
          stageNumber: 4,
          eventType: "CLAIM_SUBMITTED",
          eventTitle: "Ownership Claim Submitted",
          eventDescription: `${report.claimant_name} submitted an ownership claim for "${report.lost_title}".`,
          itemStatus: "CLAIMED",
        },
        connection
      );
    } catch (timelineErr) {
      console.error("Timeline recording error (non-fatal):", timelineErr);
    }

    // 9. Return successful claim submission.
    return NextResponse.json(
      {
        success: true,
        message: claim.message ?? "Claim submitted successfully",
        data: {
          claimId,
          claimStatus: claim.claim_status ?? "SUBMITTED",
          notificationsCreated: moderators.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Claim submission error:", error);

    const message =
      error instanceof Error &&
      error.message.includes("Invalid")
        ? error.message
        : "Unable to submit claim. Please verify the reports.";

    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  } finally {
    connection?.release();
  }
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const connection = await pool.getConnection();

    try {
      // Identify the user's active roles.
      const [roleRows] = await connection.execute<
        (RowDataPacket & { role_name: string })[]
      >(
        `SELECT r.role_name
         FROM user_roles ur
         JOIN roles r ON r.role_id = ur.role_id
         JOIN users u ON u.user_id = ur.user_id
         WHERE ur.user_id = ?
           AND u.account_status = 'ACTIVE'`,
        [session.userId]
      );

      const roles = roleRows.map((row) => row.role_name);

      const canReview =
        roles.includes("ADMIN") ||
        roles.includes("MODERATOR");

      // Retrieve review queue or the user's claims (both as claimant and as finder).
      const [claims] = await connection.execute<RowDataPacket[]>(
        `SELECT
           c.claim_id,
           c.claim_status,
           c.submitted_at,
           c.updated_at,
           c.claimant_id,
           claimant.full_name AS claimant_name,
           claimant.email AS claimant_email,
           found.user_id AS finder_id,
           finder.full_name AS finder_name,
           finder.email AS finder_email,
           c.lost_report_id,
           lost.title AS lost_item_title,
           lost.description AS lost_description,
           lost.brand AS lost_brand,
           lost.color AS lost_color,
           c.found_report_id,
           found.title AS found_item_title,
           found.description AS found_description,
           found.brand AS found_brand,
           found.color AS found_color,
           c.match_id,
           ch.otp_verified_at,
           ch.finder_confirmed_at,
           ch.claimant_confirmed_at,
           ch.otp_expires_at,
           CASE
             WHEN ch.otp_expires_at IS NOT NULL AND ch.otp_expires_at > NOW() AND ch.otp_verified_at IS NULL THEN 1
             ELSE 0
           END AS otp_is_active,
           CASE
             WHEN ch.otp_verified_at IS NOT NULL THEN 1
             ELSE 0
           END AS otp_verified,
           CASE
             WHEN ch.finder_confirmed_at IS NOT NULL THEN 1
             ELSE 0
           END AS finder_confirmed,
           CASE
             WHEN ch.claimant_confirmed_at IS NOT NULL THEN 1
             ELSE 0
           END AS claimant_confirmed,
           CASE WHEN c.claimant_id = ? THEN 1 ELSE 0 END AS is_claimant,
           CASE WHEN found.user_id = ? THEN 1 ELSE 0 END AS is_finder
         FROM claims c
         JOIN users claimant
           ON claimant.user_id = c.claimant_id
         JOIN item_reports lost
           ON lost.report_id = c.lost_report_id
         JOIN item_reports found
           ON found.report_id = c.found_report_id
         JOIN users finder
           ON finder.user_id = found.user_id
         LEFT JOIN claim_handovers ch
           ON ch.claim_id = c.claim_id
         ${
           canReview
             ? `WHERE c.claim_status IN (
                  'SUBMITTED',
                  'MODERATOR_REVIEW',
                  'ADMIN_REVIEW',
                  'APPROVED',
                  'HANDED_OVER'
                )`
             : `WHERE c.claimant_id = ? OR found.user_id = ?`
         }
         ORDER BY c.submitted_at DESC`,
        canReview
          ? [session.userId, session.userId]
          : [session.userId, session.userId, session.userId, session.userId]
      );

      // Attach evidence and previous review comments to each claim
      if (claims.length > 0) {
        const claimIds = (claims as any[]).map((c) => c.claim_id);
        const placeholders = claimIds.map(() => '?').join(',');

        const [evidenceRows] = await connection.execute<RowDataPacket[]>(
          `SELECT evidence_id, claim_id, evidence_type, evidence_text, storage_key, submitted_at
           FROM claim_evidence
           WHERE claim_id IN (${placeholders})
           ORDER BY submitted_at ASC`,
          claimIds
        );

        const [reviewRows] = await connection.execute<RowDataPacket[]>(
          `SELECT r.review_id, r.claim_id, r.reviewer_id, u.full_name AS reviewer_name, r.reviewer_role, r.decision, r.review_comments, r.reviewed_at
           FROM claim_reviews r
           JOIN users u ON u.user_id = r.reviewer_id
           WHERE r.claim_id IN (${placeholders})
           ORDER BY r.reviewed_at ASC`,
          claimIds
        );

        const evidenceMap: Record<number, RowDataPacket[]> = {};
        for (const ev of evidenceRows) {
          const cid = (ev as any).claim_id;
          if (!evidenceMap[cid]) evidenceMap[cid] = [];
          evidenceMap[cid].push(ev);
        }

        const reviewsMap: Record<number, RowDataPacket[]> = {};
        for (const rev of reviewRows) {
          const cid = (rev as any).claim_id;
          if (!reviewsMap[cid]) reviewsMap[cid] = [];
          reviewsMap[cid].push(rev);
        }

        for (const c of claims as any[]) {
          c.evidence = evidenceMap[c.claim_id] || [];
          c.reviews = reviewsMap[c.claim_id] || [];
        }
      }

      return NextResponse.json({
        success: true,
        data: claims,
        count: claims.length,
        view: canReview ? "REVIEW_QUEUE" : "MY_CLAIMS",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Claims listing error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve claims" },
      { status: 500 }
    );
  }
}
