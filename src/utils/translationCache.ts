import type { TutorOutput } from './outputParsers'

const PREFIX = 'edugap_twi_'

function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return String(h)
}

export type TwiBundle = {
  explanation: string
  ghanaExample: string
  keyPoints: string[]
  commonMistakes: string[]
  followUpQuestion: string
}

export function cacheKeyForEnglish(out: TutorOutput): string {
  const blob = JSON.stringify({
    e: out.explanation,
    g: out.ghanaExample,
    k: out.keyPoints,
    c: out.commonMistakes,
    f: out.followUpQuestion,
  })
  return PREFIX + hash(blob)
}

export function getTwiFromCache(out: TutorOutput): TwiBundle | null {
  const k = cacheKeyForEnglish(out)
  try {
    const raw = localStorage.getItem(k)
    if (!raw) return null
    return JSON.parse(raw) as TwiBundle
  } catch {
    return null
  }
}

export function setTwiCache(out: TutorOutput, twi: TwiBundle) {
  localStorage.setItem(cacheKeyForEnglish(out), JSON.stringify(twi))
}
