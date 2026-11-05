
import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

interface NotificationRow extends RowDataPacket {
  notification_id: number;
  notification_type: string;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: number | null;
  is_read: number;
  created_at: Date;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const [notifications] = await pool.execute<NotificationRow[]>(
      `SELECT
         notification_id,
         notification_type,
         title,
         message,
         reference_type,
         reference_id,
         is_read,
         created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.userId]
    );

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: Number(countRows[0]?.unread_count ?? 0),
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Mark all notifications as read.
    if (body.markAllRead === true) {
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE notifications
         SET is_read = 1
         WHERE user_id = ? AND is_read = 0`,
        [session.userId]
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
        updatedCount: result.affectedRows,
      });
    }

    // Mark one notification as read.
    const notificationId = Number(body.notificationId);

    if (
      !Number.isSafeInteger(notificationId) ||
      notificationId <= 0
    ) {
      return NextResponse.json(
        { success: false, message: "Valid notification ID required" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE notifications
       SET is_read = 1
       WHERE notification_id = ?
         AND user_id = ?
         AND is_read = 0`,
      [notificationId, session.userId]
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        `SELECT notification_id
         FROM notifications
         WHERE notification_id = ? AND user_id = ?`,
        [notificationId, session.userId]
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, message: "Notification not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Update notification error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update notification" },
      { status: 500 }
    );
  }
}
