import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { runNlpUnderstand } from '../agents/nlpAgent'
import { useLang } from '../context/LanguageContext'
import { insertUsageEvent } from '../services/supabaseService'
import { cn } from '../lib/cn'
import { userFacingError } from '../utils/errorHandler'
import { navigateFromNlpResult } from '../utils/nlpRouter'

export function NaturalLanguageBar({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const nav = useNavigate()
  const { lang, t, isTwi } = useLang()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [clarify, setClarify] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setClarify(null)
    const t = text.trim()
    if (t.length < 2) return
    setLoading(true)
    try {
      const parsed = await runNlpUnderstand(t)
      void insertUsageEvent({
        event_type: 'nlp_command',
        language: lang,
      })
      const { clarify: c } = navigateFromNlpResult(nav, parsed, t)
      if (c) setClarify(c)
      else setText('')
    } catch (er) {
      setErr(userFacingError(er))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#2dd4bf]/25 bg-[#0c1e3d]/60 p-4',
        compact && 'p-3',
        className,
      )}
    >
      <p className={cn('font-medium text-[#2dd4bf]', compact ? 'text-xs' : 'text-sm')}>
        {t('Natural language — say what you need')}
      </p>
      <form onSubmit={submit} className={cn('mt-2 flex flex-wrap gap-2', compact && 'mt-1.5')}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isTwi
              ? (compact ? 'Ka deɛ wohia wɔ Twi anaa Borɔfo mu…' : 'e.g. "Kyerɛ me photosynthesis ma BECE" · "Me wɔ A1 Mathematics B2 Physics — dɛn na mesua wɔ uni?"')
              : (compact ? 'Ask anything in plain language…' : 'e.g. "Explain quadratic equations for BECE" · "I have A1 maths B2 physics — what should I study at uni?"')
          }
          className={cn(
            'min-w-[200px] flex-1 rounded-xl border border-white/15 bg-[#0a1628] px-3 text-sm text-white placeholder:text-slate-600',
            compact ? 'py-1.5' : 'py-2',
          )}
        />
        <button
          type="submit"
          disabled={loading || text.trim().length < 2}
          className="rounded-xl bg-[#2dd4bf] px-4 py-2 text-sm font-semibold text-[#0a1628] disabled:opacity-50"
        >
          {loading ? '…' : t('Go')}
        </button>
      </form>
      {clarify && <p className="mt-2 text-sm text-amber-200">{clarify}</p>}
      {err && <p className="mt-2 text-sm text-rose-300">{err}</p>}
      {!compact && (
        <p className="mt-2 text-xs text-slate-500">
          Routes to Tutor, Practice, Guidance, Advisory, Study hub, Dashboard, or My study using AI
          intent detection.
        </p>
      )}
    </div>
  )
}
