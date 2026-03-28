export function validateTutorQuestion(q: string): string | null {
  const t = q.trim()
  if (t.length < 5) return 'Question must be at least 5 characters.'
  return null
}

export function normalizeGhanaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('233') && digits.length >= 12) {
    return '+' + digits.slice(0, 12)
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '+233' + digits.slice(1)
  }
  if (digits.length === 9) {
    return '+233' + digits
  }
  return null
}
