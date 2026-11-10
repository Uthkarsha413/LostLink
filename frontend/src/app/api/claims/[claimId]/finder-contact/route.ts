import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type FinderContactRow = RowDataPacket & {
  claim_status: string;
  finder_name: string;
  finder_phone: string | null;
  finder_email: string;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ claimId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  const { claimId: claimIdParam } = await context.params;
  const claimId = Number(claimIdParam);

  if (!Number.isSafeInteger(claimId) || claimId <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid claim ID." },
      { status: 400 }
    );
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute<FinderContactRow[]>(
      `SELECT
         c.claim_status,
         finder.full_name AS finder_name,
         finder.phone_number AS finder_phone,
         finder.email AS finder_email
       FROM claims c
       INNER JOIN item_reports found
         ON found.report_id = c.found_report_id
       INNER JOIN users finder
         ON finder.user_id = found.user_id
       WHERE c.claim_id = ?
         AND c.claimant_id = ?
         AND c.claim_status IN ('APPROVED', 'HANDED_OVER')
         AND found.report_type = 'FOUND'
         AND found.finder_contact_consent = 1
         AND finder.account_status = 'ACTIVE'
       LIMIT 1`,
      [claimId, session.userId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          error: "Finder contact is unavailable for this claim.",
        },
        { status: 404 }
      );
    }

    const finder = rows[0];

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
        "FINDER_CONTACT_VIEWED",
        "CLAIM",
        claimId,
        null,
        JSON.stringify({
          claim_status: finder.claim_status,
          contact_shared: true,
        }),
      ]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      data: {
        finderName: finder.finder_name,
        phoneNumber: finder.finder_phone,
        email: finder.finder_email,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("Finder contact retrieval failed:", error);

    return NextResponse.json(
      { success: false, error: "Unable to retrieve finder contact." },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
