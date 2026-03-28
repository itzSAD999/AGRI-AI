import { PageHeader } from '../components/PageHeader'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addStudyNote,
  deleteStudyNote,
  fetchStudyNotes,
  fetchUserPracticeHistory,
  fetchUserTutorHistory,
  type StudyNoteRow,
} from '../services/supabaseService'
import { userFacingError } from '../utils/errorHandler'

type Tab = 'overview' | 'history' | 'notes'

export function MyStudy() {
  const { user, loading, configured } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [tutorH, setTutorH] = useState<
    Array<{ id: string; subject: string; level: string; question: string; created_at: string }>
  >([])
  const [pracH, setPracH] = useState<
    Array<{
      id: string
      subject: string
      level: string
      topic: string | null
      is_correct: boolean
      created_at: string
      question: string
    }>
  >([])
  const [notes, setNotes] = useState<StudyNoteRow[]>([])
  const [noteSubject, setNoteSubject] = useState('Mathematics')
  const [noteTopic, setNoteTopic] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setDataLoading(false); return }
    try {
      const [t, p, n] = await Promise.all([
        fetchUserTutorHistory(user.id),
        fetchUserPracticeHistory(user.id),
        fetchStudyNotes(user.id),
      ])
      setTutorH(t as typeof tutorH)
      setPracH(p as typeof pracH)
      setNotes(n)
    } catch (e2) {
      setErr(userFacingError(e2))
    } finally {
      setDataLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const weak = useMemo(() => {
    const wrong = pracH.filter((r) => !r.is_correct)
    const map = new Map<string, number>()
    for (const r of wrong) {
      map.set(r.subject, (map.get(r.subject) ?? 0) + 1)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [pracH])

  if (!configured) {
    return (
      <p className="text-amber-200">
        Configure Supabase env vars to use My study (auth + personal data).
      </p>
    )
  }

  if (!loading && !user) {
    return <Navigate to="/signin" replace />
  }

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!noteBody.trim()) { setErr('Note body cannot be empty.'); return }
    setErr(null)
    try {
      await addStudyNote(user.id, {
        subject: noteSubject,
        topic: noteTopic.trim() || 'General',
        note: noteBody.trim(),
      })
      setNoteBody('')
      setNoteTopic('')
      await load()
    } catch (e2) {
      setErr(userFacingError(e2))
    }
  }

  const del = async (id: string) => {
    if (!user) return
    setErr(null)
    try {
      await deleteStudyNote(user.id, id)
      await load()
    } catch (e2) {
      setErr(userFacingError(e2))
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My study"
        subtitle="Signed-in workspace: tutor and practice history, plus your own notes when Supabase is configured."
      />

      {dataLoading && (
        <div className="flex items-center gap-3 py-8 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#2dd4bf]" />
          Loading your study data...
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ['overview', 'Overview'],
            ['history', 'History'],
            ['notes', 'Notes'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === k ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {err && <p className="text-sm text-rose-300">{err}</p>}

      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold text-white">Snapshot</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tutor questions saved while logged in:{' '}
              <span className="text-white">{tutorH.length}</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Practice attempts: <span className="text-white">{pracH.length}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold text-white">Weak topics (by subject)</h2>
            {weak.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Practice more — we flag subjects with wrong answers.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {weak.map(([sub, c]) => (
                  <li key={sub}>
                    <span className="text-[#e8b923]">{sub}</span> — {c} wrong
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
              Tutor history
            </h2>
            <ul className="mt-3 space-y-2">
              {tutorH.length === 0 && (
                <li className="text-sm text-slate-500">No saved tutor questions yet.</li>
              )}
              {tutorH.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-white/10 bg-[#0a1628]/80 px-3 py-2 text-sm"
                >
                  <span className="text-[#e8b923]">
                    {r.subject} · {r.level}
                  </span>
                  <p className="text-slate-200">{r.question}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
              Practice history
            </h2>
            <ul className="mt-3 space-y-2">
              {pracH.length === 0 && (
                <li className="text-sm text-slate-500">No practice attempts yet.</li>
              )}
              {pracH.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-white/10 bg-[#0a1628]/80 px-3 py-2 text-sm"
                >
                  <span className={r.is_correct ? 'text-emerald-300' : 'text-rose-300'}>
                    {r.is_correct ? '✅' : '❌'} {r.subject}
                  </span>
                  <p className="text-slate-200">{r.question}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-6">
          <form onSubmit={addNote} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold text-white">Add note</h2>
            <input
              value={noteSubject}
              onChange={(e) => setNoteSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
            <input
              value={noteTopic}
              onChange={(e) => setNoteTopic(e.target.value)}
              placeholder="Topic"
              className="w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="Note"
              className="w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#e8b923] px-4 py-2 text-sm font-semibold text-[#0a1628]"
            >
              Save note
            </button>
          </form>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#0a1628]/80 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-[#e8b923]">
                    {n.subject} · {n.topic}
                  </p>
                  <p className="text-slate-200">{n.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void del(n.id)}
                  className="shrink-0 text-xs text-rose-300 underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
