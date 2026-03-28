import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { FileUpload } from '../components/FileUpload'
import { PageHeader } from '../components/PageHeader'
import { runMarkerAgent } from '../agents/markerAgent'
import { runPracticeAgent } from '../agents/practiceAgent'
import { cn } from '../lib/cn'
import { useAuth } from '../context/AuthContext'
import { useGroupStudy } from '../context/GroupStudyContext'
import { useStudy } from '../context/StudyContext'
import { insertPracticeAttempt, insertUsageEvent } from '../services/supabaseService'
import { getSessionId } from '../utils/sessionManager'
import { userFacingError } from '../utils/errorHandler'
import { mcqOptionLetter } from '../utils/mcqAnswer'
import type { PracticeQuestion } from '../utils/outputParsers'

type Tab =
  | 'overview'
  | 'materials'
  | 'chat'
  | 'annotations'
  | 'quiz'
  | 'progress'
  | 'checkins'
  | 'revision'

const PAGE_CHARS = 2000

export function SessionActivePage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user } = useAuth()
  const { getById, userKey, addMessage, addAnnotation, addMaterial, setProgress, scheduleCheckIn, respondCheckIn, addRevisionTopic, gradeRevision } =
    useGroupStudy()
  const { linkFromGroupStudy } = useStudy()

  const session = id ? getById(id) : undefined
  const [tab, setTab] = useState<Tab>('overview')
  const [chatText, setChatText] = useState('')
  const [annMat, setAnnMat] = useState('')
  const [annPage, setAnnPage] = useState(1)
  const [annText, setAnnText] = useState('')
  const [newMatTitle, setNewMatTitle] = useState('')
  const [newMatBody, setNewMatBody] = useState('')
  const [revTopic, setRevTopic] = useState('')
  const [matPageIdx, setMatPageIdx] = useState<Record<string, number>>({})
  const [quizMatId, setQuizMatId] = useState<string>('')
  const [q, setQ] = useState<PracticeQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [mark, setMark] = useState<Awaited<ReturnType<typeof runMarkerAgent>> | null>(null)
  const [loadingQ, setLoadingQ] = useState(false)
  const [loadingM, setLoadingM] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [checkInNote, setCheckInNote] = useState('')
  const [speedOverride, setSpeedOverride] = useState<number | null>(null)

  const progress = session?.progressByUser[userKey] ?? {}
  const activeSpeed = speedOverride ?? session?.minutesPerPage ?? 3

  const linkTools = () => {
    if (!session) return
    linkFromGroupStudy({
      id: session.id,
      title: session.title,
      subjectHint: session.course,
      level: session.level,
    })
  }

  const currentPage = (mid: string) => matPageIdx[mid] ?? 1
  const setPageFor = (mid: string, p: number) => {
    setMatPageIdx((prev) => ({ ...prev, [mid]: p }))
    const m = session?.materials.find((x) => x.id === mid)
    if (m && session) setProgress(session.id, mid, p)
  }

  const genQuizFromMaterial = async () => {
    if (!session || !quizMatId) return
    const m = session.materials.find((x) => x.id === quizMatId)
    if (!m) return
    setErr(null)
    setMark(null)
    setAnswer('')
    setLoadingQ(true)
    try {
      const excerpt = m.body.slice(0, 3500)
      const next = await runPracticeAgent({
        subject: session.course,
        level: session.level,
        topic: `${m.title}. Base questions on this content:\n${excerpt}`,
      })
      setQ(next)
      void insertUsageEvent({
        event_type: 'studyg_quiz_generate',
        subject: session.course,
        level: session.level,
      })
    } catch (e) {
      setErr(userFacingError(e))
    } finally {
      setLoadingQ(false)
    }
  }

  const markQuiz = async () => {
    if (!q || !session) return
    setLoadingM(true)
    setErr(null)
    try {
      const m = await runMarkerAgent({ q, studentAnswer: answer.trim() || '(no answer)' })
      setMark(m)
      if (!m.isCorrect) {
        addRevisionTopic(session.id, `${q.topic} — weak from quiz`)
      }
      const sid = getSessionId()
      void insertPracticeAttempt({
        session_id: sid,
        user_id: user?.id ?? null,
        subject: q.subject,
        level: q.level,
        topic: q.topic,
        question: q.question,
        student_answer: answer,
        marker_output: m,
        is_correct: m.isCorrect,
      })
      void insertUsageEvent({
        event_type: 'studyg_quiz_mark',
        subject: q.subject,
        level: q.level,
      })
    } catch (e) {
      setErr(userFacingError(e))
    } finally {
      setLoadingM(false)
    }
  }

  if (!id) return <Navigate to="/app/studyg/sessions" replace />
  if (!session) {
    return (
      <div className="text-slate-400">
        <p>Session not found.</p>
        <Link to="/app/studyg/sessions" className="text-[#2dd4bf] underline">
          Back to list
        </Link>
      </div>
    )
  }

  const tabs: { k: Tab; label: string }[] = [
    { k: 'overview', label: 'Overview' },
    { k: 'materials', label: 'Materials' },
    { k: 'chat', label: 'Chat' },
    { k: 'annotations', label: 'Annotations' },
    { k: 'quiz', label: 'AI quiz' },
    { k: 'progress', label: 'Progress' },
    { k: 'checkins', label: 'Check-ins' },
    { k: 'revision', label: 'Revision' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Invite ${session.inviteCode}`}
        title={session.title}
        subtitle={`${session.course} · ${session.level} · ${session.minutesPerPage} min/page — link tools below to prefill Tutor, Practice, and Advisory.`}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                linkTools()
                nav('/app/tutor')
              }}
              className="rounded-lg bg-[#e8b923] px-3 py-1.5 text-xs font-semibold text-[#0a1628] hover:brightness-110"
            >
              Tutor
            </button>
            <button
              type="button"
              onClick={() => {
                linkTools()
                nav('/app/practice')
              }}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
            >
              Practice
            </button>
            <button
              type="button"
              onClick={() => {
                linkTools()
                nav('/app/advisory')
              }}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
            >
              Advisory
            </button>
            <Link
              to="/app/dashboard"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-white/25 hover:text-white"
            >
              Dashboard
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium',
              tab === t.k ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Check-in notification banner */}
      {session.checkIns.some((c) => !c.response && Date.now() >= c.dueAt) && (
        <div className="flex items-center gap-3 rounded-xl border border-[#e8b923]/30 bg-[#e8b923]/10 p-4">
          <span className="text-xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#e8b923]">Check-in due!</p>
            <p className="text-xs text-slate-300">How&apos;s your progress? Go to the Check-ins tab to respond.</p>
          </div>
          <button type="button" onClick={() => setTab('checkins')} className="rounded-lg bg-[#e8b923] px-3 py-1.5 text-xs font-semibold text-[#0a1628]">
            Respond
          </button>
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            <p>
              Use <strong className="text-white">Materials</strong> to read and track pages.{' '}
              <strong className="text-white">Chat</strong> and <strong className="text-white">Annotations</strong>{' '}
              sync on this device. <strong className="text-white">AI quiz</strong> generates questions from your study
              materials. <strong className="text-white">Revision</strong> uses SM-2 spaced repetition.
            </p>
          </div>

          {/* Session stats grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Materials', value: session.materials.length, color: 'text-[#2dd4bf]' },
              { label: 'Messages', value: session.messages.length, color: 'text-[#e8b923]' },
              { label: 'Check-ins', value: session.checkIns.length, color: 'text-violet-400' },
              { label: 'Revision items', value: session.revisionItems.length, color: 'text-pink-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-white/10 bg-black/20 p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          {session.materials.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0c1e3d]/40 p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#2dd4bf]">Your reading progress</h3>
              {session.materials.map((m) => {
                const pages = Math.max(1, Math.ceil(m.body.length / PAGE_CHARS))
                const p = Math.min(progress[m.id] ?? 1, pages)
                const pct = Math.min(100, Math.round((p / pages) * 100))
                const etaMin = Math.max(0, pages - p) * activeSpeed
                return (
                  <div key={m.id} className="mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200">{m.title}</span>
                      <span className="text-slate-500">{p}/{pages} pages · ~{etaMin} min left</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40">
                      <div className="h-full rounded-full bg-[#2dd4bf] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}

              {/* Speed override */}
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <span className="text-xs text-slate-400">Your speed:</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={activeSpeed}
                  onChange={(e) => setSpeedOverride(Number(e.target.value) || null)}
                  className="w-16 rounded-lg border border-white/15 bg-[#0a1628] px-2 py-1 text-xs text-white"
                />
                <span className="text-xs text-slate-500">min/page</span>
                {speedOverride !== null && (
                  <button type="button" onClick={() => setSpeedOverride(null)} className="text-xs text-[#2dd4bf] underline">
                    Reset to default ({session.minutesPerPage})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div className="space-y-6">
          {session.materials.length === 0 && (
            <p className="text-slate-500">No materials yet. Add notes below.</p>
          )}
          {session.materials.map((m) => {
            const pages = Math.max(1, Math.ceil(m.body.length / PAGE_CHARS))
            const p = Math.min(currentPage(m.id), pages)
            const slice = m.body.slice((p - 1) * PAGE_CHARS, p * PAGE_CHARS)
            const etaMin = Math.max(0, pages - p) * activeSpeed
            return (
              <div key={m.id} className="rounded-xl border border-white/10 bg-[#0c1e3d]/60 p-4">
                <h3 className="font-semibold text-white">{m.title}</h3>
                <p className="text-xs text-slate-500">
                  Page {p}/{pages} · ~{etaMin} min remaining at your speed
                </p>
                <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-sm text-slate-200">
                  {slice || '(empty)'}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={p <= 1}
                    onClick={() => setPageFor(m.id, p - 1)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={p >= pages}
                    onClick={() => setPageFor(m.id, p + 1)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )
          })}
          <div className="rounded-xl border border-dashed border-white/20 p-4">
            <p className="text-sm font-medium text-slate-300">Add material</p>
            <FileUpload
              onContent={(text, name) => {
                setNewMatBody((prev) => (prev ? `${prev}\n\n${text}` : text))
                if (!newMatTitle) setNewMatTitle(name.replace(/\.[^.]+$/, ''))
              }}
              className="mt-2"
            />
            <input
              value={newMatTitle}
              onChange={(e) => setNewMatTitle(e.target.value)}
              placeholder="Title"
              className="input-dark mt-2"
            />
            <textarea
              value={newMatBody}
              onChange={(e) => setNewMatBody(e.target.value)}
              rows={4}
              placeholder="Paste content or upload a file above..."
              className="input-dark mt-2"
            />
            <button
              type="button"
              onClick={() => {
                if (!newMatBody.trim()) return
                addMaterial(session.id, { title: newMatTitle, body: newMatBody, pages: 1 })
                setNewMatBody('')
                setNewMatTitle('')
              }}
              className="mt-2 rounded-lg bg-[#2dd4bf]/20 px-3 py-1.5 text-xs font-medium text-[#2dd4bf]"
            >
              Save material
            </button>
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0c1e3d]/40 p-4">
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {session.messages.length === 0 && (
              <p className="text-sm text-slate-500">No messages yet.</p>
            )}
            {session.messages.map((m) => (
              <div key={m.id} className="rounded-lg bg-black/25 px-3 py-2 text-sm">
                <span className="text-[#e8b923]">{m.author}</span>
                <span className="text-slate-500"> · </span>
                <span className="text-slate-200">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatText.trim()) {
                  addMessage(session.id, chatText)
                  setChatText('')
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (!chatText.trim()) return
                addMessage(session.id, chatText)
                setChatText('')
              }}
              className="rounded-lg bg-[#e8b923] px-4 py-2 text-sm font-semibold text-[#0a1628]"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {tab === 'annotations' && (
        <div className="space-y-4">
          <ul className="space-y-2">
            {session.annotations.map((a) => (
              <li key={a.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="text-[#2dd4bf]">
                  {session.materials.find((m) => m.id === a.materialId)?.title ?? 'Material'} p{a.page}
                </span>
                <p className="text-slate-200">{a.text}</p>
                <p className="text-xs text-slate-500">{a.author}</p>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-white/15 p-4">
            <select
              value={annMat}
              onChange={(e) => setAnnMat(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            >
              <option value="">Pick material</option>
              {session.materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={annPage}
              onChange={(e) => setAnnPage(Number(e.target.value))}
              className="mt-2 w-24 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
            <textarea
              value={annText}
              onChange={(e) => setAnnText(e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => {
                if (!annMat || !annText.trim()) return
                addAnnotation(session.id, { materialId: annMat, page: annPage, text: annText })
                setAnnText('')
              }}
              className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white"
            >
              Add annotation
            </button>
          </div>
        </div>
      )}

      {tab === 'quiz' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={quizMatId}
              onChange={(e) => setQuizMatId(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            >
              <option value="">Select material</option>
              {session.materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!quizMatId || loadingQ}
              onClick={() => void genQuizFromMaterial()}
              className="rounded-lg bg-[#e8b923] px-4 py-2 text-sm font-semibold text-[#0a1628] disabled:opacity-50"
            >
              {loadingQ ? 'Generating…' : 'Generate quiz from material'}
            </button>
          </div>
          {err && <p className="text-sm text-rose-300">{err}</p>}
          {q && (
            <div className="rounded-xl border border-white/10 bg-[#0c1e3d]/80 p-4">
              <p className="text-white">{q.question}</p>
              {q.questionType === 'multiple_choice' && q.options && (
                <div className="mt-3 space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex cursor-pointer gap-2 text-sm text-slate-200">
                      <input
                        type="radio"
                        name="sgq"
                        checked={answer === mcqOptionLetter(opt)}
                        onChange={() => setAnswer(mcqOptionLetter(opt))}
                        className="accent-[#e8b923]"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {(q.questionType === 'short_answer' || q.questionType === 'structured') && (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
                />
              )}
              <button
                type="button"
                disabled={loadingM}
                onClick={() => void markQuiz()}
                className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a1628]"
              >
                {loadingM ? 'Marking…' : 'Mark answer'}
              </button>
            </div>
          )}
          {mark && (
            <p className={cn('text-sm', mark.isCorrect ? 'text-emerald-300' : 'text-rose-300')}>
              {mark.isCorrect ? '✅' : '❌'} {mark.score} — {mark.feedback}
            </p>
          )}
        </div>
      )}

      {tab === 'progress' && (
        <ul className="space-y-2 text-sm">
          {session.materials.map((m) => {
            const p = progress[m.id] ?? 1
            const pages = Math.max(1, Math.ceil(m.body.length / PAGE_CHARS))
            const pct = Math.min(100, Math.round((p / pages) * 100))
            return (
              <li key={m.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex justify-between text-slate-200">
                  <span>{m.title}</span>
                  <span>
                    {p}/{pages} pages
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full bg-[#2dd4bf]" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {tab === 'checkins' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'In 10 min', ms: 10 * 60 * 1000 },
              { label: 'In 20 min', ms: 20 * 60 * 1000 },
              { label: 'In 30 min', ms: 30 * 60 * 1000 },
              { label: 'In 1 hour', ms: 60 * 60 * 1000 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => scheduleCheckIn(session.id, opt.ms)}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15"
              >
                Schedule check-in {opt.label.toLowerCase()}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            {session.checkIns
              .slice()
              .sort((a, b) => b.dueAt - a.dueAt)
              .map((c) => {
                const isDue = !c.response && Date.now() >= c.dueAt
                const isPending = !c.response && Date.now() < c.dueAt
                return (
                  <li key={c.id} className={cn(
                    'rounded-xl border p-4 text-sm',
                    isDue ? 'border-[#e8b923]/30 bg-[#e8b923]/5' : 'border-white/10 bg-white/5',
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        c.response ? 'bg-emerald-400' : isDue ? 'bg-[#e8b923] animate-pulse' : 'bg-slate-500',
                      )} />
                      <p className="text-slate-300">
                        {new Date(c.dueAt).toLocaleString()}
                      </p>
                      {c.response && (
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold',
                          c.response === 'on_track' ? 'bg-emerald-500/20 text-emerald-300'
                            : c.response === 'struggling' ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-[#2dd4bf]/20 text-[#2dd4bf]',
                        )}>
                          {c.response.replace('_', ' ')}
                        </span>
                      )}
                      {c.note && <span className="text-xs text-slate-500">— {c.note}</span>}
                      {isPending && <span className="text-[10px] text-slate-500">upcoming</span>}
                    </div>
                    {isDue && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-[#e8b923]">How&apos;s your progress?</p>
                        <input
                          value={checkInNote}
                          onChange={(e) => setCheckInNote(e.target.value)}
                          placeholder="Optional note (e.g. finished chapter 2)"
                          className="w-full rounded-lg border border-white/15 bg-[#0a1628] px-3 py-1.5 text-xs text-white"
                        />
                        <div className="flex flex-wrap gap-2">
                          {([
                            { key: 'on_track' as const, label: 'On track', emoji: '👍' },
                            { key: 'struggling' as const, label: 'Struggling', emoji: '😓' },
                            { key: 'ahead' as const, label: 'Ahead', emoji: '🚀' },
                          ]).map((r) => (
                            <button
                              key={r.key}
                              type="button"
                              onClick={() => {
                                respondCheckIn(session.id, c.id, r.key, checkInNote || undefined)
                                setCheckInNote('')
                              }}
                              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
                            >
                              {r.emoji} {r.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
          </ul>
          {session.checkIns.length === 0 && (
            <p className="text-sm text-slate-500">No check-ins scheduled yet. Use the buttons above to set periodic reminders.</p>
          )}
        </div>
      )}

      {tab === 'revision' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={revTopic}
              onChange={(e) => setRevTopic(e.target.value)}
              placeholder="Topic to review"
              className="flex-1 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => {
                addRevisionTopic(session.id, revTopic)
                setRevTopic('')
              }}
              className="rounded-lg bg-[#2dd4bf]/20 px-3 py-2 text-xs font-medium text-[#2dd4bf]"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {session.revisionItems
              .slice()
              .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
              .map((it) => (
                <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-sm">
                  <div>
                    <p className="text-white">{it.topic}</p>
                    <p className="text-xs text-slate-500">
                      Next: {new Date(it.nextReviewAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => gradeRevision(session.id, it.id, q)}
                        className="rounded bg-white/10 px-2 py-0.5 text-xs text-white"
                        title="Recall quality 0–5"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
