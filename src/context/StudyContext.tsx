import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Level = 'BECE' | 'WASSCE'

export type LinkedGroupStudy = {
  id: string
  title: string
  subjectHint: string
  level: Level
}

type StudyState = {
  lastSubject: string
  lastLevel: Level
  setLastFocus: (subject: string, level: Level) => void
  /** When set, Tutor / Practice / Advisory can pre-fill context from an active StudyG session */
  linkedGroupStudy: LinkedGroupStudy | null
  linkFromGroupStudy: (link: LinkedGroupStudy) => void
  clearGroupStudyLink: () => void
}

const StudyContext = createContext<StudyState | null>(null)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [lastSubject, setLastSubject] = useState('Mathematics')
  const [lastLevel, setLastLevel] = useState<Level>('BECE')
  const [linkedGroupStudy, setLinkedGroupStudy] = useState<LinkedGroupStudy | null>(null)

  const value = useMemo(
    () => ({
      lastSubject,
      lastLevel,
      setLastFocus: (subject: string, level: Level) => {
        setLastSubject(subject)
        setLastLevel(level)
      },
      linkedGroupStudy,
      linkFromGroupStudy: setLinkedGroupStudy,
      clearGroupStudyLink: () => setLinkedGroupStudy(null),
    }),
    [lastSubject, lastLevel, linkedGroupStudy],
  )

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
}

export function useStudy() {
  const ctx = useContext(StudyContext)
  if (!ctx) throw new Error('useStudy must be used within StudyProvider')
  return ctx
}
