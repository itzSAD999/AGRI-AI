export function userFacingError(e: unknown): string {
  if (e instanceof Error) return e.message
  return 'Something went wrong. Try again.'
}
