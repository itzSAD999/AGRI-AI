import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { voiceInputSupported } from '../utils/voiceInputSupport'

type SpeechRecCtor = new () => {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((ev: { results: SpeechRecognitionResultList }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SRWindow = Window & {
  SpeechRecognition?: SpeechRecCtor
  webkitSpeechRecognition?: SpeechRecCtor
}

export function VoiceInput({
  onTranscript,
  className,
}: {
  onTranscript: (text: string) => void
  className?: string
}) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<InstanceType<SpeechRecCtor> | null>(null)

  const stop = useCallback(() => {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
  }, [])

  useEffect(() => () => stop(), [stop])

  if (!voiceInputSupported()) return null

  const start = () => {
    const w = window as SRWindow
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = 'en-GH'
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (ev: { results: SpeechRecognitionResultList }) => {
      const text = Array.from(ev.results)
        .map((r: SpeechRecognitionResult) => r[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (text) onTranscript(text)
    }
    rec.onerror = () => stop()
    rec.onend = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10',
        listening && 'animate-listening border-[#2dd4bf]',
        className,
      )}
      aria-pressed={listening}
    >
      <span aria-hidden>{listening ? '🎤' : '🎤'}</span>
      {listening ? 'Listening…' : 'Speak question'}
    </button>
  )
}
