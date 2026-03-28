import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { runGuidanceAgent } from '../agents/guidanceAgent'
import { runTwiGuidancePlain } from '../agents/languageAgent'
import { useLang } from '../context/LanguageContext'
import { cn } from '../lib/cn'
import { userFacingError } from '../utils/errorHandler'
import { computeEligibility } from '../utils/guidanceRules'
import { GUIDANCE_SUBJECT_OPTIONS } from '../utils/guidanceSubjects'
import { WASSCE_GRADES } from '../utils/wassceGrades'
import type { GuidanceOutput } from '../utils/outputParsers'
import type { AppLocationState } from '../types/nlpWorkflow'

type Row = { id: string; subject: string; grade: string }

const STREAMS = [
  'General Science',
  'General Arts',
  'Business',
  'Home Economics',
  'Agricultural Science',
  'Visual Art',
  'Not sure',
] as const

function formatGuidanceBlock(out: GuidanceOutput): string {
  const prog = out.recommendedPrograms
    .map((p, i) => `${i + 1}. ${p.name} (${p.pathway}, ${p.fit}) — ${p.reason}`)
    .join('\n')
  const careers = out.careerPaths.map((c, i) => `${i + 1}. ${c.title}: ${c.summary}`).join('\n')
  const cautions = (out.cautions ?? []).map((c, i) => `${i + 1}. ${c}`).join('\n')
  const steps = out.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
  return [
    'PROGRAMMES',
    prog,
    'CAREERS',
    careers,
    'JUSTIFICATION',
    out.justification,
    'CAUTIONS',
    cautions || 'None listed.',
    'NEXT STEPS',
    steps,
  ].join('\n\n')
}

export function Guidance() {
  const loc = useLocation()
  const nav = useNavigate()
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `r${i}`,
      subject: '',
      grade: '',
    })),
  )
  const [stream, setStream] = useState<string>(STREAMS[0])
  const [interests, setInterests] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [out, setOut] = useState<GuidanceOutput | null>(null)
  const [eligibility, setEligibility] = useState<ReturnType<typeof computeEligibility> | null>(
    null,
  )
  const { isTwi } = useLang()
  const [twiBlob, setTwiBlob] = useState<string | null>(null)
  const [twiLoading, setTwiLoading] = useState(false)

  const filledRows = useMemo(
    () => rows.map((r) => ({ subject: r.subject, grade: r.grade })),
    [rows],
  )

  useEffect(() => {
    const st = loc.state as AppLocationState | null
    const nlp = st?.nlp
    if (!nlp) return
    if (nlp.interests) setInterests(nlp.interests)
    if (nlp.grades && nlp.grades.length > 0) {
      setRows((prev) =>
        prev.map((row, i) => {
          const g = nlp.grades![i]
          if (!g) return row
          return { ...row, subject: g.subject, grade: g.grade }
        }),
      )
    }
    nav(loc.pathname, { replace: true, state: {} })
  }, [loc.state, loc.pathname, nav])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOut(null)
    setEligibility(null)
    setTwiBlob(null)
    const graded = filledRows.filter((r) => r.subject.trim() && r.grade.trim())
    if (graded.length < 3) {
      setError('Add at least 3 subjects with grades.')
      return
    }
    const elig = computeEligibility(graded)
    setEligibility(elig)
    setLoading(true)
    try {
      const result = await runGuidanceAgent({
        grades: graded,
        interests,
        stream,
        eligibility: elig,
      })
      setOut(result)
    } catch (err) {
      setError(userFacingError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isTwi || !out || twiBlob || twiLoading) return
    let cancelled = false
    setTwiLoading(true)
    runTwiGuidancePlain(formatGuidanceBlock(out))
      .then((text) => { if (!cancelled) setTwiBlob(text) })
      .catch((err) => { if (!cancelled) setError(userFacingError(err)) })
      .finally(() => { if (!cancelled) setTwiLoading(false) })
    return () => { cancelled = true }
  }, [isTwi, out, twiBlob, twiLoading])

  const tierStyle = (t: string) => {
    if (t === 'excellent' || t === 'strong') return 'text-emerald-200 bg-emerald-500/15'
    if (t === 'competitive') return 'text-amber-100 bg-amber-500/15'
    return 'text-rose-100 bg-rose-500/15'
  }

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Academic guidance"
        subtitle="Enter WASSCE grades — rules check eligibility first, then AI suggests programmes and careers (Ghana-focused). Use the command bar above or natural language from Home."
      />

      <form onSubmit={submit} className="glass-card space-y-6 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">SHS stream (optional)</label>
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            className="w-full max-w-md rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
          >
            {STREAMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Subjects &amp; grades</p>
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={row.id} className="flex flex-wrap gap-2">
                <select
                  value={row.subject}
                  onChange={(e) => {
                    const v = e.target.value
                    setRows((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, subject: v } : r)),
                    )
                  }}
                  className="min-w-[200px] flex-1 rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
                >
                  <option value="">Subject</option>
                  {GUIDANCE_SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={row.grade}
                  onChange={(e) => {
                    const v = e.target.value
                    setRows((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, grade: v } : r)),
                    )
                  }}
                  className="w-28 rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
                >
                  <option value="">Grade</option>
                  {WASSCE_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Interests (optional)
          </label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={3}
            placeholder="e.g. coding, medicine, teaching, entrepreneurship…"
            className="w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#e8b923] px-5 py-3 text-sm font-semibold text-[#0a1628] disabled:opacity-60"
        >
          {loading ? 'Analysing grades…' : 'Get recommendations'}
        </button>
      </form>

      {eligibility && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1e3d]/80 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
            Rule-based eligibility
          </h2>
          <p className="mt-2">
            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', tierStyle(eligibility.tier))}>
              Tier: {eligibility.tier.replaceAll('_', ' ')}
            </span>
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Best-six aggregate sum (lower is stronger):{' '}
            <span className="font-mono text-white">{eligibility.aggregateSum}</span> from{' '}
            <span className="text-white">{eligibility.subjectsCounted}</span> graded papers in window.
          </p>
          {eligibility.coresPresent.length > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              Cores detected: {eligibility.coresPresent.join(', ')}
            </p>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
            {eligibility.ruleNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {out && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0c1e3d]/80 p-6">
          {twiLoading && (
            <p className="text-xs text-slate-400">Preparing Twi translation…</p>
          )}

          {isTwi && twiBlob ? (
            <>
              <p className="text-sm text-amber-200/90">⚠️ AI-assisted Twi — [AI ho kasa]</p>
              <div className="whitespace-pre-wrap text-sm text-slate-100">{twiBlob}</div>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2dd4bf]">
                  Recommended programmes
                </h3>
                <ul className="mt-2 space-y-3">
                  {out.recommendedPrograms.map((p, i) => (
                    <li key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.pathway} · <span className="text-[#e8b923]">{p.fit}</span>
                      </p>
                      <p className="mt-1 text-slate-200">{p.reason}</p>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2dd4bf]">
                  Career paths
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200">
                  {out.careerPaths.map((c, i) => (
                    <li key={i}>
                      <span className="font-medium text-white">{c.title}</span> — {c.summary}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2dd4bf]">
                  Why these fit
                </h3>
                <p className="mt-2 text-slate-200">{out.justification}</p>
              </section>
              {(out.cautions?.length ?? 0) > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-200">
                    Cautions
                  </h3>
                  <ul className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                    {out.cautions!.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#2dd4bf]">
                  Next steps
                </h3>
                <ul className="mt-2 list-decimal space-y-1 pl-5 text-slate-200">
                  {out.nextSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}
