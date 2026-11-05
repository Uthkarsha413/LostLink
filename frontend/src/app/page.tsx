
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

      {/* NAVBAR */}
      <header className="ll-nav">
        <div className="ll-nav-inner">

          <Link href="/" className="ll-brand">
            <span className="ll-logo">L</span>
            <span>
              lostlink<span className="ll-dot">.</span>
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="ll-desktop-nav">
            <Link href="/">Home</Link>
            <Link href="/matches">Lost & Found</Link>
            <Link href="/matches">AI Search</Link>
            <Link href="/report">Report Item</Link>

            {user && (
              <>
                <Link href="/my-reports">My Reports</Link>
                <Link href="/claims">My Claims</Link>
                <Link href="/notifications">Notifications</Link>
              </>
            )}

            {user?.roles?.includes("MODERATOR") && (
              <Link href="/moderator">Moderator</Link>
            )}

            {user?.roles?.includes("ADMIN") && (
              <Link href="/admin">Admin</Link>
            )}

            <a href="#how">How it works</a>
          </nav>

          <div className="ll-nav-actions">

            <button
              onClick={toggleTheme}
              className="ll-theme-button"
              aria-label="Toggle light and dark theme"
              title="Toggle theme"
            >
              <Icon name={dark ? "sun" : "moon"} size={18} />
            </button>

            {authLoading ? (
              <span className="ll-login">Loading...</span>
            ) : user ? (
              <>
                <span className="ll-login">
                  Welcome, {user.fullName.split(" ")[0]}
                </span>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="ll-nav-cta"
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="ll-login">
                  Log in
                </Link>

                <Link href="/register" className="ll-nav-cta">
                  Get started <Icon name="arrow" size={15} />
                </Link>
              </>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="ll-mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        {menuOpen && (
          <div className="ll-mobile-links">

            <Link href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>

            <Link href="/matches" onClick={() => setMenuOpen(false)}>
              Lost & Found Feed
            </Link>

            <Link href="/matches" onClick={() => setMenuOpen(false)}>
              AI Search
            </Link>

            <Link href="/report" onClick={() => setMenuOpen(false)}>
              Report an Item
            </Link>

            {user && (
              <>
                <Link href="/my-reports" onClick={() => setMenuOpen(false)}>
                  My Reports
                </Link>

                <Link href="/claims" onClick={() => setMenuOpen(false)}>
                  My Claims
                </Link>

                <Link href="/notifications" onClick={() => setMenuOpen(false)}>
                  Notifications
                </Link>
              </>
            )}

            {user?.roles?.includes("MODERATOR") && (
              <Link href="/moderator" onClick={() => setMenuOpen(false)}>
                Moderator Dashboard
              </Link>
            )}

            {user?.roles?.includes("ADMIN") && (
              <Link href="/admin" onClick={() => setMenuOpen(false)}>
                Admin Dashboard
              </Link>
            )}

            <a href="#how" onClick={() => setMenuOpen(false)}>
              How it works
            </a>

            <a href="#technology" onClick={() => setMenuOpen(false)}>
              Technology
            </a>

            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>

            {authLoading ? null : user ? (
              <>
                <span>Welcome, {user.fullName}</span>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>

                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        )}
      </header>

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
        <Link href="/" className="ll-brand">
          <span className="ll-logo">L</span>
          <span>
            lostlink<span className="ll-dot">.</span>
          </span>
        </Link>

        <p>Intelligent discovery. Meaningful reunions.</p>

        <span>© 2026 LostLink</span>
      </footer>
    </main>
  );
}
