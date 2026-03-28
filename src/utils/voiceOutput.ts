const prefersEnGh = () => {
  try {
    return navigator.language === 'en-GH' || navigator.language.startsWith('en')
  } catch {
    return true
  }
}

export function speakText(text: string, lang: 'en' | 'twi'): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'twi' ? 'ak-GH' : 'en-GH'
  if (lang === 'en' && prefersEnGh()) u.lang = 'en-GH'
  window.speechSynthesis.speak(u)
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
