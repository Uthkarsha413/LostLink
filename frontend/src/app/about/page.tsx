import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#080d18] text-white">
      <header className="border-b border-white/10 bg-[#080d18]/90 px-6 py-5">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight">LostLink<span className="text-cyan-400">.</span></Link>
          <div className="flex items-center gap-5 text-sm text-slate-300">
            <Link href="/" className="hover:text-cyan-400">Home</Link>
            <Link href="/matches" className="hover:text-cyan-400">Explore</Link>
            <Link href="/contact" className="hover:text-cyan-400">Contact</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">ABOUT LOSTLINK</p>
        <h1 className="max-w-3xl text-5xl font-black leading-tight sm:text-6xl">
          Lost something? <span className="text-cyan-400">Let's reconnect.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
          LostLink is an AI-assisted campus lost-and-found platform designed to make reporting,
          discovering and recovering misplaced belongings easier within the PES University
          community.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            ["01", "Report", "Students can report lost or found belongings with item details, images and location information."],
            ["02", "Discover", "AI-powered visual and semantic matching helps identify potentially related lost and found reports."],
            ["03", "Verify", "Ownership claims and evidence support a controlled verification process before belongings are returned."]
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <span className="text-sm font-bold text-cyan-400">{number} / LOSTLINK</span>
              <h2 className="mt-5 text-2xl font-bold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Technology with trust at its core.</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-400">
            LostLink combines structured database records, image-based features and semantic
            similarity to assist discovery. Matching suggestions are not proof of ownership:
            claims and evidence are reviewed through the platform's verification workflow.
          </p>
          <Link href="/report" className="mt-7 inline-flex rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300">
            Report an item →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-7 text-center text-sm text-slate-500">
        LostLink · Intelligent discovery. Meaningful reunions. · PES University
      </footer>
    </main>
  );
}
