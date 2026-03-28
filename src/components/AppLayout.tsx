import { useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { Breadcrumbs } from './Breadcrumbs'
import { NaturalLanguageBar } from './NaturalLanguageBar'

type NavItem = { to: string; label: string; end?: boolean; icon: React.ReactNode }
type NavSection = { label: string; items: NavItem[] }

const I = {
  home: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
    </svg>
  ),
  tutor: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-6.25 3a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5H3a.75.75 0 01.75.75zm14.5 0a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5H17a.75.75 0 01.75.75zM7.172 13.828a.75.75 0 010 1.061l-1.06 1.06a.75.75 0 01-1.062-1.06l1.06-1.06a.75.75 0 011.062 0zm7.656-1.06a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15z" />
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 00-1.5 0v2.546l-.943-1.048a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.114 0l2.25-2.5a.75.75 0 00-1.114-1.004l-.943 1.048V8.75z" clipRule="evenodd" />
    </svg>
  ),
  guide: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505a20.01 20.01 0 013.78.501.75.75 0 11-.339 1.462A18.558 18.558 0 0010 17.5c-1.442 0-2.845.165-4.191.476a.75.75 0 01-.338-1.462 20.01 20.01 0 013.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 01-.387.83A4.981 4.981 0 015 14a4.981 4.981 0 01-2.294-.556.75.75 0 01-.387-.832L4.02 5.067c-.37.07-.738.148-1.103.232a.75.75 0 01-.336-1.462 33.053 33.053 0 016.668-.829V2.75A.75.75 0 0110 2zM5 12.662l-1.395-6.177C4.6 6.324 5.6 6.2 5.6 6.2s1 .124 1.995.285L6.2 12.662A3.593 3.593 0 015 13c-.418 0-.82-.12-1.2-.338zm10 0a3.593 3.593 0 01-1.2.338c-.418 0-.82-.12-1.2-.338L14.005 6.485S15 6.2 15 6.2s1 .124 1.995.285L15 12.662z" />
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
    </svg>
  ),
  group: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
    </svg>
  ),
  sessions: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
    </svg>
  ),
  study: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06V3.44a.75.75 0 00-.546-.722A9.006 9.006 0 0015 2.5a9.006 9.006 0 00-4.25 1.065v13.254zM9.25 4.565A9.006 9.006 0 005 3.5a9.006 9.006 0 00-2.454.218A.75.75 0 002 4.44v11.62a.75.75 0 00.954.722A7.462 7.462 0 015 16.5c1.578 0 3.06.49 4.25 1.32V4.565z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 00-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
    </svg>
  ),
}

const sections: NavSection[] = [
  {
    label: 'Learn',
    items: [
      { to: '/app/tutor', label: 'AI Tutor', icon: I.tutor },
      { to: '/app/practice', label: 'Practice Quiz', icon: I.quiz },
    ],
  },
  {
    label: 'Plan',
    items: [
      { to: '/app/guidance', label: 'Guidance', icon: I.guide },
      { to: '/app/advisory', label: 'Study Plan', icon: I.plan },
    ],
  },
  {
    label: 'Study together',
    items: [
      { to: '/app/studyg/sessions', label: 'Sessions', icon: I.group, end: true },
      { to: '/app/studyg/sessions/new', label: 'New Session', icon: I.plus },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: I.chart },
      { to: '/app/mystudy', label: 'My Study', icon: I.study },
    ],
  },
]

const sidebarLink = (isActive: boolean) =>
  cn(isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')

export function AppLayout() {
  const { user, loading, signOut } = useAuth()
  const { lang, setLang, t } = useLang()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!loading && !user) return <Navigate to="/signin" replace />
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#e8b923]" />
      </div>
    )
  }

  const isAppHome = pathname === '/app'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ─── Sidebar backdrop (mobile) ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[#060f1d] transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#e8b923] to-[#d4a020]">
            <span className="text-xs font-bold text-[#0a1628]">E</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">EduGap AI</span>
        </div>

        {/* Home link */}
        <div className="px-3 pt-4 pb-1">
          <NavLink
            to="/app"
            end
            className={({ isActive }) => sidebarLink(isActive)}
            onClick={() => setSidebarOpen(false)}
          >
            {I.home}
            <span>{t('Home')}</span>
          </NavLink>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {sections.map((s) => (
            <div key={s.label} className="mt-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {t(s.label)}
              </p>
              <div className="flex flex-col gap-0.5">
                {s.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => sidebarLink(isActive)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    <span>{t(item.label)}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="border-t border-white/[0.06] p-3">
          <NavLink
            to="/app/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.04]"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2dd4bf] to-[#20b2aa] text-xs font-bold text-[#0a1628]">
              {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name ?? 'Student'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={() => void signOut()}
            className="sidebar-item-inactive mt-1 w-full text-rose-400/70 hover:text-rose-300"
          >
            {I.logout}
            <span>{t('Sign out')}</span>
          </button>

          {/* Language toggle */}
          <div className="mt-2 flex rounded-lg bg-white/[0.04] p-0.5">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-semibold transition',
                lang === 'en'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('twi')}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-semibold transition',
                lang === 'twi'
                  ? 'bg-[#e8b923]/20 text-[#e8b923]'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              TWI
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/[0.06] bg-[#0a1628]/80 px-4 backdrop-blur-xl lg:px-6">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 items-center">
            <NaturalLanguageBar compact className="max-w-xl border-white/10 bg-white/[0.03]" />
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2dd4bf] to-[#20b2aa] text-xs font-bold text-[#0a1628]">
              {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
            {!isAppHome && <Breadcrumbs />}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
