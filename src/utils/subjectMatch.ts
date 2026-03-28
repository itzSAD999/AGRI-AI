import { subjectsForLevel } from './curriculumContext'

/** Map a free-text course hint (e.g. from StudyG) to the closest curriculum subject name. */
export function matchCurriculumSubject(level: 'BECE' | 'WASSCE', hint: string): string {
  const names = subjectsForLevel(level).map((s) => s.name)
  const h = hint.trim().toLowerCase()
  if (!h) return names[0] ?? 'Mathematics'
  const exact = names.find((n) => n.toLowerCase() === h)
  if (exact) return exact
  const partial = names.find(
    (n) => h.includes(n.toLowerCase()) || n.toLowerCase().includes(h),
  )
  if (partial) return partial
  return names[0] ?? 'Mathematics'
}
