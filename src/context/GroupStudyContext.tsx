import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { scheduleNextReview } from '../lib/spacedRep'
import { getSessionId } from '../utils/sessionManager'
import { SEED_GROUP_SESSION } from '../data/seedData'

const STORAGE_KEY = 'edugap_group_sessions_v1'

export type ChatMessage = {
  id: string
  author: string
  text: string
  at: number
}

export type Annotation = {
  id: string
  materialId: string
  page: number
  text: string
  author: string
  at: number
}

export type Material = {
  id: string
  title: string
  body: string
  pages: number
}

export type CheckIn = {
  id: string
  dueAt: number
  response?: 'on_track' | 'struggling' | 'ahead'
  note?: string
}

export type RevisionItem = {
  id: string
  topic: string
  easiness: number
  interval: number
  repetitions: number
  nextReviewAt: number
}

export type GroupSession = {
  id: string
  title: string
  course: string
  level: 'BECE' | 'WASSCE'
  inviteCode: string
  isPublic: boolean
  createdAt: number
  materials: Material[]
  messages: ChatMessage[]
  annotations: Annotation[]
  /** userKey -> materialId -> current page (1-based) */
  progressByUser: Record<string, Record<string, number>>
  checkIns: CheckIn[]
  revisionItems: RevisionItem[]
  minutesPerPage: number
}

function loadSessions(): GroupSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [SEED_GROUP_SESSION as GroupSession]
    const arr = JSON.parse(raw) as GroupSession[]
    return Array.isArray(arr) && arr.length > 0 ? arr : [SEED_GROUP_SESSION as GroupSession]
  } catch {
    return [SEED_GROUP_SESSION as GroupSession]
  }
}

function saveSessions(sessions: GroupSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function randomInvite(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

type GroupStudyCtx = {
  sessions: GroupSession[]
  createSession: (input: {
    title: string
    course: string
    level: 'BECE' | 'WASSCE'
    isPublic: boolean
    minutesPerPage: number
    initialMaterial?: { title: string; body: string }
  }) => GroupSession
  updateSession: (id: string, fn: (s: GroupSession) => GroupSession) => void
  deleteSession: (id: string) => void
  getById: (id: string) => GroupSession | undefined
  joinByCode: (code: string) => GroupSession | undefined
  addMessage: (sessionId: string, text: string, author?: string) => void
  addAnnotation: (sessionId: string, input: Omit<Annotation, 'id' | 'at' | 'author'>) => void
  addMaterial: (sessionId: string, m: Omit<Material, 'id'>) => void
  setProgress: (sessionId: string, materialId: string, page: number) => void
  scheduleCheckIn: (sessionId: string, delayMs: number) => void
  respondCheckIn: (
    sessionId: string,
    checkInId: string,
    response: CheckIn['response'],
    note?: string,
  ) => void
  addRevisionTopic: (sessionId: string, topic: string) => void
  gradeRevision: (sessionId: string, itemId: string, quality: number) => void
  userKey: string
}

const Ctx = createContext<GroupStudyCtx | null>(null)

export function GroupStudyProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<GroupSession[]>(() =>
    typeof window === 'undefined' ? [] : loadSessions(),
  )

  const userKey = useMemo(() => {
    try {
      return getSessionId()
    } catch {
      return 'anon'
    }
  }, [])

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  const createSession = useCallback(
    (input: {
      title: string
      course: string
      level: 'BECE' | 'WASSCE'
      isPublic: boolean
      minutesPerPage: number
      initialMaterial?: { title: string; body: string }
    }) => {
      const id = crypto.randomUUID()
      const materials: Material[] = []
      if (input.initialMaterial?.body.trim()) {
        const pages = Math.max(1, Math.ceil(input.initialMaterial.body.length / 2000))
        materials.push({
          id: crypto.randomUUID(),
          title: input.initialMaterial.title.trim() || 'Notes',
          body: input.initialMaterial.body.trim(),
          pages,
        })
      }
      const session: GroupSession = {
        id,
        title: input.title.trim(),
        course: input.course.trim() || 'General',
        level: input.level,
        inviteCode: randomInvite(),
        isPublic: input.isPublic,
        createdAt: Date.now(),
        materials,
        messages: [],
        annotations: [],
        progressByUser: { [userKey]: {} },
        checkIns: [],
        revisionItems: [],
        minutesPerPage: Math.max(1, input.minutesPerPage),
      }
      setSessions((prev) => [...prev, session])
      return session
    },
    [userKey],
  )

  const updateSession = useCallback((id: string, fn: (s: GroupSession) => GroupSession) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? fn(s) : s)))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const getById = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions],
  )

  const joinByCode = useCallback(
    (code: string) => {
      const c = code.trim().toUpperCase()
      return sessions.find((s) => s.inviteCode === c)
    },
    [sessions],
  )

  const addMessage = useCallback(
    (sessionId: string, text: string, author = 'You') => {
      const t = text.trim()
      if (!t) return
      updateSession(sessionId, (s) => ({
        ...s,
        messages: [
          ...s.messages,
          { id: crypto.randomUUID(), author, text: t, at: Date.now() },
        ],
      }))
    },
    [updateSession],
  )

  const addAnnotation = useCallback(
    (sessionId: string, input: Omit<Annotation, 'id' | 'at' | 'author'>) => {
      updateSession(sessionId, (s) => ({
        ...s,
        annotations: [
          ...s.annotations,
          {
            ...input,
            id: crypto.randomUUID(),
            author: 'You',
            at: Date.now(),
          },
        ],
      }))
    },
    [updateSession],
  )

  const addMaterial = useCallback(
    (sessionId: string, m: Omit<Material, 'id'>) => {
      if (!m.body.trim()) return
      const pages = Math.max(1, Math.ceil(m.body.length / 2000))
      updateSession(sessionId, (s) => ({
        ...s,
        materials: [
          ...s.materials,
          { id: crypto.randomUUID(), title: m.title.trim() || 'Material', body: m.body, pages },
        ],
      }))
    },
    [updateSession],
  )

  const setProgress = useCallback(
    (sessionId: string, materialId: string, page: number) => {
      updateSession(sessionId, (s) => {
        const byUser = { ...s.progressByUser }
        const u = { ...(byUser[userKey] ?? {}) }
        u[materialId] = Math.max(1, page)
        byUser[userKey] = u
        return { ...s, progressByUser: byUser }
      })
    },
    [updateSession, userKey],
  )

  const scheduleCheckIn = useCallback(
    (sessionId: string, delayMs: number) => {
      updateSession(sessionId, (s) => ({
        ...s,
        checkIns: [
          ...s.checkIns,
          { id: crypto.randomUUID(), dueAt: Date.now() + delayMs },
        ],
      }))
    },
    [updateSession],
  )

  const respondCheckIn = useCallback(
    (sessionId: string, checkInId: string, response: CheckIn['response'], note?: string) => {
      updateSession(sessionId, (s) => ({
        ...s,
        checkIns: s.checkIns.map((c) =>
          c.id === checkInId ? { ...c, response, note } : c,
        ),
      }))
    },
    [updateSession],
  )

  const addRevisionTopic = useCallback(
    (sessionId: string, topic: string) => {
      const t = topic.trim()
      if (!t) return
      updateSession(sessionId, (s) => ({
        ...s,
        revisionItems: [
          ...s.revisionItems,
          {
            id: crypto.randomUUID(),
            topic: t,
            easiness: 2.5,
            interval: 0,
            repetitions: 0,
            nextReviewAt: Date.now(),
          },
        ],
      }))
    },
    [updateSession],
  )

  const gradeRevision = useCallback(
    (sessionId: string, itemId: string, quality: number) => {
      updateSession(sessionId, (s) => {
        const items = s.revisionItems.map((it) => {
          if (it.id !== itemId) return it
          const next = scheduleNextReview({
            quality,
            repetitions: it.repetitions,
            easiness: it.easiness,
            interval: it.interval || 1,
          })
          const day = 86400000
          return {
            ...it,
            repetitions: next.repetitions,
            easiness: next.easiness,
            interval: next.interval,
            nextReviewAt: Date.now() + next.nextInDays * day,
          }
        })
        return { ...s, revisionItems: items }
      })
    },
    [updateSession],
  )

  const value = useMemo(
    () => ({
      sessions,
      createSession,
      updateSession,
      deleteSession,
      getById,
      joinByCode,
      addMessage,
      addAnnotation,
      addMaterial,
      setProgress,
      scheduleCheckIn,
      respondCheckIn,
      addRevisionTopic,
      gradeRevision,
      userKey,
    }),
    [
      sessions,
      createSession,
      updateSession,
      deleteSession,
      getById,
      joinByCode,
      addMessage,
      addAnnotation,
      addMaterial,
      setProgress,
      scheduleCheckIn,
      respondCheckIn,
      addRevisionTopic,
      gradeRevision,
      userKey,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useGroupStudy() {
  const x = useContext(Ctx)
  if (!x) throw new Error('useGroupStudy must be used within GroupStudyProvider')
  return x
}
