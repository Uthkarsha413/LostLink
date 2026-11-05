
import { NextResponse } from "next/server";
import { connection } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  await connection();

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
         u.user_id,
         u.full_name,
         u.email,
         u.university_id,
         u.account_status,
         GROUP_CONCAT(r.role_name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.role_id
       WHERE u.user_id = ?
       GROUP BY u.user_id
       LIMIT 1`,
      [session.userId]
    );

    const users = rows as {
      user_id: string | number | bigint;
      full_name: string;
      email: string;
      university_id: string;
      account_status: string;
      roles: string | null;
    }[];

    if (users.length === 0 || users[0].account_status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Account is unavailable" },
        { status: 401 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      success: true,
      message: "Session verified",
      data: {
        userId: String(user.user_id),
        fullName: user.full_name,
        email: user.email,
        universityId: user.university_id,
        roles: user.roles ? user.roles.split(",") : [],
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);

    return NextResponse.json(
      { success: false, message: "Session verification failed" },
      { status: 500 }
    );
  }
}
