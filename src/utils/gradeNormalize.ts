import { WASSCE_GRADES } from './wassceGrades'

const VALID = new Set<string>(WASSCE_GRADES)

export function normalizeWassceGrade(input: string): string {
  const u = input.trim().toUpperCase().replace(/\s+/g, '')
  if (VALID.has(u)) return u
  const alnum = u.replace(/[^A-Z0-9]/g, '')
  for (const g of WASSCE_GRADES) {
    if (g.replace(/[^A-Z0-9]/g, '') === alnum) return g
  }
  return 'C6'
}
