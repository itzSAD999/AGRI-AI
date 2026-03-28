import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function SignUp() {
  const { user, signUp } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/app" replace />

  const [confirmMsg, setConfirmMsg] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setConfirmMsg(null)
    setLoading(true)
    try {
      const { needsConfirmation } = await signUp(email, password, name)
      if (needsConfirmation) {
        setConfirmMsg('Check your email to confirm your account, then sign in.')
      } else {
        nav('/app', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1e3d] via-[#0a1628] to-[#101c30] lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float absolute top-[25%] right-[20%] h-52 w-52 rounded-full bg-[#e8b923]/10 blur-3xl" />
          <div className="animate-float-delayed absolute bottom-[25%] left-[15%] h-60 w-60 rounded-full bg-[#2dd4bf]/[0.07] blur-3xl" />
        </div>
        <div className="relative z-10 max-w-sm px-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8b923] to-[#d4a020] shadow-lg shadow-[#e8b923]/20">
            <span className="text-2xl font-black text-[#0a1628]">E</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-white">Start your journey</h2>
          <p className="mt-3 text-sm text-slate-400">
            Join students across Ghana preparing for BECE &amp; WASSCE with AI-powered tools — completely free.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-left">
            {['AI Tutor in English & Twi', 'Exam-style practice quizzes', 'WASSCE grade guidance', 'Group study rooms'].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-sm text-slate-300">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[#2dd4bf]">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to home
          </Link>

          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-[#2dd4bf] hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kwame Asante"
                className="input-dark mt-2"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-dark mt-2"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-dark mt-2"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            {confirmMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <p className="font-medium">{confirmMsg}</p>
                <p className="mt-2 text-emerald-300/70">
                  Check your inbox and spam folder. The email comes from Supabase (noreply@mail.app.supabase.io).
                </p>
                <Link to="/signin" className="mt-2 inline-block font-medium underline">
                  Go to sign in
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!confirmMsg}
              className="w-full rounded-xl bg-[#e8b923] py-3.5 text-sm font-bold text-[#0a1628] shadow-lg shadow-[#e8b923]/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-xs text-slate-500">
              By signing up you agree to our Terms of Service.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
