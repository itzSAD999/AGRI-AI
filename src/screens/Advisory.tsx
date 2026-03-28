import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GroupStudyLinkBanner } from '../components/GroupStudyLinkBanner'
import { PageHeader } from '../components/PageHeader'
import { runAdvisoryAgent } from '../agents/advisoryAgent'
import { translateText } from '../agents/languageAgent'
import { LevelSelector } from '../components/LevelSelector'
import { cn } from '../lib/cn'
import { useLang } from '../context/LanguageContext'
import { userFacingError } from '../utils/errorHandler'
import { SUBJECTS, subjectsForLevel } from '../utils/curriculumContext'
import { matchCurriculumSubject } from '../utils/subjectMatch'
import { useStudy } from '../context/StudyContext'
import type { AppLocationState } from '../types/nlpWorkflow'

export function Advisory() {
  const loc = useLocation()
  const nav = useNavigate()
  const { linkedGroupStudy } = useStudy()
  const { isTwi, t } = useLang()
  const [level, setLevel] = useState<'BECE' | 'WASSCE'>('BECE')
  const [weeks, setWeeks] = useState(4)
  const [selected, setSelected] = useState<string[]>(['Mathematics', 'English Language'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof runAdvisoryAgent>> | null>(
    null,
  )
  const [twiPlan, setTwiPlan] = useState<string | null>(null)
  const [twiLoading, setTwiLoading] = useState(false)

  const pool = useMemo(() => subjectsForLevel(level).map((s) => s.name), [level])

  useEffect(() => {
    if (!linkedGroupStudy) return
    setLevel(linkedGroupStudy.level)
    const m = matchCurriculumSubject(linkedGroupStudy.level, linkedGroupStudy.subjectHint)
    setSelected((prev) => (prev.includes(m) ? prev : [...prev, m]))
  }, [linkedGroupStudy])

  useEffect(() => {
    const st = loc.state as AppLocationState | null
    const nlp = st?.nlp
    if (!nlp) return
    if (nlp.level) setLevel(nlp.level)
    if (nlp.weeksUntilExam) setWeeks(nlp.weeksUntilExam)
    const lev = nlp.level ?? level
    if (nlp.subjectList?.length) {
      const names = nlp.subjectList.map((s) => matchCurriculumSubject(lev, s))
      setSelected((prev) => [...new Set([...prev, ...names])])
    }
    nav(loc.pathname, { replace: true, state: {} })
  }, [loc.state, loc.pathname, nav, level])

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTwiPlan(null)
    if (selected.length === 0) {
      setError('Pick at least one subject.')
      return
    }
    setLoading(true)
    try {
      const p = await runAdvisoryAgent({
        level,
        subjects: selected,
        weeksUntilExam: weeks,
      })
      setPlan(p)
    } catch (err) {
      setError(userFacingError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isTwi || !plan || twiPlan || twiLoading) return
    setTwiLoading(true)
    const block = [
      `STUDY PLAN\n${plan.studyPlan}`,
      `PRIORITY SUBJECTS\n${plan.prioritySubjects.join('\n')}`,
      `TIME ALLOCATION\n${plan.timeAllocation}`,
      `STUDY TIPS\n${plan.studyTips.join('\n')}`,
      `WATCH THESE AREAS\n${plan.warningAreas.join('\n')}`,
      plan.motivationMessage,
    ].join('\n\n')
    translateText(block)
      .then(setTwiPlan)
      .catch(() => {})
      .finally(() => setTwiLoading(false))
  }, [isTwi, plan, twiPlan, twiLoading])

  return (
    <div className="animate-fade-in space-y-8">
      <GroupStudyLinkBanner />
      <PageHeader
        title="Study advisory"
        subtitle="Personalised prep plan from your level, subjects, and weeks until the exam. Opens with context when you link from a StudyG session."
      />

      <form onSubmit={submit} className="glass-card space-y-6 p-6">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Level</p>
          <LevelSelector value={level} onChange={setLevel} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Weeks until main exam
          </label>
          <input
            type="number"
            min={1}
            max={52}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="w-32 rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {pool.map((name) => {
              const meta = SUBJECTS.find((s) => s.name === name)
              const on = selected.includes(name)
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => toggle(name)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    on
                      ? 'border-[#e8b923] bg-[#e8b923]/20 text-white'
                      : 'border-white/15 bg-white/5 text-slate-300',
                  )}
                >
                  {meta?.emoji} {name}
                </button>
              )
            })}
          </div>
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#e8b923] px-5 py-3 text-sm font-semibold text-[#0a1628] disabled:opacity-60"
        >
          {loading ? 'Building your plan…' : 'Get study plan'}
        </button>
      </form>

      {plan && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0c1e3d]/80 p-6">
          {twiLoading && (
            <p className="text-xs text-slate-400">Preparing Twi translation…</p>
          )}
          {isTwi && twiPlan ? (
            <>
              <p className="text-sm text-amber-200/90">⚠️ AI-assisted Twi — [AI ho kasa]</p>
              <div className="whitespace-pre-wrap text-sm text-slate-100">{twiPlan}</div>
            </>
          ) : (
          <>
          <h2 className="text-lg font-semibold text-white">{t('Study Plan')}</h2>
          <p className="whitespace-pre-wrap text-slate-200">{plan.studyPlan}</p>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
              Priority subjects
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200">
              {plan.prioritySubjects.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
              Time allocation
            </h3>
            <p className="mt-2 text-slate-200">{plan.timeAllocation}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#2dd4bf]">
              Study tips
            </h3>
            <ul className="mt-2 list-decimal space-y-1 pl-5 text-slate-200">
              {plan.studyTips.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-200">
              Watch these areas
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200">
              {plan.warningAreas.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm font-medium text-[#e8b923]">{plan.motivationMessage}</p>
          </>
          )}
        </div>
      )}
    </div>
  )
}
