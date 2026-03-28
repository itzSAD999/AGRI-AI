import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useGroupStudy } from '../context/GroupStudyContext'

export function SessionsPage() {
  const { sessions, joinByCode, deleteSession } = useGroupStudy()
  const [code, setCode] = useState('')
  const nav = useNavigate()
  const [err, setErr] = useState<string | null>(null)

  const onJoin = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const s = joinByCode(code)
    if (!s) {
      setErr('No session matches that invite code.')
      return
    }
    nav(`/app/studyg/sessions/${s.id}`)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Study sessions"
        subtitle="Open a session for chat, materials, quizzes, and revision — then jump to Tutor, Practice, or Advisory with context linked."
        actions={
          <Link
            to="/app/studyg/sessions/new"
            className="rounded-xl bg-[#e8b923] px-4 py-2 text-sm font-semibold text-[#0a1628] hover:brightness-110"
          >
            + New session
          </Link>
        }
      />

      <form
        onSubmit={onJoin}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <div>
          <label className="text-xs font-medium text-slate-400">Join with invite code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="mt-1 block w-40 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 font-mono text-sm text-white uppercase"
            maxLength={8}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
        >
          Join
        </button>
        {err && <p className="text-sm text-rose-300">{err}</p>}
      </form>

      <ul className="space-y-3">
        {sessions.length === 0 && (
          <li className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-slate-500">
            No sessions yet. Create one to start group study.
          </li>
        )}
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0c1e3d]/60 px-4 py-3"
          >
            <div>
              <Link to={`/app/studyg/sessions/${s.id}`} className="font-semibold text-white hover:text-[#e8b923]">
                {s.title}
              </Link>
              <p className="text-xs text-slate-500">
                {s.course} · {s.level} · code{' '}
                <span className="font-mono text-[#2dd4bf]">{s.inviteCode}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/app/studyg/sessions/${s.id}`}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
              >
                Open
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this session?')) deleteSession(s.id)
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
