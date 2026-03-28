import type { TutorOutput } from './outputParsers'

const APP_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : '')

export function buildStudyNotesMessage(out: TutorOutput): string {
  const kp = out.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
  return (
    `📚 EduGap AI — Study notes\n\n` +
    `EXPLANATION\n${out.explanation}\n\n` +
    `KEY POINTS\n${kp}\n\n` +
    `TEST YOURSELF\n${out.followUpQuestion}\n\n` +
    `Open EduGap AI: ${APP_URL}`
  )
}

export function openWhatsAppShare(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
