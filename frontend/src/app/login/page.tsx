'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: '🛡️ Admin', email: 'abc1@gmail.com', desc: 'Full admin analytics & approvals' },
    { label: '🔍 Finder (Uthkarsha)', email: 'uthkarsha366@gmail.com', desc: 'Found item & OTP verification' },
    { label: '🎒 Owner (IRA)', email: 'ira.rr@pes.edu', desc: 'Lost item & receipt confirmation' },
    { label: '⚖️ Moderator', email: 'abc@gmail.com', desc: 'Report & image review' },
  ];

  function selectDemoAccount(accEmail: string) {
    setEmail(accEmail);
    setPassword('Password@123');
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Unable to log in. Check your credentials.');
        return;
      }

      // Hard redirect to homepage to synchronize session cookies and navbar state completely
      window.location.href = '/';
    } catch {
      setError('Unable to connect to LostLink. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="w-full max-w-md">
        {/* BRAND LOGO */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block group">
            <img
              src="/lostlink-logo-white.png"
              alt="LostLink"
              className="h-10 w-auto mx-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Welcome back
          </p>

          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Sign in to LostLink</h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Sign in to report, discover and recover lost belongings on campus.
          </p>

          {/* QUICK DEMO ACCOUNTS HELPER */}
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                ⚡ Quick Demo Accounts
              </span>
              <span className="text-[10px] text-cyan-400/80 font-mono">Password@123</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectDemoAccount(acc.email)}
                  className={`rounded-xl border p-2 text-left transition-all ${
                    email === acc.email
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{acc.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400 truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in to LostLink'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            New to LostLink?{' '}
            <Link href="/register" className="font-semibold text-cyan-400 hover:text-cyan-300">
              Create an account
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          PES University · RR Campus
        </p>
      </div>
    </main>
  );
}

