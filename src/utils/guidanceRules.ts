import { bestAggregate, gradeToScore } from './wassceGrades'

export type EligibilityTier = 'excellent' | 'strong' | 'competitive' | 'developing' | 'at_risk'

export type EligibilitySummary = {
  tier: EligibilityTier
  aggregateSum: number
  subjectsCounted: number
  hasF9: boolean
  hasMultipleWeak: boolean
  coresPresent: string[]
  ruleNotes: string[]
}

const CORE_MAP: Record<string, string> = {
  'english language': 'English Language',
  'core mathematics': 'Core Mathematics',
  'integrated science': 'Integrated Science',
  'social studies': 'Social Studies',
}

function normalizeSubject(s: string) {
  return s.trim().toLowerCase()
}

export function computeEligibility(
  rows: Array<{ subject: string; grade: string }>,
): EligibilitySummary {
  const filled = rows.filter((r) => r.subject.trim() && r.grade.trim())
  const { sum, count, usedGrades } = bestAggregate(filled)
  const hasF9 = filled.some((r) => gradeToScore(r.grade) === 9)
  const weak = usedGrades.filter((g) => g >= 7).length
  const hasMultipleWeak = weak >= 2

  const coresPresent = Object.entries(CORE_MAP)
    .filter(([key]) => filled.some((r) => normalizeSubject(r.subject) === key))
    .map(([, label]) => label)

  const ruleNotes: string[] = []
  if (count < 4) {
    ruleNotes.push('Add at least 4 graded subjects for a more reliable eligibility signal.')
  }
  if (coresPresent.length < 2) {
    ruleNotes.push('Include core subjects (English, Core Maths, Science or Social Studies) when possible.')
  }
  if (hasF9) {
    ruleNotes.push('Rule filter: F9 present — many competitive programmes may be out of reach without resit or pathway programmes.')
  }
  if (hasMultipleWeak) {
    ruleNotes.push('Rule filter: multiple grades D7 or weaker in best-six window — prioritise foundation and skills pathways.')
  }

  let tier: EligibilityTier = 'developing'
  if (count >= 4 && !hasF9 && sum <= 18) tier = 'excellent'
  else if (count >= 4 && !hasF9 && sum <= 24) tier = 'strong'
  else if (count >= 4 && !hasF9 && sum <= 30) tier = 'competitive'
  else if (hasF9 || sum > 36 || count < 3) tier = 'at_risk'
  else tier = 'developing'

  return {
    tier,
    aggregateSum: sum,
    subjectsCounted: count,
    hasF9,
    hasMultipleWeak,
    coresPresent,
    ruleNotes,
  }
}
