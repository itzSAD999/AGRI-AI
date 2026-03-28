import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDecks } from '../context/DeckContext'
import { useGroupStudy } from '../context/GroupStudyContext'
import { useLang } from '../context/LanguageContext'
import { cn } from '../lib/cn'
import { SUBJECTS, subjectsForLevel } from '../utils/curriculumContext'
import { deckMastery, getDueCards } from '../types/practice'

type Level = 'BECE' | 'WASSCE'

const AVATARS = ['🎓', '📚', '🧠', '🌟', '🦁', '🎯', '💡', '🔬', '📐', '🌍']
const SCHOOLS_HINT = ['Achimota School', 'Mfantsipim', 'Presec Legon', 'Wesley Girls', 'Adisadel', 'St Peters', 'Other']

function loadProfile(): {
  avatar: string
  level: Level
  school: string
  subjects: string[]
  examDate: string
} {
  try {
    const raw = localStorage.getItem('edugap_profile')
    if (raw) return JSON.parse(raw)
  } catch { /* */ }
  return { avatar: '🎓', level: 'WASSCE', school: '', subjects: ['Mathematics'], examDate: '' }
}

function saveProfile(p: ReturnType<typeof loadProfile>) {
  localStorage.setItem('edugap_profile', JSON.stringify(p))
}

export function Profile() {
  const { user } = useAuth()
  const { decks } = useDecks()
  const { sessions } = useGroupStudy()
  const { lang, setLang, t, isTwi } = useLang()

  const [avatar, setAvatar] = useState('🎓')
  const [level, setLevel] = useState<Level>('WASSCE')
  const [school, setSchool] = useState('')
  const [subjects, setSubjects] = useState<string[]>(['Mathematics'])
  const [examDate, setExamDate] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const p = loadProfile()
    setAvatar(p.avatar)
    setLevel(p.level)
    setSchool(p.school)
    setSubjects(p.subjects)
    setExamDate(p.examDate)
  }, [])

  const pool = useMemo(() => subjectsForLevel(level).map((s) => s.name), [level])

  const toggleSubject = (name: string) => {
    setSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )
  }

  const handleSave = useCallback(() => {
    saveProfile({ avatar, level, school, subjects, examDate })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [avatar, level, school, subjects, examDate])

  const weeksUntilExam = useMemo(() => {
    if (!examDate) return null
    const diff = new Date(examDate).getTime() - Date.now()
    if (diff <= 0) return 0
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
  }, [examDate])

  const totalCards = decks.reduce((s, d) => s + d.cards.length, 0)
  const totalDue = decks.reduce((s, d) => s + getDueCards(d).length, 0)
  const avgMastery = decks.length > 0
    ? Math.round(decks.reduce((s, d) => s + deckMastery(d), 0) / decks.length)
    : 0
  const totalStudySessions = sessions.length
  const totalMessages = sessions.reduce((s, sess) => s + sess.messages.length, 0)
  const totalMaterials = sessions.reduce((s, sess) => s + sess.materials.length, 0)

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e8b923]/30 to-[#e8b923]/10 text-4xl">
          {avatar}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user?.name ?? 'Student'}</h1>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <p className="mt-1 text-xs text-slate-500">
            {level} · {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            {weeksUntilExam !== null && (
              <span className="text-[#e8b923]"> · {weeksUntilExam} weeks to exam</span>
            )}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Practice decks', value: decks.length, accent: 'text-[#e8b923]' },
          { label: 'Total cards', value: totalCards, accent: 'text-[#2dd4bf]' },
          { label: 'Cards due', value: totalDue, accent: 'text-rose-300' },
          { label: 'Avg mastery', value: `${avgMastery}%`, accent: 'text-emerald-300' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={cn('mt-1 text-2xl font-bold', s.accent)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Study sessions', value: totalStudySessions },
          { label: 'Materials uploaded', value: totalMaterials },
          { label: 'Group messages', value: totalMessages },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="glass-card space-y-6 p-6">
        <h2 className="text-lg font-semibold text-white">{t('Settings')}</h2>

        {/* Avatar picker */}
        <div>
          <p className="mb-2 text-sm text-slate-300">Avatar</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl text-xl transition',
                  avatar === a
                    ? 'bg-[#e8b923]/20 ring-2 ring-[#e8b923]'
                    : 'bg-white/5 hover:bg-white/10',
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <p className="mb-2 text-sm text-slate-300">Level</p>
          <div className="flex gap-2">
            {(['BECE', 'WASSCE'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => { setLevel(l); setSubjects([]) }}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition',
                  level === l
                    ? 'bg-[#e8b923] text-[#0a1628]'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div>
          <p className="mb-2 text-sm text-slate-300">My subjects</p>
          <div className="flex flex-wrap gap-2">
            {pool.map((name) => {
              const meta = SUBJECTS.find((s) => s.name === name)
              const on = subjects.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleSubject(name)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition',
                    on
                      ? 'border-[#e8b923] bg-[#e8b923]/20 text-white'
                      : 'border-white/15 bg-white/5 text-slate-400',
                  )}
                >
                  {meta?.emoji} {name}
                </button>
              )
            })}
          </div>
        </div>

        {/* School */}
        <div>
          <p className="mb-2 text-sm text-slate-300">School</p>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="e.g. Achimota School"
            className="input-dark"
            list="school-hints"
          />
          <datalist id="school-hints">
            {SCHOOLS_HINT.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        {/* Exam date */}
        <div>
          <p className="mb-2 text-sm text-slate-300">Exam date</p>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="input-dark w-48"
          />
          {weeksUntilExam !== null && weeksUntilExam > 0 && (
            <p className="mt-1 text-xs text-[#e8b923]">{weeksUntilExam} weeks away</p>
          )}
        </div>

        {/* Language */}
        <div>
          <p className="mb-2 text-sm text-slate-300">Language</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                lang === 'en'
                  ? 'bg-white/15 text-white'
                  : 'bg-white/5 text-slate-400',
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('twi')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                lang === 'twi'
                  ? 'bg-[#e8b923]/20 text-[#e8b923]'
                  : 'bg-white/5 text-slate-400',
              )}
            >
              Twi (Akan)
            </button>
          </div>
          {isTwi && (
            <p className="mt-1 text-xs text-slate-500">
              AI responses, cards, and UI labels will be in Asante Twi
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[#e8b923] px-6 py-3 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
        >
          {saved ? '✓ Saved' : 'Save profile'}
        </button>
      </div>

      {/* Deck breakdown */}
      {decks.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">My decks</h2>
          <div className="space-y-3">
            {decks.map((d) => {
              const pct = deckMastery(d)
              const due = getDueCards(d).length
              return (
                <div key={d.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{d.title}</p>
                      <p className="text-xs text-slate-500">
                        {d.subject} · {d.level} · {d.cards.length} cards
                        {due > 0 && <span className="text-rose-300"> · {due} due</span>}
                      </p>
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      pct >= 80 ? 'text-emerald-300' : pct >= 40 ? 'text-[#e8b923]' : 'text-slate-400',
                    )}>
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        pct >= 80 ? 'bg-emerald-400' : pct >= 40 ? 'bg-[#e8b923]' : 'bg-slate-500',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
