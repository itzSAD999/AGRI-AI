export function voiceInputSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as Window & {
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
  }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}
