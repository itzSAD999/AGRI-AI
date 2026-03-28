/** Extract A–D letter from options like "A. text" or "B) text" */
export function mcqOptionLetter(opt: string): string {
  const t = opt.trim()
  const m = t.match(/^([A-Da-d])[.):\s]/)
  if (m) return m[1].toUpperCase()
  const c = t.charAt(0).toUpperCase()
  return /^[A-D]$/.test(c) ? c : t.slice(0, 1).toUpperCase()
}
