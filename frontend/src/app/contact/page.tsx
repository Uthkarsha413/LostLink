import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-4xl px-6 py-20">
        {/* Hero */}
        <div className="mb-14">
          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
            💬 LostLink · Support
          </p>
          <h1 className="text-5xl font-black leading-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              We&apos;re here to{" "}
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              help.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Need help using LostLink? Choose the option that best describes what you need.
            You can use the platform&apos;s reporting and claim workflows to get started.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid gap-5 sm:grid-cols-2 mb-10">
          <article className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-orange-500/5 p-7 hover:scale-[1.02] transition-transform backdrop-blur">
            <div className="text-3xl mb-5">🔎</div>
            <h2 className="text-xl font-bold text-white">Looking for an item?</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Browse reported items and explore potential AI-assisted matches to find your belongings.
            </p>
            <Link
              href="/matches"
              className="mt-6 inline-flex items-center gap-2 font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Explore reports →
            </Link>
          </article>

          <article className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-7 hover:scale-[1.02] transition-transform backdrop-blur">
            <div className="text-3xl mb-5">📝</div>
            <h2 className="text-xl font-bold text-white">Want to report something?</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Submit a lost or found item report with its details and campus location.
            </p>
            <Link
              href="/report"
              className="mt-6 inline-flex items-center gap-2 font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Create a report →
            </Link>
          </article>

          <article className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-7 sm:col-span-2 hover:scale-[1.02] transition-transform backdrop-blur">
            <div className="text-3xl mb-5">🛡️</div>
            <h2 className="text-xl font-bold text-white">Claim or verification assistance</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Sign in to view your claims, submit ownership evidence and follow the status of your
              requests. Platform reviews are handled through the authorised moderator and
              administrator workflows.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Sign in to LostLink →
            </Link>
          </article>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            🔗 Quick Navigation
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/", label: "🏠 Home" },
              { href: "/report", label: "📋 Report Item" },
              { href: "/matches", label: "🤖 AI Matches" },
              { href: "/my-reports", label: "📂 My Reports" },
              { href: "/claims", label: "🔐 My Claims" },
              { href: "/login", label: "🔑 Sign In" },
              { href: "/register", label: "✨ Register" },
              { href: "/about", label: "ℹ️ About" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 hover:border-cyan-500/50 hover:text-white hover:bg-slate-800 transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-600 text-center">
          LostLink · PES University, RR Campus · Smart Lost &amp; Found Management
        </p>
      </section>

      <footer className="relative border-t border-slate-800 px-6 py-7 text-center text-sm text-slate-600">
        LostLink · Intelligent discovery. Meaningful reunions.
      </footer>
    </main>
  );
}
