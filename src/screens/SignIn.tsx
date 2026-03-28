import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function SignIn() {
  const { user, signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/app" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      nav('/app', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Your email is not confirmed yet. Check your inbox (and spam folder) for a confirmation link from Supabase, then try again.')
      } else if (
        msg.toLowerCase().includes('invalid login credentials') ||
        msg.toLowerCase().includes('invalid email or password')
      ) {
        setError('Wrong email or password. If you do not have an account yet, sign up first.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1e3d] via-[#0a1628] to-[#101c30] lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float absolute top-[20%] left-[20%] h-48 w-48 rounded-full bg-[#2dd4bf]/10 blur-3xl" />
          <div className="animate-float-delayed absolute bottom-[20%] right-[15%] h-56 w-56 rounded-full bg-[#e8b923]/[0.08] blur-3xl" />
        </div>
        <div className="relative z-10 max-w-sm px-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8b923] to-[#d4a020] shadow-lg shadow-[#e8b923]/20">
            <span className="text-2xl font-black text-[#0a1628]">E</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-white">Welcome back</h2>
          <p className="mt-3 text-sm text-slate-400">
            Continue your study journey with AI-powered tutoring, practice, and guidance for BECE &amp; WASSCE.
          </p>
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

          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-[#2dd4bf] hover:underline">
              Sign up
            </Link>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
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
                placeholder="Your password"
                className="input-dark mt-2"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#e8b923] py-3.5 text-sm font-bold text-[#0a1628] shadow-lg shadow-[#e8b923]/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
