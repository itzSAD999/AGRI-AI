/** WASSCE grades: lower numeric score = stronger (A1=1 … F9=9). */
export const WASSCE_GRADES = [
  'A1',
  'B2',
  'B3',
  'C4',
  'C5',
  'C6',
  'D7',
  'E8',
  'F9',
] as const

export type WassceGrade = (typeof WASSCE_GRADES)[number]

const GRADE_VALUE: Record<WassceGrade, number> = {
  A1: 1,
  B2: 2,
  B3: 3,
  C4: 4,
  C5: 5,
  C6: 6,
  D7: 7,
  E8: 8,
  F9: 9,
}

export function gradeToScore(g: string): number | null {
  const up = g.toUpperCase().trim() as WassceGrade
  return GRADE_VALUE[up] ?? null
}

export function bestAggregate(subjectGrades: Array<{ grade: string }>): {
  sum: number
  count: number
  usedGrades: number[]
} {
  const scores = subjectGrades
    .map((r) => gradeToScore(r.grade))
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b)
  const best6 = scores.slice(0, 6)
  const sum = best6.reduce((a, b) => a + b, 0)
  return { sum, count: best6.length, usedGrades: best6 }
}
