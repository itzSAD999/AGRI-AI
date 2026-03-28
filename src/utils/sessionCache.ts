import type { TutorOutput } from './outputParsers'

const KEY = 'edugap_tutor_cache'
const MAX = 5

export type CachedTutorEntry = {
  subject: string
  level: string
  question: string
  output: TutorOutput
  at: string
}

export function loadTutorCache(): CachedTutorEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as CachedTutorEntry[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function pushTutorCache(entry: CachedTutorEntry) {
  const prev = loadTutorCache()
  const next = [entry, ...prev].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
}
