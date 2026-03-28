import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileUpload } from '../components/FileUpload'
import { LevelSelector } from '../components/LevelSelector'
import { PageHeader } from '../components/PageHeader'
import { useGroupStudy } from '../context/GroupStudyContext'
import type { AppLocationState } from '../types/nlpWorkflow'

export function SessionCreatePage() {
  const { createSession } = useGroupStudy()
  const loc = useLocation()
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('Mathematics')
  const [topics, setTopics] = useState('')
  const [level, setLevel] = useState<'BECE' | 'WASSCE'>('WASSCE')
  const [isPublic, setIsPublic] = useState(true)
  const [minutesPerPage, setMinutesPerPage] = useState(3)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [matTitle, setMatTitle] = useState('Session notes')
  const [matBody, setMatBody] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const st = loc.state as AppLocationState | null
    const nlp = st?.nlp
    if (!nlp) return
    if (nlp.sessionTitle) setTitle(nlp.sessionTitle)
    if (nlp.courseName) setCourse(nlp.courseName)
    if (nlp.level) setLevel(nlp.level)
    if (nlp.materialNotes?.trim()) {
      setMatBody(nlp.materialNotes)
      setMatTitle('Imported notes')
    }
    nav(loc.pathname, { replace: true, state: {} })
  }, [loc.state, loc.pathname, nav])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (!title.trim()) {
      setErr('Give your session a title.')
      return
    }
    const s = createSession({
      title,
      course,
      level,
      isPublic,
      minutesPerPage,
      initialMaterial:
        matBody.trim().length > 0 ? { title: matTitle, body: matBody } : undefined,
    })
    nav(`/app/studyg/sessions/${s.id}`)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Create study session"
        subtitle="Sessions are saved in this browser for now — you can migrate to Convex later without changing the UI."
      />
      <form onSubmit={submit} className="glass-card space-y-4 p-6">
        <div>
          <label className="text-sm text-slate-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            placeholder="e.g. SHS3 weekend physics cram"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Course / subject focus</label>
          <input
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Chapters / topics to cover</label>
          <input
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="e.g. Mechanics, Electricity, Waves"
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
          />
          <p className="mt-0.5 text-[10px] text-slate-500">Comma-separated list (optional)</p>
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-300">Level</p>
          <LevelSelector value={level} onChange={setLevel} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Start time</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">End time</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-300">Minutes per page (reading speed)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={minutesPerPage}
            onChange={(e) => setMinutesPerPage(Number(e.target.value))}
            className="mt-1 w-24 rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
          />
          <p className="mt-0.5 text-[10px] text-slate-500">Default speed — adjustable during study</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-[#e8b923]"
          />
          Show in public list (anyone with invite code can join)
        </label>
        <div className="border-t border-white/10 pt-4">
          <p className="text-sm font-medium text-[#2dd4bf]">Optional starter material</p>
          <p className="mb-2 text-xs text-slate-500">Paste notes or upload a file.</p>
          <FileUpload
            onContent={(text, name) => {
              setMatBody((prev) => (prev ? `${prev}\n\n${text}` : text))
              if (!matTitle || matTitle === 'Session notes') setMatTitle(name.replace(/\.[^.]+$/, ''))
            }}
            className="mb-3"
          />
          <input
            value={matTitle}
            onChange={(e) => setMatTitle(e.target.value)}
            className="input-dark"
            placeholder="Material title"
          />
          <textarea
            value={matBody}
            onChange={(e) => setMatBody(e.target.value)}
            rows={5}
            placeholder="Paste reading content or upload a file above..."
            className="input-dark mt-2"
          />
        </div>
        {err && <p className="text-sm text-rose-300">{err}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-[#e8b923] py-3 text-sm font-semibold text-[#0a1628]"
        >
          Create &amp; open session
        </button>
      </form>
    </div>
  )
}
