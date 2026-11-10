
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    arrow: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14m-7-7h14" />,
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const router = useRouter();

  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [user, setUser] = useState<{
    fullName: string;
    email: string;
    roles: string[];
  } | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lostlink-theme");

    const initial = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    document.documentElement.classList.toggle("dark", initial);

    const frame = requestAnimationFrame(() => {
      setDark(initial);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setUser(result.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkSession();
  }, []);

  function toggleTheme() {
    const next = !dark;

    setDark(next);
    document.documentElement.classList.toggle("dark", next);

    localStorage.setItem(
      "lostlink-theme",
      next ? "dark" : "light"
    );
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Logout failed");
      }

      setUser(null);
      setMenuOpen(false);
      router.refresh();
    } catch {
      alert("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="ll-page min-h-screen overflow-hidden">

      {/* HERO */}
      <section className="ll-hero">
        <div className="ll-orb ll-orb-one" />
        <div className="ll-orb ll-orb-two" />
        <div className="ll-grid-bg" />

        <div className="ll-hero-inner">
          <div className="ll-hero-copy">

            <div className="ll-eyebrow animate-in">
              <span className="ll-live-dot" />
              INTELLIGENT CAMPUS LOST & FOUND
              <span className="ll-eyebrow-separator">✦</span>
              PES UNIVERSITY
            </div>

            <h1 className="ll-heading animate-in delay-1">
              Lost something?
              <br />
              <span className="ll-gradient-text">
                Let AI find it.
              </span>
            </h1>

            <p className="ll-subheading animate-in delay-2">
              Not another lost & found board. An intelligent way to
              reconnect people with their belongings through visual
              search, semantic matching and secure verification.
            </p>

            <div className="ll-hero-actions animate-in delay-3">
              <Link href="/report" className="ll-primary-button">
                <Icon name="plus" size={18} />
                I lost something
                <Icon name="arrow" size={16} />
              </Link>

              <Link href="/report" className="ll-secondary-button">
                I found something
              </Link>
            </div>

            <div className="ll-trust-line animate-in delay-4">
              <span>
                <Icon name="shield" size={15} />
                Privacy-first verification
              </span>

              <span className="ll-trust-divider" />

              <span>
                <Icon name="sparkles" size={15} />
                AI-assisted discovery
              </span>
            </div>
          </div>

          {/* AI MATCH VISUAL */}
          <div className="ll-visual animate-in delay-2">
            <div className="ll-visual-glow" />

            <div className="ll-floating-chip ll-chip-top">
              <span className="ll-chip-icon">✦</span>
              Visual similarity detected
            </div>

            <div className="ll-match-window">
              <div className="ll-window-header">
                <div className="ll-window-title">
                  <span className="ll-window-icon">
                    <Icon name="sparkles" size={17} />
                  </span>

                  <div>
                    <strong>Match intelligence</strong>
                    <small>AI discovery preview</small>
                  </div>
                </div>

                <span className="ll-window-status">
                  <span className="ll-live-dot" /> DEMO
                </span>
              </div>

              <div className="ll-match-content">
                <div className="ll-item-card">
                  <div className="ll-item-art ll-art-blue">
                    <span>🎒</span>
                    <span className="ll-art-label">LOST REPORT</span>
                  </div>

                  <strong>Blue backpack</strong>
                  <small>Library · Example</small>
                </div>

                <div className="ll-match-center">
                  <div className="ll-match-line" />
                  <div className="ll-match-spark">
                    <Icon name="sparkles" size={19} />
                  </div>
                  <div className="ll-match-line" />
                </div>

                <div className="ll-item-card">
                  <div className="ll-item-art ll-art-violet">
                    <span>🎒</span>
                    <span className="ll-art-label">FOUND REPORT</span>
                  </div>

                  <strong>Blue bag</strong>
                  <small>Academic block · Example</small>
                </div>
              </div>

              <div className="ll-analysis">
                <div className="ll-analysis-heading">
                  <span>AI analysis</span>
                  <span className="ll-analysis-tag">ILLUSTRATIVE</span>
                </div>

                <div className="ll-analysis-row">
                  <span>Visual features</span>
                  <span className="ll-analysis-check">✓</span>
                </div>

                <div className="ll-analysis-row">
                  <span>Text attributes</span>
                  <span className="ll-analysis-check">✓</span>
                </div>

                <div className="ll-analysis-row">
                  <span>Ownership verification</span>
                  <span className="ll-analysis-pending">Pending</span>
                </div>
              </div>

              <div className="ll-window-footer">
                <span className="ll-live-dot" />
                Potential match discovered
                <span className="ll-footer-arrow">↗</span>
              </div>
            </div>

            <div className="ll-floating-chip ll-chip-bottom">
              <span className="ll-chip-check">✓</span>
              Human-reviewed ownership
            </div>
          </div>
        </div>

        <div className="ll-scroll-cue">
          <span /> SCROLL TO EXPLORE
        </div>
      </section>

      {/* QUICK SEARCH */}
      <section className="ll-search-section">
        <div className="ll-search-inner">
          <div>
            <span className="ll-section-kicker">
              FIND WHAT YOU NEED
            </span>

            <h2>Looking for something?</h2>
            <p>Search through reported items on campus.</p>
          </div>

          <form action="/matches" method="GET" className="ll-search-box">
            <Icon name="search" size={21} />

            <input
              type="search"
              name="q"
              placeholder="Try 'black wallet' or 'water bottle'..."
              aria-label="Search reported items"
            />

            <button type="submit">
              Search <Icon name="arrow" size={15} />
            </button>
          </form>
        </div>
      </section>

      {/* FEATURED CAPABILITIES CARDS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            ✦ ADVANCED CAMPUS ECOSYSTEM
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Smart Features Built for <span className="vibe-gradient-text-cyan">PES University</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Explore live item tracking, cryptographic handovers, and executive analytics in real time.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Feature 1: Analytics */}
          <Link
            href="/admin/analytics"
            className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300 text-2xl">
              📊
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              Smart Analytics Dashboard
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Real-time campus KPIs, monthly report trends, recovery gauges, and top location frequency maps with interactive date filters.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span>View Analytics</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          {/* Feature 2: Timeline */}
          <Link
            href="/my-reports"
            className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-300 text-2xl">
              📍
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
              9-Stage Item Timeline
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Trace reports from initial submission through AI match, review, OTP generation, and dual confirmations with complete actor audit logs.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <span>Track Reports</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          {/* Feature 3: OTP Handover */}
          <Link
            href="/claims"
            className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300 text-2xl">
              🔐
            </div>
            <h3 className="mt-4 text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              Secure OTP Handover
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Cryptographically hashed 6-digit OTP verification, 10-minute expiry, rate-limited attempts, and dual physical confirmations.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span>Review Claims</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="ll-section">
        <div className="ll-section-heading">
          <span className="ll-section-kicker">
            THREE SIMPLE STEPS
          </span>

          <h2>
            From lost to <span className="ll-gradient-text">found.</span>
          </h2>

          <p>
            A smarter process, designed around people and powered by AI.
          </p>
        </div>

        <div className="ll-steps">
          <article className="ll-step-card">
            <div className="ll-step-top">
              <span className="ll-step-icon">↗</span>
              <span>01 / REPORT</span>
            </div>

            <h3>Tell us what happened.</h3>
            <p>
              Upload a photo, add item details and share where you lost
              or found it.
            </p>
          </article>

          <article className="ll-step-card ll-step-highlight">
            <div className="ll-step-top">
              <span className="ll-step-icon">✳</span>
              <span>02 / DISCOVER</span>
            </div>

            <h3>Let intelligence connect.</h3>
            <p>
              Visual embeddings and semantic search help identify
              potential matches.
            </p>
          </article>

          <article className="ll-step-card">
            <div className="ll-step-top">
              <span className="ll-step-icon">⌁</span>
              <span>03 / VERIFY</span>
            </div>

            <h3>Reconnect with confidence.</h3>
            <p>
              Submit private ownership evidence for review before an
              item is returned.
            </p>
          </article>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section id="technology" className="ll-tech-section">
        <div className="ll-tech-inner">
          <div className="ll-tech-copy">
            <span className="ll-section-kicker">
              BEYOND KEYWORD SEARCH
            </span>

            <h2>Built to understand more than words.</h2>

            <p>
              LostLink combines computer vision, semantic understanding
              and structured item attributes to discover connections
              that traditional search can miss.
            </p>
          </div>

          <div className="ll-tech-list">
            <div className="ll-tech-row">
              <span className="ll-tech-number">01</span>

              <div>
                <strong>Visual intelligence</strong>
                <p>
                  Understand appearance, colour, shape and distinctive
                  marks.
                </p>
              </div>

              <span className="ll-tech-symbol">◈</span>
            </div>

            <div className="ll-tech-row">
              <span className="ll-tech-number">02</span>

              <div>
                <strong>Semantic discovery</strong>
                <p>
                  Compare meaning and context, not just exact keywords.
                </p>
              </div>

              <span className="ll-tech-symbol">⌘</span>
            </div>

            <div className="ll-tech-row">
              <span className="ll-tech-number">03</span>

              <div>
                <strong>Trust-first verification</strong>
                <p>
                  AI assists the process; authorised admins make final
                  decisions.
                </p>
              </div>

              <span className="ll-tech-symbol">◇</span>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="about" className="ll-final-section">
        <div className="ll-final-card">
          <div className="ll-final-glow" />

          <span className="ll-section-kicker">
            YOUR CAMPUS. ONE COMMUNITY.
          </span>

          <h2>
            Let&apos;s bring lost things <span>back home.</span>
          </h2>

          <p>
            One report could be the connection someone is waiting for.
          </p>

          {user ? (
            <Link href="/report" className="ll-primary-button">
              Report an item <Icon name="arrow" size={17} />
            </Link>
          ) : (
            <Link href="/register" className="ll-primary-button">
              Get started <Icon name="arrow" size={17} />
            </Link>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ll-footer">
        <Link href="/" className="flex items-center group">
          <img
            src="/lostlink-logo-white.png"
            alt="LostLink Logo"
            className="h-8 w-auto hidden dark:block transition-transform duration-200 group-hover:scale-105"
          />
          <img
            src="/lostlink-logo.png"
            alt="LostLink Logo"
            className="h-8 w-auto block dark:hidden transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        <p>Intelligent discovery. Meaningful reunions.</p>

        <div className="flex flex-wrap items-center gap-5 text-sm"><Link href="/about">About</Link><Link href="/contact">Contact Us</Link><span>© 2026 LostLink</span></div>
      </footer>
    </main>
  );
}
