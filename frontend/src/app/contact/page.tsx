import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#080d18] text-white">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">CONTACT & SUPPORT</p>
        <h1 className="text-5xl font-black leading-tight sm:text-6xl">We're here to <span className="text-cyan-400">help.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Need help using LostLink? Choose the option that best describes what you need.
          You can use the platform's reporting and claim workflows to get started.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
            <div className="text-3xl">🔎</div>
            <h2 className="mt-5 text-xl font-bold">Looking for an item?</h2>
            <p className="mt-3 leading-7 text-slate-400">Browse reported items and explore potential AI-assisted matches.</p>
            <Link href="/matches" className="mt-6 inline-block font-bold text-cyan-400 hover:text-cyan-300">Explore reports →</Link>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
            <div className="text-3xl">📝</div>
            <h2 className="mt-5 text-xl font-bold">Want to report something?</h2>
            <p className="mt-3 leading-7 text-slate-400">Submit a lost or found item report with its details and location.</p>
            <Link href="/report" className="mt-6 inline-block font-bold text-cyan-400 hover:text-cyan-300">Create a report →</Link>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 sm:col-span-2">
            <div className="text-3xl">🛡️</div>
            <h2 className="mt-5 text-xl font-bold">Claim or verification assistance</h2>
            <p className="mt-3 leading-7 text-slate-400">Sign in to view your claims, submit ownership evidence and follow the status of your requests. Platform reviews are handled through the authorised moderator and administrator workflows.</p>
            <Link href="/login" className="mt-6 inline-block font-bold text-cyan-400 hover:text-cyan-300">Sign in to LostLink →</Link>
          </article>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          LostLink · PES University, RR Campus
        </p>
      </section>

      <footer className="border-t border-white/10 px-6 py-7 text-center text-sm text-slate-500">
        LostLink · Intelligent discovery. Meaningful reunions.
      </footer>
    </main>
  );
}
