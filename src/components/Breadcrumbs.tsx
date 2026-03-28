import { Link, useLocation } from 'react-router-dom'

const LABELS: Record<string, string> = {
  app: 'Home',
  tutor: 'Tutor',
  practice: 'Practice',
  guidance: 'Guidance',
  advisory: 'Study Plan',
  dashboard: 'Dashboard',
  mystudy: 'My Study',
  login: 'Login',
  profile: 'Profile',
  onboarding: 'Setup',
  studyg: 'StudyG Hub',
  sessions: 'Sessions',
  new: 'New Session',
}

function segmentLabel(seg: string): string {
  if (/^[0-9a-f-]{36}$/i.test(seg)) return 'Active Session'
  return LABELS[seg] ?? seg.replace(/-/g, ' ')
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  if (pathname === '/app' || pathname === '/') return null

  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { to: string; label: string }[] = [{ to: '/app', label: 'Home' }]
  let acc = ''
  for (const seg of parts) {
    acc += `/${seg}`
    if (seg === 'app') continue
    crumbs.push({ to: acc, label: segmentLabel(seg) })
  }

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => (
          <li key={c.to} className="flex items-center gap-1">
            {i > 0 && (
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-slate-600">
                <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            )}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-slate-300">{c.label}</span>
            ) : (
              <Link to={c.to} className="transition hover:text-[#2dd4bf]">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
