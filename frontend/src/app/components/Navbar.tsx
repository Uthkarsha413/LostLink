"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface UserProfile {
  userId: number | string;
  fullName: string;
  email: string;
  roles: string[];
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Sync dark mode state
  useEffect(() => {
    const saved = localStorage.getItem("lostlink-theme");
    const initial = saved ? saved === "dark" : true;
    document.documentElement.classList.toggle("dark", initial);
    setIsDark(initial);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("lostlink-theme", nextDark ? "dark" : "light");
  };

  // Fetch current user session
  useEffect(() => {
    async function fetchMe() {
      try {
        setAuthLoading(true);
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        const userData = json.data || json.user;
        if (res.ok && json.success && userData) {
          const rolesArray =
            typeof userData.roles === "string"
              ? userData.roles.split(",")
              : Array.isArray(userData.roles)
              ? userData.roles
              : [];
          setUser({
            userId: userData.userId || userData.user_id,
            fullName: userData.fullName || userData.full_name || "User",
            email: userData.email,
            roles: rolesArray,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    fetchMe();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } catch {
      alert("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  const isAdmin = user?.roles.includes("ADMIN");
  const isModerator = user?.roles.includes("MODERATOR");

  const navLinks = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/matches", label: "Lost & Found Feed", icon: "🔍" },
    { href: "/report", label: "Report Item", icon: "➕" },
    ...(user
      ? [
          { href: "/my-reports", label: "My Reports", icon: "📋" },
          { href: "/claims", label: "Claims & Handover", icon: "🔐" },
        ]
      : []),
    ...(isAdmin
      ? [
          { href: "/admin/analytics", label: "Analytics", icon: "📊", highlight: true },
          { href: "/admin", label: "Admin Queue", icon: "🛡️" },
        ]
      : isModerator
      ? [{ href: "/moderator", label: "Moderation", icon: "🛡️" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* LOGO BRANDING */}
        <Link href="/" className="flex items-center gap-3 group relative">
          <div className="relative flex items-center">
            {/* Ambient Logo Hover Glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-indigo-500/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <img
              src="/lostlink-logo-white.png"
              alt="LostLink"
              className="relative h-8 sm:h-9 w-auto max-w-[160px] object-contain transition-transform duration-300 group-hover:scale-105 hidden dark:block drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]"
            />
            <img
              src="/lostlink-logo.png"
              alt="LostLink"
              className="relative h-8 sm:h-9 w-auto max-w-[160px] object-contain transition-transform duration-300 group-hover:scale-105 block dark:hidden"
            />
          </div>
        </Link>

        {/* MODERN PILL NAVIGATION TABS */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-2xl bg-slate-900/70 p-1.5 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
          {navLinks.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/20 font-bold"
                    : tab.highlight
                    ? "text-cyan-400 hover:text-cyan-200 hover:bg-slate-800/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="text-sm transition-transform duration-300 group-hover:scale-125">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>

                {/* Subtle active underline glow */}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}

                {/* Highlight Indicator Badge */}
                {tab.highlight && !isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {/* Quick Action Button: Report Item */}
          <Link
            href="/report"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40 active:scale-95 border border-cyan-400/30"
          >
            <span className="text-sm">➕</span>
            <span>Report Item</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition-all hover:border-slate-700 hover:text-white hover:scale-105 active:scale-95 shadow-sm"
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* User Auth Profile / Buttons */}
          {authLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-800/80 border border-slate-700/50"></div>
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200 max-w-[130px] truncate">
                  {user.fullName}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {isAdmin ? "Admin" : isModerator ? "Moderator" : "Student"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200"
              >
                {loggingOut ? "..." : "Log out"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all shadow-sm"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 lg:hidden text-slate-300 hover:text-white"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 p-4 backdrop-blur-2xl transition-all">
          <div className="grid gap-1.5">
            {navLinks.map((tab) => {
              const isActive =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl p-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}

            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-3 text-sm font-bold text-white shadow-md shadow-cyan-500/25"
            >
              <span>➕</span>
              <span>Report Lost or Found Item</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
