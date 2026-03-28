import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDecks } from '../context/DeckContext'
import { useGroupStudy } from '../context/GroupStudyContext'
import { useLang } from '../context/LanguageContext'
import {
  fetchUserPracticeHistory,
  fetchUserTutorHistory,
  getSupabase,
  isSupabaseConfigured,
} from '../services/supabaseService'
import {
  SEED_PRACTICE_HISTORY,
  SEED_TUTOR_HISTORY,
} from '../data/seedData'
import { deckMastery, getDueCards } from '../types/practice'

const COLORS = ['#2dd4bf', '#e8b923', '#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fb923c', '#f87171']
const DAY_MS = 86_400_000

type TutorRow = { id: string; subject: string; level: string; topic?: string | null; question: string; created_at: string; language?: string }
type PracticeRow = { id: string; subject: string; level: string; topic: string | null; is_correct: boolean; question: string; created_at: string }

function loadProfile(): { avatar: string; level: string; school: string; subjects: string[]; examDate: string } {
  try {
    const raw = localStorage.getItem('edugap_profile')
    if (raw) return JSON.parse(raw)
  } catch { /* */ }
  return { avatar: '🎓', level: 'WASSCE', school: '', subjects: ['Mathematics'], examDate: '' }
}

export function Dashboard() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { t } = useLang()
  const { decks } = useDecks()
  const { sessions } = useGroupStudy()

  const [tutorH, setTutorH] = useState<TutorRow[]>([])
  const [pracH, setPracH] = useState<PracticeRow[]>([])
  const [loading, setLoading] = useState(true)
  const configured = isSupabaseConfigured()

  const [profile, setProfile] = useState(loadProfile)

  useEffect(() => {
    if (configured && user) {
      const sb = getSupabase()
      if (sb) {
        sb.from('student_profiles')
          .select('avatar, school_level, school_name, primary_subjects, exam_date')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (!data) return
            setProfile({
              avatar: data.avatar ?? '🎓',
              level: data.school_level ?? 'WASSCE',
              school: data.school_name ?? '',
              subjects: data.primary_subjects ?? ['Mathematics'],
              examDate: data.exam_date ?? '',
            })
          })
      }
    }
  }, [configured, user])

  const load = useCallback(async () => {
    try {
      if (configured && user) {
        const [t, p] = await Promise.all([
          fetchUserTutorHistory(user.id),
          fetchUserPracticeHistory(user.id),
        ])
        const tutorRows = (t as TutorRow[])
        const pracRows = (p as PracticeRow[])
        setTutorH(tutorRows.length > 0 ? tutorRows : SEED_TUTOR_HISTORY)
        setPracH(pracRows.length > 0 ? pracRows : SEED_PRACTICE_HISTORY)
      } else {
        setTutorH(SEED_TUTOR_HISTORY)
        setPracH(SEED_PRACTICE_HISTORY)
      }
    } catch {
      setTutorH(SEED_TUTOR_HISTORY)
      setPracH(SEED_PRACTICE_HISTORY)
    } finally {
      setLoading(false)
    }
  }, [configured, user])

  useEffect(() => { void load() }, [load])

  /* ── Helpers ── */
  const dateKey = (d: Date) => d.toISOString().slice(0, 10)
  const inRange = useCallback((created: string, daysBack: number) => {
    const ts = new Date(created).getTime()
    const cutoff = Date.now() - daysBack * DAY_MS
    return ts >= cutoff
  }, [])

  /* ── Core metrics ── */
  const thisWeekTutor = tutorH.filter((r) => inRange(r.created_at, 7)).length
  const lastWeekTutor = tutorH.filter((r) => !inRange(r.created_at, 7) && inRange(r.created_at, 14)).length
  const thisWeekPrac = pracH.filter((r) => inRange(r.created_at, 7)).length
  const lastWeekPrac = pracH.filter((r) => !inRange(r.created_at, 7) && inRange(r.created_at, 14)).length

  const thisWeekTotal = thisWeekTutor + thisWeekPrac
  const lastWeekTotal = lastWeekTutor + lastWeekPrac
  const weekTrend = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : (thisWeekTotal > 0 ? 100 : 0)

  const accuracy = useMemo(() => {
    if (pracH.length === 0) return 0
    return Math.round((pracH.filter((r) => r.is_correct).length / pracH.length) * 100)
  }, [pracH])

  const thisWeekAccuracy = useMemo(() => {
    const week = pracH.filter((r) => inRange(r.created_at, 7))
    if (week.length === 0) return null
    return Math.round((week.filter((r) => r.is_correct).length / week.length) * 100)
  }, [pracH, inRange])

  const lastWeekAccuracy = useMemo(() => {
    const week = pracH.filter((r) => !inRange(r.created_at, 7) && inRange(r.created_at, 14))
    if (week.length === 0) return null
    return Math.round((week.filter((r) => r.is_correct).length / week.length) * 100)
  }, [pracH, inRange])

  const accuracyTrend = thisWeekAccuracy !== null && lastWeekAccuracy !== null
    ? thisWeekAccuracy - lastWeekAccuracy
    : null

  const studyStreak = useMemo(() => {
    const days = new Set<string>()
    for (const r of tutorH) days.add(r.created_at.slice(0, 10))
    for (const r of pracH) days.add(r.created_at.slice(0, 10))
    let streak = 0
    const d = new Date()
    while (true) {
      if (days.has(dateKey(d))) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
    return streak
  }, [tutorH, pracH])

  /* ── Exam countdown ── */
  const weeksUntilExam = useMemo(() => {
    if (!profile.examDate) return null
    const diff = new Date(profile.examDate).getTime() - Date.now()
    if (diff <= 0) return 0
    return Math.ceil(diff / (7 * DAY_MS))
  }, [profile.examDate])

  const daysUntilExam = useMemo(() => {
    if (!profile.examDate) return null
    const diff = new Date(profile.examDate).getTime() - Date.now()
    if (diff <= 0) return 0
    return Math.ceil(diff / DAY_MS)
  }, [profile.examDate])

  /* ── 4-week heatmap ── */
  const heatmap = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 27; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS)
      map.set(dateKey(d), 0)
    }
    for (const r of tutorH) {
      const key = r.created_at.slice(0, 10)
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
    }
    for (const r of pracH) {
      const key = r.created_at.slice(0, 10)
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].map(([date, count]) => ({ date, count }))
  }, [tutorH, pracH])

  const maxHeat = Math.max(...heatmap.map((h) => h.count), 1)

  /* ── 7-day bar chart ── */
  const dailyActivity = useMemo(() => {
    const map = new Map<string, { tutor: number; practice: number }>()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS)
      map.set(dateKey(d), { tutor: 0, practice: 0 })
    }
    for (const r of tutorH) {
      const key = r.created_at.slice(0, 10)
      const entry = map.get(key)
      if (entry) entry.tutor++
    }
    for (const r of pracH) {
      const key = r.created_at.slice(0, 10)
      const entry = map.get(key)
      if (entry) entry.practice++
    }
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return [...map.entries()].map(([date, v]) => ({
      day: dayNames[new Date(date).getDay()],
      tutor: v.tutor,
      practice: v.practice,
    }))
  }, [tutorH, pracH])

  /* ── Subject breakdown ── */
  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of tutorH) map.set(r.subject, (map.get(r.subject) ?? 0) + 1)
    for (const r of pracH) map.set(r.subject, (map.get(r.subject) ?? 0) + 1)
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [tutorH, pracH])

  /* ── Topic-level accuracy ── */
  const topicAccuracy = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>()
    for (const r of pracH) {
      const key = `${r.subject} → ${r.topic ?? 'General'}`
      const cur = map.get(key) ?? { correct: 0, total: 0 }
      cur.total++
      if (r.is_correct) cur.correct++
      map.set(key, cur)
    }
    return [...map.entries()]
      .map(([topic, v]) => ({ topic, correct: v.correct, total: v.total, pct: Math.round((v.correct / v.total) * 100) }))
      .sort((a, b) => a.pct - b.pct)
  }, [pracH])

  /* ── Strong & weak subjects ── */
  const subjectAccuracy = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>()
    for (const r of pracH) {
      const cur = map.get(r.subject) ?? { correct: 0, total: 0 }
      cur.total++
      if (r.is_correct) cur.correct++
      map.set(r.subject, cur)
    }
    return [...map.entries()]
      .map(([subject, v]) => ({ subject, correct: v.correct, total: v.total, pct: Math.round((v.correct / v.total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
  }, [pracH])

  /* ── Decks ── */
  const totalDecks = decks.length
  const totalCards = decks.reduce((s, d) => s + d.cards.length, 0)
  const totalDue = decks.reduce((s, d) => s + getDueCards(d).length, 0)
  const avgMastery = totalDecks > 0 ? Math.round(decks.reduce((s, d) => s + deckMastery(d), 0) / totalDecks) : 0

  /* ── Recommended actions ── */
  const recommendations = useMemo(() => {
    const items: { text: string; action: string; route: string; urgency: 'high' | 'medium' | 'low' }[] = []

    if (totalDue > 0) {
      items.push({ text: `${totalDue} cards are due for review`, action: 'Review now', route: '/app/practice', urgency: 'high' })
    }

    const weakTopics = topicAccuracy.filter((t) => t.pct < 50 && t.total >= 2)
    if (weakTopics.length > 0) {
      items.push({ text: `Struggling with ${weakTopics[0].topic}`, action: 'Practice this', route: '/app/practice', urgency: 'high' })
    }

    if (studyStreak === 0) {
      items.push({ text: 'No study activity today yet', action: 'Start studying', route: '/app/tutor', urgency: 'medium' })
    }

    if (weeksUntilExam !== null && weeksUntilExam <= 4 && weeksUntilExam > 0) {
      items.push({ text: `Only ${weeksUntilExam} week${weeksUntilExam !== 1 ? 's' : ''} until your exam!`, action: 'Intensify', route: '/app/tutor', urgency: 'high' })
    }

    if (decks.length === 0) {
      items.push({ text: 'Create your first practice deck', action: 'Create deck', route: '/app/practice', urgency: 'medium' })
    }

    if (sessions.length === 0) {
      items.push({ text: 'Try group study with classmates', action: 'Start session', route: '/app/studyg/new', urgency: 'low' })
    }

    const untouched = profile.subjects.filter((s) =>
      !tutorH.some((r) => r.subject === s) && !pracH.some((r) => r.subject === s),
    )
    if (untouched.length > 0) {
      items.push({ text: `Haven't touched ${untouched[0]} yet`, action: 'Study now', route: '/app/tutor', urgency: 'medium' })
    }

    return items.slice(0, 4)
  }, [totalDue, topicAccuracy, studyStreak, weeksUntilExam, decks.length, sessions.length, profile.subjects, tutorH, pracH])

  const recentQuestions = tutorH.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#2dd4bf]" />
        Loading your dashboard...
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1e3d] via-[#132d5e] to-[#0c1e3d] p-6">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">{t(greeting())}</p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {user?.name ?? 'Student'} {profile.avatar}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {studyStreak > 0
                ? `${studyStreak}-day streak — keep it going!`
                : 'Start studying today to build your streak!'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {daysUntilExam !== null && daysUntilExam > 0 && (
              <div className="rounded-xl border border-[#e8b923]/30 bg-[#e8b923]/10 px-4 py-2 text-center">
                <p className="text-2xl font-bold text-[#e8b923]">{daysUntilExam}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#e8b923]/70">days to exam</p>
              </div>
            )}
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-[#2dd4bf]">{thisWeekTotal}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">this week</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-white">{accuracy}%</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">accuracy</p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#2dd4bf]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#e8b923]/5 blur-3xl" />
      </div>

      {/* ── Stat cards with trends ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TrendCard
          label={t('Study streak')}
          value={`${studyStreak}`}
          unit={`day${studyStreak !== 1 ? 's' : ''}`}
          icon="🔥"
          accent="text-orange-400"
        />
        <TrendCard
          label={t('Weekly activity')}
          value={`${thisWeekTotal}`}
          unit="questions"
          trend={weekTrend}
          icon="📈"
          accent="text-[#2dd4bf]"
        />
        <TrendCard
          label={t('Practice accuracy')}
          value={`${accuracy}%`}
          unit={`${pracH.length} attempts`}
          trend={accuracyTrend}
          icon="🎯"
          accent="text-[#e8b923]"
        />
        <TrendCard
          label={t('Deck mastery')}
          value={`${avgMastery}%`}
          unit={`${totalDue} due · ${totalCards} cards`}
          icon="📚"
          accent="text-violet-400"
        />
      </div>

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="rounded-2xl border border-[#2dd4bf]/20 bg-[#2dd4bf]/[0.04] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2dd4bf]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2dd4bf]/20 text-xs">!</span>
            {t('Recommended for you')}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recommendations.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => nav(r.route)}
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-[#2dd4bf]/30 hover:bg-white/[0.08]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">{r.text}</p>
                </div>
                <span className={`ml-3 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition group-hover:brightness-110 ${
                  r.urgency === 'high'
                    ? 'bg-rose-500/20 text-rose-300'
                    : r.urgency === 'medium'
                      ? 'bg-[#e8b923]/20 text-[#e8b923]'
                      : 'bg-white/10 text-slate-300'
                }`}>
                  {r.action} →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 4-week heatmap ── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/60 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
          {t('Study heatmap')} — {t('last 4 weeks')}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {heatmap.map((h) => {
            const intensity = h.count === 0 ? 0 : Math.max(0.2, h.count / maxHeat)
            const dayLabel = new Date(h.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
            return (
              <div
                key={h.date}
                title={`${dayLabel}: ${h.count} activities`}
                className="h-6 w-6 rounded-[4px] border border-white/5 transition hover:scale-125 sm:h-7 sm:w-7"
                style={{
                  backgroundColor: h.count > 0
                    ? `rgba(45, 212, 191, ${intensity})`
                    : 'rgba(255,255,255,0.03)',
                }}
              />
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
          <span>Less</span>
          {[0, 0.2, 0.4, 0.7, 1].map((op) => (
            <div key={op} className="h-3 w-3 rounded-sm" style={{ backgroundColor: op === 0 ? 'rgba(255,255,255,0.03)' : `rgba(45, 212, 191, ${op})` }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* ── 7-day activity chart + Subject pie ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/60 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
            {t('7-day activity')}
          </h2>
          <div className="h-48">
            {dailyActivity.every((d) => d.tutor + d.practice === 0) ? (
              <p className="pt-8 text-center text-sm text-slate-500">Start studying to see your activity!</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0c1e3d', border: '1px solid #ffffff33', borderRadius: '8px' }} />
                  <Bar dataKey="tutor" stackId="a" fill="#2dd4bf" radius={[0, 0, 0, 0]} name="Tutor" />
                  <Bar dataKey="practice" stackId="a" fill="#e8b923" radius={[4, 4, 0, 0]} name="Practice" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/60 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#e8b923]">
            {t('Subject focus')}
          </h2>
          <div className="h-48">
            {subjectBreakdown.length === 0 ? (
              <p className="pt-8 text-center text-sm text-slate-500">No subject data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    label={({ name }) => name}
                    fontSize={11}
                  >
                    {subjectBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0c1e3d', border: '1px solid #ffffff33', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Subject accuracy bars ── */}
      {subjectAccuracy.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/60 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-emerald-300">
            {t('Subject performance')}
          </h2>
          <div className="space-y-3">
            {subjectAccuracy.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200">{s.subject}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{s.correct}/{s.total} correct</span>
                    <span className={`font-semibold ${s.pct >= 70 ? 'text-emerald-300' : s.pct >= 50 ? 'text-[#e8b923]' : 'text-rose-300'}`}>
                      {s.pct}%
                    </span>
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.pct >= 70 ? 'bg-emerald-400' : s.pct >= 50 ? 'bg-[#e8b923]' : 'bg-rose-400'
                    }`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Topic-level breakdown ── */}
      {topicAccuracy.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/60 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-rose-300">
            {t('Topic breakdown')} — {t('weakest first')}
          </h2>
          <div className="space-y-2">
            {topicAccuracy.map((tp) => (
              <div key={tp.topic} className="flex items-center gap-3 rounded-lg bg-black/20 px-3 py-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  tp.pct >= 70 ? 'bg-emerald-500/20 text-emerald-300'
                    : tp.pct >= 50 ? 'bg-[#e8b923]/20 text-[#e8b923]'
                      : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {tp.pct}%
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{tp.topic}</p>
                  <p className="text-[10px] text-slate-500">{tp.correct}/{tp.total} correct</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deck mastery overview ── */}
      {decks.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/60 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-violet-400">
            {t('Deck mastery')}
          </h2>
          <div className="space-y-3">
            {decks.slice(0, 6).map((d) => {
              const pct = deckMastery(d)
              const due = getDueCards(d).length
              return (
                <div key={d.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{d.title}</span>
                    <span className="text-xs text-slate-400">
                      {pct}% mastered · {due} due
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-[#2dd4bf] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Group study sessions summary ── */}
      {sessions.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/60 p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-pink-400">
            {t('Group study sessions')}
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <MiniStat label={t('Active sessions')} value={sessions.length} accent="text-pink-400" />
            <MiniStat label={t('Total materials')} value={sessions.reduce((s, ss) => s + ss.materials.length, 0)} accent="text-[#2dd4bf]" />
            <MiniStat label={t('Revision items')} value={sessions.reduce((s, ss) => s + ss.revisionItems.length, 0)} accent="text-[#e8b923]" />
          </div>
        </div>
      )}

      {/* ── Recent questions ── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
          {t('Recent questions')}
        </h2>
        <ul className="space-y-2">
          {recentQuestions.length === 0 && (
            <li className="text-sm text-slate-500">No questions yet. Try the AI Tutor!</li>
          )}
          {recentQuestions.map((r) => (
            <li key={r.id} className="rounded-xl border border-white/10 bg-[#0a1628]/80 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#e8b923]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#e8b923]">{r.subject}</span>
                <span className="text-[10px] text-slate-500">{r.level}</span>
                {r.topic && <span className="text-[10px] text-slate-600">· {r.topic}</span>}
                {r.language === 'twi' && <span className="rounded bg-violet-500/20 px-1 py-0.5 text-[9px] font-bold text-violet-300">TWI</span>}
              </div>
              <p className="mt-1 text-slate-200">{r.question}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── Helper components ── */

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function TrendCard({ label, value, unit, trend, icon, accent }: {
  label: string; value: string; unit: string; trend?: number | null; icon: string; accent: string
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {trend != null && trend !== 0 && (
          <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            trend > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-[11px] text-slate-400">{unit}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  )
}

function MiniStat({ label, value, accent = 'text-white' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-3 text-center">
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  )
}
