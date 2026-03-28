import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GroupStudyLinkBanner } from '../components/GroupStudyLinkBanner'
import { runTutorChat } from '../agents/tutorAgent'
import { runTwiGuidancePlain } from '../agents/languageAgent'
import { LevelSelector } from '../components/LevelSelector'
import { SubjectSelector } from '../components/SubjectSelector'
import { VoiceInput } from '../components/VoiceInput'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useStudy } from '../context/StudyContext'
import { cn } from '../lib/cn'
import { insertTutorSession, insertUsageEvent } from '../services/supabaseService'
import { getSessionId } from '../utils/sessionManager'
import { userFacingError } from '../utils/errorHandler'
import { speakText, speechSupported, stopSpeaking } from '../utils/voiceOutput'
import { subjectsForLevel, SUBJECTS } from '../utils/curriculumContext'
import { matchCurriculumSubject } from '../utils/subjectMatch'
import type { AppLocationState } from '../types/nlpWorkflow'

type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string }

/* Lightweight inline markdown: handles **bold** and line breaks */
function Md({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="font-semibold text-white">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </span>
  )
}

function buildWelcome(subject: string, level: string, twi?: boolean): ChatMsg {
  if (twi) {
    return {
      id: 'welcome',
      role: 'assistant',
      content: [
        `Maakye! Meyɛ wo AI kyerɛkyerɛni wɔ **${subject}** ase wɔ **${level}** kwan so.`,
        `Mɛboa wo ate nsɛm ase, yɛ nsɛmmisa, na mesiesie wo ma wo exam — yɛde Ghana mu nsɛnkyerɛnne bɛyɛ adwuma.`,
        '',
        'Wobɛtumi:',
        `- Bisa me biribiara fa ${subject} ho`,
        '- Ka "quiz me" na mɛsɔ wo hwɛ',
        '- Hyɛ adesua botaeɛ (tia Settings a ɛwɔ soro hɔ)',
        '',
        'Dɛn na wopɛ sɛ wosua ɛnnɛ?',
      ].join('\n'),
    }
  }
  return {
    id: 'welcome',
    role: 'assistant',
    content: [
      `Hi! I'm your AI tutor for **${subject}** at the **${level}** level.`,
      `I'll help you understand concepts, work through problems, and prepare for your exam — all with examples from Ghana.`,
      '',
      'You can:',
      `- Ask me anything about ${subject}`,
      '- Say "quiz me" and I\'ll test your knowledge',
      '- Set learning goals (tap Settings above)',
      '- Ask me to explain things more simply',
      '',
      'What would you like to learn today?',
    ].join('\n'),
  }
}

export function Tutor() {
  const loc = useLocation()
  const nav = useNavigate()
  const { user } = useAuth()
  const { lang, t, isTwi } = useLang()
  const { lastSubject, lastLevel, setLastFocus, linkedGroupStudy } = useStudy()

  /* ── Config ── */
  const [level, setLevel] = useState<'BECE' | 'WASSCE'>(lastLevel)
  const [subject, setSubject] = useState(lastSubject)
  const [topic, setTopic] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  /* ── Goals ── */
  const [goals, setGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState('')

  /* ── Chat ── */
  const [messages, setMessages] = useState<ChatMsg[]>([buildWelcome(lastSubject, lastLevel, isTwi)])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ── Per-message Twi ── */
  const [twiMap, setTwiMap] = useState<Record<string, string>>({})
  const [twiLoadingId, setTwiLoadingId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  /* ── Refs ── */
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<ChatMsg[]>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const subjects = useMemo(() => subjectsForLevel(level), [level])
  const topics = useMemo(() => SUBJECTS.find((x) => x.name === subject)?.topics ?? [], [subject])

  /* Keep subject valid when level changes */
  useEffect(() => {
    if (!subjects.some((s) => s.name === subject)) {
      setSubject(subjects[0]?.name ?? 'Mathematics')
    }
  }, [subjects, subject])

  /* Reset conversation when subject, level, or language changes */
  useEffect(() => {
    setMessages([buildWelcome(subject, level, isTwi)])
    setTwiMap({})
    setError(null)
    messagesRef.current = [buildWelcome(subject, level, isTwi)]
  }, [subject, level, isTwi])

  /* GroupStudy link context */
  useEffect(() => {
    if (!linkedGroupStudy) return
    setLevel(linkedGroupStudy.level)
    setSubject(matchCurriculumSubject(linkedGroupStudy.level, linkedGroupStudy.subjectHint))
  }, [linkedGroupStudy])

  /* NLP prefill from command bar */
  useEffect(() => {
    const st = loc.state as AppLocationState | null
    const nlp = st?.nlp
    if (!nlp) return
    if (nlp.level) setLevel(nlp.level)
    const lev = nlp.level ?? lastLevel
    if (nlp.subject) setSubject(matchCurriculumSubject(lev, nlp.subject))
    if (nlp.topic) setTopic(nlp.topic)
    if (nlp.question) setInput(nlp.question)
    nav(loc.pathname, { replace: true, state: {} })
  }, [loc.state, loc.pathname, nav, lastLevel])

  /* Auto-scroll on new messages */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* ── Goals ── */
  const addGoal = () => {
    const g = goalInput.trim()
    if (!g) return
    setGoals((prev) => [...prev, g])
    setGoalInput('')
  }
  const removeGoal = (idx: number) => setGoals((prev) => prev.filter((_, i) => i !== idx))

  /* ── Send message ── */
  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setError(null)

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: 'user', content: text }
    const updated = [...messagesRef.current, userMsg]
    setMessages(updated)
    messagesRef.current = updated
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)
    setLastFocus(subject, level)

    const trimmed = updated.slice(-30)

    try {
      const response = await runTutorChat({
        level,
        subject,
        topic: topic || undefined,
        goals: goals.length > 0 ? goals.join('\n') : undefined,
        lang,
        messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
      })
      const aiMsg: ChatMsg = { id: crypto.randomUUID(), role: 'assistant', content: response }
      setMessages((prev) => [...prev, aiMsg])

      const sid = getSessionId()
      void insertTutorSession({
        session_id: sid,
        user_id: user?.id ?? null,
        subject,
        level,
        topic: topic || null,
        question: text,
        tutor_output: { conversational: true, response },
        language: 'english',
      })
      void insertUsageEvent({ event_type: 'tutor_ask', subject, level, language: 'english' })
    } catch (err) {
      setError(userFacingError(err))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, level, subject, topic, goals, user, setLastFocus, lang])

  /* ── Per-message Twi translation ── */
  const translateMsg = useCallback(
    async (msgId: string, content: string) => {
      if (twiMap[msgId] || twiLoadingId) return
      setTwiLoadingId(msgId)
      try {
        const twi = await runTwiGuidancePlain(content)
        setTwiMap((prev) => ({ ...prev, [msgId]: twi }))
        void insertUsageEvent({ event_type: 'tutor_twi_view', subject, level, language: 'twi' })
      } catch (err) {
        setError(userFacingError(err))
      } finally {
        setTwiLoadingId(null)
      }
    },
    [twiMap, twiLoadingId, subject, level],
  )

  /* ── Per-message read-aloud ── */
  const readAloud = (msgId: string, content: string) => {
    if (speakingId === msgId) {
      stopSpeaking()
      setSpeakingId(null)
      return
    }
    stopSpeaking()
    speakText(content, twiMap[msgId] ? 'twi' : 'en')
    setSpeakingId(msgId)
    window.setTimeout(() => setSpeakingId(null), Math.min(content.length * 60, 120_000))
  }

  /* ── New chat ── */
  const newChat = () => {
    const w = buildWelcome(subject, level, isTwi)
    setMessages([w])
    messagesRef.current = [w]
    setTwiMap({})
    setError(null)
    setInput('')
    inputRef.current?.focus()
  }

  /* ── Auto-resize textarea ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
      <GroupStudyLinkBanner />

      {/* ─── Top bar ─── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
            showSettings
              ? 'border-[#2dd4bf]/40 bg-[#2dd4bf]/10 text-[#2dd4bf]'
              : 'border-white/10 text-slate-400 hover:text-white',
          )}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          {t('Settings')}
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="rounded bg-white/10 px-2 py-0.5 text-white">{level}</span>
          <span>·</span>
          <span className="text-slate-300">{subject}</span>
          {topic && (
            <>
              <span>·</span>
              <span className="text-slate-400">{topic}</span>
            </>
          )}
          {goals.length > 0 && (
            <span className="text-[#2dd4bf]">
              · {goals.length} goal{goals.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={newChat}
          className="ml-auto rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white"
        >
          {t('New chat')}
        </button>
      </div>

      {/* ─── Settings panel (collapsible) ─── */}
      {showSettings && (
        <div className="animate-fade-in mb-3 space-y-4 rounded-xl border border-white/10 bg-[#0c1e3d]/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-400">Level</p>
              <LevelSelector value={level} onChange={setLevel} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-400">Subject</p>
              <SubjectSelector subjects={subjects} value={subject} onChange={setSubject} />
            </div>
            {topics.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-400">Topic (optional)</p>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white"
                >
                  <option value="">Any topic</option>
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Goals */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-400">Learning goals</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {goals.map((g, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-3 py-1 text-xs text-[#2dd4bf]"
                >
                  {g}
                  <button
                    type="button"
                    onClick={() => removeGoal(i)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              {goals.length === 0 && (
                <span className="text-xs text-slate-500">No goals set yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addGoal()
                  }
                }}
                placeholder="e.g. Master quadratic equations"
                className="flex-1 rounded-lg border border-white/15 bg-[#0a1628] px-3 py-1.5 text-sm text-white placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={addGoal}
                className="rounded-lg bg-[#2dd4bf]/20 px-3 py-1.5 text-xs font-medium text-[#2dd4bf]"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Chat messages ─── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-white/[0.06] bg-[#060f1d]/50 p-4">
        <div className="flex-1 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'rounded-br-md bg-[#e8b923]/15 text-white'
                    : 'rounded-bl-md bg-white/[0.06] text-slate-200',
                )}
              >
                <p
                  className={cn(
                    'mb-1.5 text-[10px] font-semibold uppercase tracking-wider',
                    msg.role === 'user' ? 'text-[#e8b923]/60' : 'text-[#2dd4bf]/60',
                  )}
                >
                  {msg.role === 'user' ? 'You' : 'AI Tutor'}
                </p>

                {twiMap[msg.id] ? (
                  <div>
                    <p className="mb-1 text-[10px] text-amber-300/70">Twi translation</p>
                    <span className="whitespace-pre-wrap">{twiMap[msg.id]}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTwiMap((prev) => {
                          const n = { ...prev }
                          delete n[msg.id]
                          return n
                        })
                      }
                      className="mt-2 block text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Show original
                    </button>
                  </div>
                ) : (
                  <Md text={msg.content} />
                )}

                {/* Per-message actions (AI only, skip welcome) */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-2">
                    <button
                      type="button"
                      disabled={twiLoadingId === msg.id}
                      onClick={() => void translateMsg(msg.id, msg.content)}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      {twiLoadingId === msg.id
                        ? 'Translating…'
                        : twiMap[msg.id]
                          ? 'Twi ✓'
                          : 'Twi'}
                    </button>
                    {speechSupported() && (
                      <button
                        type="button"
                        onClick={() =>
                          readAloud(msg.id, twiMap[msg.id] || msg.content)
                        }
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-slate-500 transition hover:bg-white/10 hover:text-white"
                      >
                        {speakingId === msg.id ? 'Stop' : 'Read aloud'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#2dd4bf]/60">
                  AI Tutor
                </p>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 text-rose-400 hover:text-rose-200"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ─── Input bar ─── */}
      <div className="mt-3 flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={
              messages.length <= 1
                ? 'Ask a question, set a goal, or say "quiz me on algebra"…'
                : 'Continue the conversation…'
            }
            className="w-full resize-none rounded-xl border border-white/15 bg-[#0a1628] py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-[#2dd4bf]/40 focus:outline-none"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <div className="absolute right-2 bottom-2.5">
            <VoiceInput onTranscript={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))} />
          </div>
        </div>
        <button
          type="button"
          disabled={loading || !input.trim()}
          onClick={() => void send()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8b923] text-[#0a1628] transition hover:brightness-110 disabled:opacity-40"
          aria-label="Send"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
