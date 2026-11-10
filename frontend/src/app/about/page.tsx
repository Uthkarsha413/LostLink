import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-5xl px-6 py-20">
        {/* Hero */}
        <div className="mb-16 max-w-3xl">
          <p className="mb-4 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
            🏫 PES University · RR Campus
          </p>
          <h1 className="text-5xl font-black leading-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Lost something?{" "}
            </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Let&apos;s reconnect.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            LostLink is an AI-assisted campus lost-and-found platform designed to make reporting,
            discovering and recovering misplaced belongings easier within the PES University
            community.
          </p>
        </div>

        {/* How it works cards */}
        <div className="mb-14 grid gap-5 md:grid-cols-3">
          {[
            {
              number: "01",
              emoji: "📝",
              title: "Report",
              description:
                "Students can report lost or found belongings with item details, images and location information.",
              gradient: "from-rose-500/10 to-orange-500/10",
              border: "border-rose-500/20",
              badge: "text-rose-400",
            },
            {
              number: "02",
              emoji: "🤖",
              title: "Discover",
              description:
                "AI-powered visual and semantic matching helps identify potentially related lost and found reports.",
              gradient: "from-cyan-500/10 to-blue-500/10",
              border: "border-cyan-500/20",
              badge: "text-cyan-400",
            },
            {
              number: "03",
              emoji: "🛡️",
              title: "Verify",
              description:
                "Ownership claims and evidence support a controlled verification process before belongings are returned.",
              gradient: "from-emerald-500/10 to-teal-500/10",
              border: "border-emerald-500/20",
              badge: "text-emerald-400",
            },
          ].map(({ number, emoji, title, description, gradient, border, badge }) => (
            <article
              key={number}
              className={`rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-7 backdrop-blur hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{emoji}</span>
                <span className={`text-sm font-bold ${badge} tracking-widest uppercase`}>
                  {number} / LostLink
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{description}</p>
            </article>
          ))}
        </div>

        {/* Technology section */}
        <div className="mb-14 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-8 sm:p-10 backdrop-blur">
          <p className="mb-3 text-xs font-bold tracking-[0.3em] text-cyan-400 uppercase">
            ⚙️ Technology
          </p>
          <h2 className="text-2xl font-bold text-white">Technology with trust at its core.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-400">
            LostLink combines structured database records, image-based features and semantic
            similarity to assist discovery. Matching suggestions are not proof of ownership:
            claims and evidence are reviewed through the platform&apos;s verification workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-100 transition-all"
            >
              📋 Report an item →
            </Link>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 font-bold text-white hover:border-cyan-500/50 hover:scale-[1.02] active:scale-100 transition-all"
            >
              🔍 Explore matches
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[
            { emoji: "📦", label: "Items Reported", value: "Real-time" },
            { emoji: "🤖", label: "AI Matching", value: "Semantic + Visual" },
            { emoji: "🔐", label: "OTP Handover", value: "Secure" },
            { emoji: "📊", label: "Analytics", value: "Live Dashboard" },
          ].map(({ emoji, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-center backdrop-blur"
            >
              <div className="text-2xl mb-2">{emoji}</div>
              <div className="text-white font-bold text-sm">{value}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-slate-800 px-6 py-7 text-center text-sm text-slate-600">
        LostLink · Intelligent discovery. Meaningful reunions. · PES University, RR Campus
      </footer>
    </main>
  );
}
