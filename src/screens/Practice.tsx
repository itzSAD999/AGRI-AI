import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { generateDeckCards } from '../agents/practiceAgent'
import { runTutorChat } from '../agents/tutorAgent'
import { FileUpload } from '../components/FileUpload'
import { LevelSelector } from '../components/LevelSelector'
import { SubjectSelector } from '../components/SubjectSelector'
import { useDecks } from '../context/DeckContext'
import { useLang } from '../context/LanguageContext'
import { useStudy } from '../context/StudyContext'
import { cn } from '../lib/cn'
import { subjectsForLevel } from '../utils/curriculumContext'
import { userFacingError } from '../utils/errorHandler'
import { insertUsageEvent } from '../services/supabaseService'
import { getDueCards, deckMastery, newCard, type Card, type Deck } from '../types/practice'
import type { AppLocationState } from '../types/nlpWorkflow'

type View = 'library' | 'create' | 'study' | 'detail'
type RatingLabel = { quality: number; label: string; color: string }

const RATINGS: RatingLabel[] = [
  { quality: 0, label: 'Again', color: 'bg-rose-500/20 text-rose-200 border-rose-500/30' },
  { quality: 2, label: 'Hard', color: 'bg-amber-500/20 text-amber-100 border-amber-500/30' },
  { quality: 3, label: 'Good', color: 'bg-blue-500/20 text-blue-100 border-blue-500/30' },
  { quality: 5, label: 'Easy', color: 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' },
]

/* ═══════════════════════════════════════════════
   DECK LIBRARY
   ═══════════════════════════════════════════════ */

function DeckLibrary({
  onCreateNew,
  onOpenDeck,
  onStudyDeck,
}: {
  onCreateNew: () => void
  onOpenDeck: (id: string) => void
  onStudyDeck: (id: string) => void
}) {
  const { decks, deleteDeck } = useDecks()
  const { t } = useLang()

  const grouped = useMemo(() => {
    const map = new Map<string, Deck[]>()
    for (const d of decks) {
      const arr = map.get(d.subject) ?? []
      arr.push(d)
      map.set(d.subject, arr)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [decks])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('Practice')}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Upload notes, generate flashcards, MCQs &amp; fill-in-the-blanks — then study with
            spaced repetition.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-xl bg-[#e8b923] px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
        >
          + {t('Create deck')}
        </button>
      </div>

      {decks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
          <p className="text-lg font-medium text-slate-300">No decks yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Create your first deck — upload your slides or notes, and AI will generate
            flashcards, MCQs, and fill-in-the-blank cards for you.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-4 rounded-xl bg-[#e8b923] px-5 py-2.5 text-sm font-semibold text-[#0a1628]"
          >
            Create your first deck
          </button>
        </div>
      )}

      {grouped.map(([subject, subjectDecks]) => (
        <div key={subject}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            {subject}{' '}
            <span className="text-slate-600">
              ({subjectDecks.length} deck{subjectDecks.length > 1 ? 's' : ''})
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectDecks.map((d) => {
              const due = getDueCards(d).length
              const pct = deckMastery(d)
              return (
                <div
                  key={d.id}
                  className="group rounded-xl border border-white/10 bg-[#0c1e3d]/50 p-4 transition hover:border-[#e8b923]/30"
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => onOpenDeck(d.id)}
                  >
                    <h3 className="font-semibold text-white group-hover:text-[#e8b923]">
                      {d.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {d.cards.length} card{d.cards.length !== 1 ? 's' : ''} · {d.level}
                    </p>
                  </button>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full bg-[#2dd4bf] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">{pct}% mastered</p>
                    </div>
                    {due > 0 && (
                      <span className="rounded-full bg-[#e8b923]/20 px-2 py-0.5 text-[10px] font-semibold text-[#e8b923]">
                        {due} due
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onStudyDeck(d.id)}
                      className="flex-1 rounded-lg bg-[#e8b923]/15 py-1.5 text-xs font-semibold text-[#e8b923] transition hover:bg-[#e8b923]/25"
                    >
                      {t('Study')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this deck?')) deleteDeck(d.id)
                      }}
                      className="rounded-lg px-2 py-1.5 text-xs text-rose-400/60 transition hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      {t('Delete')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   DECK CREATE
   ═══════════════════════════════════════════════ */

function DeckCreate({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const { lastLevel, lastSubject } = useStudy()
  const { createDeck } = useDecks()
  const { lang, t } = useLang()
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<'BECE' | 'WASSCE'>(lastLevel)
  const [subject, setSubject] = useState(lastSubject)
  const [topic, setTopic] = useState('')
  const [material, setMaterial] = useState('')
  const [cardCount, setCardCount] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<
    Array<{ type: 'flashcard' | 'mcq' | 'fill_blank'; front: string; back: string; options?: string[] }>
  >([])

  const subjects = useMemo(() => subjectsForLevel(level), [level])

  const generate = async () => {
    setError(null)
    setLoading(true)
    try {
      const cards = await generateDeckCards({
        subject,
        level,
        topic: topic || undefined,
        material: material || undefined,
        count: cardCount,
        lang,
      })
      setPreview(cards)
      if (!title.trim()) setTitle(`${subject}${topic ? ' — ' + topic : ''} cards`)
    } catch (err) {
      setError(userFacingError(err))
    } finally {
      setLoading(false)
    }
  }

  const saveDeck = () => {
    if (preview.length === 0) return
    const deck = createDeck({
      title: title.trim() || `${subject} deck`,
      subject,
      level,
      description: topic || undefined,
      sourceMaterial: material || undefined,
      cards: preview.map(newCard),
    })
    void insertUsageEvent({ event_type: 'deck_create', subject, level })
    onCreated(deck.id)
  }

  const removePreviewCard = (idx: number) => setPreview((p) => p.filter((_, i) => i !== idx))

  const typeLabel = (t: string) =>
    t === 'flashcard' ? 'Flashcard' : t === 'mcq' ? 'MCQ' : 'Fill blank'
  const typeBadge = (t: string) =>
    t === 'flashcard'
      ? 'bg-blue-500/20 text-blue-200'
      : t === 'mcq'
        ? 'bg-violet-500/20 text-violet-200'
        : 'bg-amber-500/20 text-amber-100'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        {t('Back')}
      </button>

      <h1 className="text-2xl font-bold text-white">{t('Create deck')}</h1>

      <div className="glass-card space-y-4 p-6">
        <div>
          <label className="text-sm text-slate-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-dark mt-1"
            placeholder="e.g. SHS3 Biology Chapter 5"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm text-slate-300">Level</p>
            <LevelSelector value={level} onChange={setLevel} />
          </div>
          <div>
            <p className="mb-1.5 text-sm text-slate-300">Subject</p>
            <SubjectSelector subjects={subjects} value={subject} onChange={setSubject} />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-300">Topic / chapter</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-dark mt-1"
            placeholder="e.g. Photosynthesis, Quadratic equations"
          />
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-sm font-medium text-[#2dd4bf]">Upload your material</p>
          <p className="mb-2 text-xs text-slate-500">
            Upload slides, notes, or paste text. AI generates cards from your content.
          </p>
          <FileUpload
            onContent={(text) => setMaterial((prev) => (prev ? `${prev}\n\n${text}` : text))}
            className="mb-3"
          />
          <textarea
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            rows={5}
            placeholder="Or paste your notes here… (leave empty and AI will generate from syllabus knowledge)"
            className="input-dark"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300">Number of cards</label>
          <select
            value={cardCount}
            onChange={(e) => setCardCount(Number(e.target.value))}
            className="mt-1 w-32 rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
          >
            {[5, 10, 15, 20, 25, 30].map((n) => (
              <option key={n} value={n}>
                {n} cards
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <button
          type="button"
          disabled={loading}
          onClick={() => void generate()}
          className="w-full rounded-xl bg-[#e8b923] py-3 text-sm font-semibold text-[#0a1628] disabled:opacity-50"
        >
          {loading ? `${t('Generate cards')}…` : t('Generate cards')}
        </button>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Preview ({preview.length} cards)
            </h2>
            <button
              type="button"
              onClick={saveDeck}
              className="rounded-xl bg-[#2dd4bf] px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
            >
              {t('Save deck')}
            </button>
          </div>

          {preview.map((c, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-[#0c1e3d]/60 px-4 py-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', typeBadge(c.type))}>
                    {typeLabel(c.type)}
                  </span>
                  <p className="mt-2 text-white">{c.front}</p>
                  {c.options && (
                    <ul className="mt-1 space-y-0.5 pl-4 text-slate-400">
                      {c.options.map((o, j) => (
                        <li key={j}>{o}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-xs text-[#2dd4bf]">Answer: {c.back}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removePreviewCard(i)}
                  className="text-xs text-slate-600 hover:text-rose-300"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={saveDeck}
            className="w-full rounded-xl bg-[#2dd4bf] py-3 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            {t('Save deck')} ({preview.length})
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   DECK DETAIL
   ═══════════════════════════════════════════════ */

function DeckDetail({
  deck,
  onBack,
  onStudy,
}: {
  deck: Deck
  onBack: () => void
  onStudy: () => void
}) {
  const { t } = useLang()
  const due = getDueCards(deck).length
  const pct = deckMastery(deck)
  const counts = useMemo(() => {
    const fc = deck.cards.filter((c) => c.type === 'flashcard').length
    const mcq = deck.cards.filter((c) => c.type === 'mcq').length
    const fb = deck.cards.filter((c) => c.type === 'fill_blank').length
    return { fc, mcq, fb }
  }, [deck])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        {t('Back')}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{deck.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {deck.subject} · {deck.level}
            {deck.description ? ` · ${deck.description}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onStudy}
          className="rounded-xl bg-[#e8b923] px-6 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
        >
          {due > 0 ? `${t('Study')} (${due})` : t('Study')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{deck.cards.length}</p>
          <p className="text-xs text-slate-500">Total cards</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#e8b923]">{due}</p>
          <p className="text-xs text-slate-500">Due now</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-[#2dd4bf]">{pct}%</p>
          <p className="text-xs text-slate-500">Mastered</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
        <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-200">
          {counts.fc} flashcards
        </span>
        <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-violet-200">
          {counts.mcq} MCQs
        </span>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-100">
          {counts.fb} fill-in-blank
        </span>
      </div>

      {/* Mastery bar */}
      <div>
        <div className="h-2 overflow-hidden rounded-full bg-black/40">
          <div className="h-full bg-[#2dd4bf] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Card list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">All cards</h2>
        {deck.cards.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-white/[0.06] bg-[#0c1e3d]/40 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[9px] font-semibold',
                  c.type === 'flashcard'
                    ? 'bg-blue-500/20 text-blue-200'
                    : c.type === 'mcq'
                      ? 'bg-violet-500/20 text-violet-200'
                      : 'bg-amber-500/20 text-amber-100',
                )}
              >
                {c.type === 'flashcard' ? 'FC' : c.type === 'mcq' ? 'MCQ' : 'FB'}
              </span>
              <span className="truncate text-slate-300">{c.front}</span>
              {c.repetitions >= 3 && (
                <span className="ml-auto text-[10px] text-emerald-400">mastered</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   STUDY SESSION
   ═══════════════════════════════════════════════ */

function StudySession({
  deck,
  onExit,
}: {
  deck: Deck
  onExit: () => void
}) {
  const { gradeCard, markStudied } = useDecks()
  const { lang, t } = useLang()

  const queue = useMemo(() => {
    const due = getDueCards(deck)
    if (due.length > 0) return due
    return [...deck.cards].sort(() => Math.random() - 0.5)
  }, [deck])

  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const [mcqChoice, setMcqChoice] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [aiHint, setAiHint] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const card: Card | undefined = queue[idx]
  const total = queue.length
  const done = idx >= total

  useEffect(() => {
    if (done) markStudied(deck.id)
  }, [done, deck.id, markStudied])

  const reset = () => {
    setFlipped(false)
    setFillInput('')
    setMcqChoice(null)
    setAnswered(false)
    setAiHint(null)
  }

  const advance = (quality: number) => {
    if (!card) return
    gradeCard(deck.id, card.id, quality)
    reset()
    setIdx((i) => i + 1)
  }

  const checkFill = () => {
    setAnswered(true)
    setFlipped(true)
  }

  const checkMcq = () => {
    setAnswered(true)
    setFlipped(true)
  }

  const askAi = useCallback(async () => {
    if (!card || aiLoading) return
    setAiLoading(true)
    try {
      const response = await runTutorChat({
        level: deck.level,
        subject: deck.subject,
        lang,
        messages: [
          {
            role: 'user',
            content: `I'm studying this flashcard and need help understanding it.\n\nQuestion: ${card.front}\nAnswer: ${card.back}\n\nPlease explain this concept simply and give me a hint to remember it.`,
          },
        ],
      })
      setAiHint(response)
    } catch {
      setAiHint('Could not load AI help right now.')
    } finally {
      setAiLoading(false)
    }
  }, [card, aiLoading, deck, lang])

  const fillCorrect =
    answered && fillInput.trim().toLowerCase() === card?.back.trim().toLowerCase()
  const mcqCorrect =
    answered && mcqChoice?.trim().toUpperCase() === card?.back.trim().toUpperCase()

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-6 pt-12 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-white">Session complete!</h1>
        <p className="text-slate-400">
          You reviewed {total} card{total !== 1 ? 's' : ''} from <strong>{deck.title}</strong>.
          Come back later for spaced review.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-[#e8b923] px-6 py-3 text-sm font-semibold text-[#0a1628]"
        >
          {t('Back')}
        </button>
      </div>
    )
  }

  if (!card) return null

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← {t('Back')}
        </button>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-[#e8b923] transition-all"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-slate-500">
          {idx + 1}/{total}
        </span>
      </div>

      {/* Card type badge */}
      <div className="text-center">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-semibold',
            card.type === 'flashcard'
              ? 'bg-blue-500/15 text-blue-200'
              : card.type === 'mcq'
                ? 'bg-violet-500/15 text-violet-200'
                : 'bg-amber-500/15 text-amber-100',
          )}
        >
          {card.type === 'flashcard'
            ? 'Flashcard'
            : card.type === 'mcq'
              ? 'Multiple Choice'
              : 'Fill in the blank'}
        </span>
      </div>

      {/* ── Flashcard ── */}
      {card.type === 'flashcard' && (
        <div className="flip-card">
          <div
            className={cn('flip-inner relative cursor-pointer', flipped && 'flipped')}
            style={{ minHeight: '220px' }}
            onClick={() => !flipped && setFlipped(true)}
          >
            <div className="flip-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1e3d] to-[#101c30] p-8 text-center">
              <p className="text-lg font-medium text-white">{card.front}</p>
              <p className="mt-4 text-xs text-slate-500">Tap to flip</p>
            </div>
            <div className="flip-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#2dd4bf]/20 bg-gradient-to-br from-[#0c1e3d] to-[#0a2015] p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2dd4bf]/60">
                Answer
              </p>
              <p className="mt-2 text-lg font-medium text-white">{card.back}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Fill in the blank ── */}
      {card.type === 'fill_blank' && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1e3d] to-[#101c30] p-8 text-center">
          <p className="text-lg text-white">{card.front}</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <input
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !answered) checkFill()
              }}
              disabled={answered}
              placeholder="Type your answer…"
              className="w-56 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-center text-sm text-white placeholder:text-slate-500 disabled:opacity-60"
            />
            {!answered && (
              <button
                type="button"
                onClick={checkFill}
                disabled={!fillInput.trim()}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Check
              </button>
            )}
          </div>
          {answered && (
            <div className="mt-4">
              <p
                className={cn(
                  'text-sm font-semibold',
                  fillCorrect ? 'text-emerald-300' : 'text-rose-300',
                )}
              >
                {fillCorrect ? '✓ Correct!' : `✗ The answer is: ${card.back}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── MCQ ── */}
      {card.type === 'mcq' && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1e3d] to-[#101c30] p-8">
          <p className="text-lg text-white">{card.front}</p>
          <div className="mt-5 space-y-2">
            {(card.options ?? []).map((opt) => {
              const letter = opt.charAt(0)
              const chosen = mcqChoice === letter
              const isCorrect = answered && letter === card.back.trim().toUpperCase()
              const isWrong = answered && chosen && !isCorrect
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={answered}
                  onClick={() => setMcqChoice(letter)}
                  className={cn(
                    'block w-full rounded-xl border px-4 py-2.5 text-left text-sm transition',
                    isCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100'
                      : isWrong
                        ? 'border-rose-500/50 bg-rose-500/15 text-rose-200'
                        : chosen
                          ? 'border-[#e8b923] bg-[#e8b923]/10 text-white'
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]',
                  )}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {!answered && mcqChoice && (
            <button
              type="button"
              onClick={checkMcq}
              className="mt-4 w-full rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white"
            >
              Check answer
            </button>
          )}
          {answered && (
            <p
              className={cn(
                'mt-4 text-sm font-semibold',
                mcqCorrect ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {mcqCorrect ? '✓ Correct!' : `✗ Correct answer: ${card.back}`}
            </p>
          )}
        </div>
      )}

      {/* ── Rating buttons (shown after reveal) ── */}
      {(flipped || answered) && (
        <div className="space-y-3">
          <p className="text-center text-xs text-slate-500">How well did you know this?</p>
          <div className="flex justify-center gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.quality}
                type="button"
                onClick={() => advance(r.quality)}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-semibold transition hover:brightness-110',
                  r.color,
                )}
              >
                {t(r.label)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── AI help ── */}
      <div className="text-center">
        <button
          type="button"
          disabled={aiLoading}
          onClick={() => void askAi()}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 transition hover:text-white disabled:opacity-50"
        >
          {aiLoading ? '…' : `💡 ${t('Ask AI to explain')}`}
        </button>
        {aiHint && (
          <div className="mt-3 rounded-xl border border-[#2dd4bf]/20 bg-[#2dd4bf]/5 p-4 text-left text-sm text-slate-200">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#2dd4bf]/60">
              AI Tutor
            </p>
            <span className="whitespace-pre-wrap">{aiHint}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN PRACTICE SCREEN (router)
   ═══════════════════════════════════════════════ */

export function Practice() {
  const loc = useLocation()
  const nav = useNavigate()
  const { lastLevel } = useStudy()
  const { decks } = useDecks()
  const [view, setView] = useState<View>('library')
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)

  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId) ?? null,
    [decks, activeDeckId],
  )

  /* NLP prefill */
  useEffect(() => {
    const st = loc.state as AppLocationState | null
    const nlp = st?.nlp
    if (!nlp) return
    nav(loc.pathname, { replace: true, state: {} })
  }, [loc.state, loc.pathname, nav, lastLevel])

  const goLibrary = () => {
    setView('library')
    setActiveDeckId(null)
  }
  const goCreate = () => setView('create')
  const goDetail = (id: string) => {
    setActiveDeckId(id)
    setView('detail')
  }
  const goStudy = (id: string) => {
    setActiveDeckId(id)
    setView('study')
  }

  return (
    <div className="animate-fade-in">
      {view === 'library' && (
        <DeckLibrary onCreateNew={goCreate} onOpenDeck={goDetail} onStudyDeck={goStudy} />
      )}

      {view === 'create' && (
        <DeckCreate
          onBack={goLibrary}
          onCreated={(id) => {
            setActiveDeckId(id)
            setView('detail')
          }}
        />
      )}

      {view === 'detail' && activeDeck && (
        <DeckDetail deck={activeDeck} onBack={goLibrary} onStudy={() => goStudy(activeDeck.id)} />
      )}

      {view === 'study' && activeDeck && (
        <StudySession deck={activeDeck} onExit={goLibrary} />
      )}
    </div>
  )
}
