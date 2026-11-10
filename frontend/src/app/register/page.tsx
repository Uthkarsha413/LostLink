'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', universityId: '', phone: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (form.password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phoneNumber: form.phone || null }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) { setError(result.message || 'Registration failed.'); return; }
      router.push('/login?registered=true');
    } catch {
      setError('Unable to connect to LostLink. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { id: 'fullName', label: '👤 Full Name', type: 'text', placeholder: 'Enter your full name', autoComplete: 'name', required: true },
    { id: 'email', label: '📧 Email Address', type: 'email', placeholder: 'Enter your university email', autoComplete: 'email', required: true },
    { id: 'universityId', label: '🎓 University ID / SRN', type: 'text', placeholder: 'e.g. PES1UG22CS123', autoComplete: 'off', required: true },
    { id: 'phone', label: '📱 Phone Number', type: 'tel', placeholder: 'Optional', autoComplete: 'tel', required: false },
  ];

  const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 transition-all';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white relative overflow-hidden">
      {/* Animated orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/6 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block group">
            <img
              src="/lostlink-logo-white.png"
              alt="LostLink"
              className="h-12 w-auto mx-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            />
          </Link>
        </div>

        {/* Card */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <p className="mb-2 text-xs font-bold tracking-[0.25em] text-cyan-400 uppercase">
            🎓 Join LostLink
          </p>
          <h1 className="text-3xl font-black tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Register with your university details to use the campus lost and found platform.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {fields.map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="mb-2 block text-sm font-semibold text-slate-300">
                  {f.label}
                  {!f.required && <span className="ml-1 text-xs text-slate-500 font-normal">(optional)</span>}
                </label>
                <input
                  id={f.id}
                  type={f.type}
                  required={f.required}
                  autoComplete={f.autoComplete}
                  value={form[f.id as keyof typeof form]}
                  onChange={(e) => updateField(f.id as keyof typeof form, e.target.value)}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              </div>
            ))}

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-300">
                🔒 Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={inputClass + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-300">
                🔒 Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={inputClass}
              />
            </div>

            {/* Password match indicator */}
            {confirmPassword.length > 0 && (
              <div className={`flex items-center gap-2 text-xs font-semibold ${form.password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                <span>{form.password === confirmPassword ? '✓' : '✕'}</span>
                {form.password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 hover:scale-[1.02] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                '🚀 Create Account'
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign in →
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-slate-700">
          🎓 PES University · RR Campus · Smart Lost &amp; Found
        </p>
      </div>
    </main>
  );
}
