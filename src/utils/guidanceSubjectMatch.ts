import { GUIDANCE_SUBJECT_OPTIONS } from './guidanceSubjects'

export function matchGuidanceSubjectName(hint: string): string {
  const h = hint.trim().toLowerCase()
  if (!h) return GUIDANCE_SUBJECT_OPTIONS[0]
  const exact = GUIDANCE_SUBJECT_OPTIONS.find((o) => o.toLowerCase() === h)
  if (exact) return exact
  const partial = GUIDANCE_SUBJECT_OPTIONS.find(
    (o) => h.includes(o.toLowerCase()) || o.toLowerCase().includes(h),
  )
  return partial ?? hint.trim()
}
