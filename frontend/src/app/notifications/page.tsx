
"use client";

import { useCallback, useEffect, useState } from "react";

interface Notification {
  notification_id: number;
  notification_type: string;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: number | null;
  is_read: number;
  created_at: string;
}

interface NotificationResponse {
  success: boolean;
  data?: Notification[];
  unreadCount?: number;
  message?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<number | string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const result: NotificationResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load notifications");
      }

      setNotifications(result.data ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(notificationId: number) {
    setUpdating(notificationId);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update notification");
      }

      await fetchNotifications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update notification"
      );
    } finally {
      setUpdating(null);
    }
  }

  async function markAllAsRead() {
    setUpdating("all");

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update notifications");
      }

      await fetchNotifications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update notifications"
      );
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "CLAIM_SUBMITTED":
        return "📩";
      case "CLAIM_ESCALATED":
        return "⚖️";
      case "CLAIM_APPROVED":
        return "✅";
      case "CLAIM_REJECTED":
        return "❌";
      case "CLAIM_HANDED_OVER":
        return "🎉";
      default:
        return "🔔";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.25em] text-cyan-400">
              LOSTLINK
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Notification Center
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Stay updated on claims, reviews and item handovers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
              <p className="text-xs text-slate-400">Unread</p>
              <p className="text-2xl font-bold text-cyan-400">
                {unreadCount}
              </p>
            </div>

            <button
              onClick={fetchNotifications}
              className="rounded-lg border border-slate-700 px-4 py-3 text-sm hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={markAllAsRead}
              disabled={updating !== null}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              {updating === "all" ? "Updating..." : "Mark all as read"}
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mb-4 text-5xl">🔔</div>
            <h2 className="text-xl font-semibold">No notifications yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              Updates about your LostLink activity will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.notification_id}
                className={`rounded-2xl border p-5 transition ${
                  notification.is_read
                    ? "border-slate-800 bg-slate-900"
                    : "border-cyan-500/40 bg-cyan-950/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">
                        {notification.title}
                      </h2>

                      {!notification.is_read && (
                        <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-xs font-semibold text-cyan-300">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        {formatDate(notification.created_at)}
                        {notification.reference_id && (
                          <span className="ml-3">
                            {notification.reference_type} #
                            {notification.reference_id}
                          </span>
                        )}
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={() =>
                            markAsRead(notification.notification_id)
                          }
                          disabled={updating !== null}
                          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                        >
                          {updating === notification.notification_id
                            ? "Updating..."
                            : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          LOSTLINK • CAMPUS LOST & FOUND MANAGEMENT SYSTEM
        </div>
      </div>
    </main>
  );
}

