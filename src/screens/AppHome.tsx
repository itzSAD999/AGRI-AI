import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGroupStudy } from '../context/GroupStudyContext'
import { useLang } from '../context/LanguageContext'

const quickActions = [
  {
    to: '/app/tutor',
    title: 'Start tutoring',
    desc: 'Ask a question in English or Twi',
    gradient: 'from-[#2dd4bf]/20 to-[#2dd4bf]/5',
    border: 'border-[#2dd4bf]/20 hover:border-[#2dd4bf]/40',
    iconColor: 'text-[#2dd4bf]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/app/practice',
    title: 'Take a quiz',
    desc: 'Exam-style questions with AI marking',
    gradient: 'from-[#e8b923]/20 to-[#e8b923]/5',
    border: 'border-[#e8b923]/20 hover:border-[#e8b923]/40',
    iconColor: 'text-[#e8b923]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/app/guidance',
    title: 'Check guidance',
    desc: 'WASSCE grades to programme matches',
    gradient: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-400/20 hover:border-violet-400/40',
    iconColor: 'text-violet-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/app/studyg/sessions/new',
    title: 'Start a group',
    desc: 'Create a StudyG session with friends',
    gradient: 'from-pink-500/20 to-pink-500/5',
    border: 'border-pink-400/20 hover:border-pink-400/40',
    iconColor: 'text-pink-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 21c0-3.31 2.69-6 6-6h2c3.31 0 6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

const tools = [
  { to: '/app/advisory', title: 'Study Plan', desc: 'Weekly revision schedule', accent: 'text-blue-400' },
  { to: '/app/dashboard', title: 'Dashboard', desc: 'Community usage stats', accent: 'text-emerald-400' },
  { to: '/app/mystudy', title: 'My Study', desc: 'History, notes, weak spots', accent: 'text-amber-400' },
  { to: '/app/studyg', title: 'StudyG Hub', desc: 'All group study features', accent: 'text-pink-400' },
]

export function AppHome() {
  const { user } = useAuth()
  const { sessions } = useGroupStudy()
  const { t } = useLang()
  const firstName = (user?.name ?? 'Student').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')

  return (
    <div className="animate-fade-in space-y-8">
      {/* Greeting */}
      <section>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-slate-400">{t('What would you like to work on today?')}</p>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className={`group glass-card-hover bg-gradient-to-br ${a.gradient} ${a.border} p-5 transition-all duration-300`}
          >
            <div className={`mb-3 inline-flex rounded-xl bg-white/[0.08] p-2.5 ${a.iconColor}`}>
              {a.icon}
            </div>
            <h3 className="font-semibold text-white">{t(a.title)}</h3>
            <p className="mt-1 text-sm text-slate-400">{a.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition group-hover:text-white">
              {t('Open')}
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 transition-transform group-hover:translate-x-0.5">
                <path fillRule="evenodd" d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
          </Link>
        ))}
      </section>

      {/* Active sessions */}
      {sessions.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Active study sessions</h2>
            <Link to="/app/studyg/sessions" className="text-xs font-medium text-[#2dd4bf] hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                to={`/app/studyg/sessions/${s.id}`}
                className="glass-card-hover p-4"
              >
                <p className="text-xs font-mono text-[#2dd4bf]">{s.inviteCode}</p>
                <h3 className="mt-1 font-medium text-white">{s.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {s.course} &middot; {s.level} &middot; {s.materials.length} material{s.materials.length !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* More tools */}
      <section>
        <h2 className="mb-4 font-semibold text-white">{t('More tools')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="glass-card-hover p-4 transition"
            >
              <h3 className={`text-sm font-semibold ${t.accent}`}>{t.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Tip */}
      <section className="glass-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8b923]/15 text-sm text-[#e8b923]">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{t('Pro tip')}</p>
            <p className="mt-1 text-sm text-slate-400">
              Use the search bar above to type natural language commands like
              &ldquo;explain photosynthesis for BECE&rdquo; or &ldquo;create a study group for physics&rdquo;.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
