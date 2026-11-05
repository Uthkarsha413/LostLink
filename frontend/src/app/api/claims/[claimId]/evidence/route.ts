
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

const ALLOWED_TYPES = [
  "PURCHASE_PROOF",
  "UNIQUE_MARK",
  "DESCRIPTION",
  "OTHER",
] as const;

type ClaimRow = RowDataPacket & {
  claim_id: number;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ claimId: string }> }
) {
  try {
    // 1. Verify session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2. Validate claim ID
    const { claimId: rawClaimId } = await context.params;
    const claimId = Number(rawClaimId);

    if (!Number.isSafeInteger(claimId) || claimId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid claim ID" },
        { status: 400 }
      );
    }

    // 3. Read evidence details
    const body = await request.json();

    const evidenceType =
      typeof body.evidenceType === "string"
        ? body.evidenceType.trim().toUpperCase()
        : "";

    const evidenceText =
      typeof body.evidenceText === "string"
        ? body.evidenceText.trim()
        : "";

    if (
      !ALLOWED_TYPES.includes(
        evidenceType as (typeof ALLOWED_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid evidence type" },
        { status: 400 }
      );
    }

    if (!evidenceText || evidenceText.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Evidence must contain 1 to 5000 characters",
        },
        { status: 400 }
      );
    }

    // 4. Verify claim ownership and status
    const [claims] = await pool.execute<ClaimRow[]>(
      `SELECT claim_id
       FROM claims
       WHERE claim_id = ?
         AND claimant_id = ?
         AND claim_status IN (
           'SUBMITTED',
           'AI_REVIEW_PENDING',
           'MODERATOR_REVIEW'
         )
       LIMIT 1`,
      [claimId, session.userId]
    );

    if (claims.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Claim not found or evidence submission is closed",
        },
        { status: 404 }
      );
    }

    // 5. Save evidence
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO claim_evidence (
        claim_id,
        evidence_type,
        evidence_text
      ) VALUES (?, ?, ?)`,
      [claimId, evidenceType, evidenceText]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Claim evidence submitted successfully",
        data: {
          evidenceId: result.insertId,
          claimId,
          evidenceType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Claim evidence error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to submit claim evidence" },
      { status: 500 }
    );
  }
}

