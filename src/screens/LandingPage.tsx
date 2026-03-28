import { Link } from 'react-router-dom'

const features = [
  {
    title: 'AI Tutor',
    desc: 'Ask any question in English or Twi — get detailed explanations with real Ghana examples, key points, and a check question.',
    accent: 'from-[#2dd4bf]/20 to-[#2dd4bf]/5',
    border: 'border-[#2dd4bf]/20',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#2dd4bf]">
        <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 21h6M10 17v4M14 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Practice & Quiz',
    desc: 'Generate exam-style MCQs and written questions, submit answers, and get instant AI marking with explanations.',
    accent: 'from-[#e8b923]/20 to-[#e8b923]/5',
    border: 'border-[#e8b923]/20',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#e8b923]">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Academic Guidance',
    desc: 'Enter your WASSCE grades and get matched to university programmes, career paths, and cut-off points.',
    accent: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-400/20',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-violet-400">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Study Advisory',
    desc: 'Get a personalised weekly revision plan based on your subjects, strengths, and weeks until the exam.',
    accent: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-400/20',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-blue-400">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'StudyG Groups',
    desc: 'Virtual study rooms — share materials, chat, run check-ins, generate quizzes from notes, and queue spaced revision.',
    accent: 'from-pink-500/20 to-pink-500/5',
    border: 'border-pink-400/20',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-pink-400">
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 21c0-3.31 2.69-6 6-6h2c3.31 0 6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 15h1c3.31 0 6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Progress Tracking',
    desc: 'Live dashboard shows community stats, your personal history, weak spots, and study notes — all in one place.',
    accent: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-400/20',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-emerald-400">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 14l4-4 3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const steps = [
  { n: '01', title: 'Create your account', desc: 'Quick sign up — choose your exam level and subjects.' },
  { n: '02', title: 'Pick your tool', desc: 'Open the Tutor, take a quiz, check guidance, or start a StudyG group.' },
  { n: '03', title: 'Learn with AI', desc: 'Get personalised help powered by Claude — in English or Twi.' },
  { n: '04', title: 'Track & improve', desc: 'See your progress, revisit weak areas, and stay on schedule.' },
]

const stats = [
  { value: 'BECE & WASSCE', label: 'Full curriculum coverage' },
  { value: 'English + Twi', label: 'Dual language support' },
  { value: 'Claude AI', label: 'Powered by Anthropic' },
  { value: '8+ subjects', label: 'Science, arts, business & more' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/[0.06] bg-[#0a1628]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8b923] to-[#d4a020]">
              <span className="text-sm font-bold text-[#0a1628]">E</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">EduGap AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-[#e8b923] px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float absolute top-20 left-[10%] h-72 w-72 rounded-full bg-[#2dd4bf]/[0.07] blur-3xl" />
          <div className="animate-float-delayed absolute top-40 right-[12%] h-80 w-80 rounded-full bg-[#e8b923]/[0.06] blur-3xl" />
          <div className="animate-float absolute bottom-10 left-[40%] h-64 w-64 rounded-full bg-violet-500/[0.05] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-[#e8b923]/30 bg-[#e8b923]/10 px-4 py-1.5 text-xs font-semibold text-[#e8b923]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8b923] animate-pulse" />
            Built for Ghanaian students
          </div>
          <h1 className="animate-fade-in-up mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl" style={{ animationDelay: '0.1s' }}>
            Your AI study companion
            <br />
            <span className="bg-gradient-to-r from-[#2dd4bf] via-[#e8b923] to-violet-400 bg-clip-text text-transparent animate-gradient">
              for BECE &amp; WASSCE
            </span>
          </h1>
          <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg text-slate-400" style={{ animationDelay: '0.2s' }}>
            Tutor, practice quizzes, academic guidance, study plans, and group study rooms —
            all powered by AI that understands the Ghanaian curriculum.
          </p>
          <div className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/signup"
              className="group relative rounded-xl bg-[#e8b923] px-8 py-3.5 text-sm font-bold text-[#0a1628] shadow-lg shadow-[#e8b923]/20 transition hover:shadow-xl hover:shadow-[#e8b923]/30 hover:brightness-110"
            >
              Get started free
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/15 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
            >
              See features
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-6 text-center">
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2dd4bf]">Features</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Everything you need in one place
            </h2>
            <p className="mt-4 text-slate-400">
              From solo revision to group study sessions, EduGap AI covers every angle
              of your exam preparation journey.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-2xl border ${f.border} bg-gradient-to-br ${f.accent} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20`}
              >
                <div className="mb-4 inline-flex rounded-xl bg-white/[0.08] p-3">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="border-t border-white/[0.06] bg-white/[0.015] py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#e8b923]">How it works</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Start in under a minute</h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="text-4xl font-black text-white/[0.06]">{s.n}</span>
                <h3 className="mt-2 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1e3d] via-[#0a1628] to-[#101c30] p-10 md:p-16">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Ready to level up your studies?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Join students across Ghana who are preparing smarter with AI-powered tutoring,
              practice, and guidance.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="rounded-xl bg-[#e8b923] px-8 py-3.5 text-sm font-bold text-[#0a1628] shadow-lg shadow-[#e8b923]/20 transition hover:shadow-xl hover:shadow-[#e8b923]/30 hover:brightness-110"
              >
                Create free account
              </Link>
              <Link
                to="/signin"
                className="rounded-xl border border-white/15 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.06] bg-[#060f1d]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">EduGap AI</p>
            <p className="mt-1 text-xs text-slate-500">AI-powered exam preparation for Ghanaian students.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <a href="#features" className="hover:text-slate-300">Features</a>
            <Link to="/signin" className="hover:text-slate-300">Sign in</Link>
            <Link to="/signup" className="hover:text-slate-300">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
