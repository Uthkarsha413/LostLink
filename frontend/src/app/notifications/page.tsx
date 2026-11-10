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

function getNotificationIcon(type: string) {
  switch (type) {
    case "CLAIM_SUBMITTED": return "📩";
    case "CLAIM_ESCALATED": return "⚖️";
    case "CLAIM_APPROVED": return "✅";
    case "CLAIM_REJECTED": return "❌";
    case "CLAIM_HANDED_OVER": return "🎉";
    default: return "🔔";
  }
}

function getNotificationAccent(type: string) {
  switch (type) {
    case "CLAIM_APPROVED": return "border-emerald-500/40 bg-emerald-950/20";
    case "CLAIM_REJECTED": return "border-red-500/40 bg-red-950/20";
    case "CLAIM_HANDED_OVER": return "border-cyan-500/40 bg-cyan-950/20";
    case "CLAIM_ESCALATED": return "border-amber-500/40 bg-amber-950/20";
    default: return "border-slate-700 bg-slate-900/80";
  }
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
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const result: NotificationResponse = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load notifications");
      }
      setNotifications(result.data ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  async function markAsRead(notificationId: number) {
    setUpdating(notificationId);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update notification");
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update notification");
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
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update notifications");
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update notifications");
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
              🔔 LostLink · Notifications
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                Notification Center
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Stay updated on claims, reviews, and item handovers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <div className="relative rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-5 py-3 text-center">
                <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-xs font-semibold text-cyan-400">Unread</p>
                <p className="text-3xl font-black text-cyan-300 mt-0.5">{unreadCount}</p>
              </div>
            )}
            <button
              onClick={fetchNotifications}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Mark all read button */}
        {unreadCount > 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={markAllAsRead}
              disabled={updating !== null}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
            >
              {updating === "all" ? "Updating..." : "✓ Mark all as read"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-16 text-center text-slate-400">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="mt-4 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-16 text-center backdrop-blur">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-bold">No Notifications Yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              Updates about your LostLink activity will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.notification_id}
                className={`rounded-2xl border p-5 backdrop-blur transition-all hover:border-opacity-70 ${
                  notification.is_read
                    ? "border-slate-800 bg-slate-900/60"
                    : getNotificationAccent(notification.notification_type)
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                    notification.is_read ? "bg-slate-800" : "bg-slate-800/80"
                  }`}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-white">{notification.title}</h2>
                      {!notification.is_read && (
                        <span className="rounded-full bg-cyan-400/20 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-300 animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-300">{notification.message}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>🕐 {formatDate(notification.created_at)}</span>
                        {notification.reference_id && (
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-400">
                            {notification.reference_type} #{notification.reference_id}
                          </span>
                        )}
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.notification_id)}
                          disabled={updating !== null}
                          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors"
                        >
                          {updating === notification.notification_id ? "Updating..." : "Mark as read →"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-slate-700">
          LOSTLINK · CAMPUS LOST &amp; FOUND MANAGEMENT SYSTEM
        </footer>
      </div>
    </main>
  );
}
