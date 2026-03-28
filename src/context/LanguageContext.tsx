import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'twi'

const STORAGE_KEY = 'edugap_lang'

const TWI: Record<string, string> = {
  Home: 'Fie',
  'AI Tutor': 'AI Kyerɛkyerɛni',
  'Practice Quiz': 'Nhwɛsoɔ',
  Practice: 'Nhwɛsoɔ',
  Guidance: 'Akwankyerɛ',
  'Study Plan': 'Adesua Nhyehyɛe',
  Sessions: 'Nhyiamu',
  'New Session': 'Nhyiam Foforɔ',
  Dashboard: 'Nsɛm Titiriw',
  'My Study': 'Me Adesua',
  'Sign out': 'Firi mu',
  Settings: 'Nhyehyɛe',
  'New chat': 'Nkɔmmɔ foforɔ',
  Send: 'Mena kɔ',
  Study: 'Sua',
  'Create deck': 'Yɛ deck foforɔ',
  'Generate cards': 'Yɛ kaadɛ',
  'Save deck': 'Kora deck no',
  Back: 'San kɔ',
  Delete: 'Popa',
  Open: 'Bue',
  'Good morning': 'Maakye',
  'Good afternoon': 'Maaha',
  'Good evening': 'Maadwo',
  'What would you like to work on today?': 'Dɛn na wopɛ sɛ woyɛ ɛnnɛ?',
  'Start tutoring': 'Fi ase kyerɛkyerɛ',
  'Take a quiz': 'Yɛ nhwɛsoɔ bi',
  'Check guidance': 'Hwɛ akwankyerɛ',
  'Start a group': 'Hyɛ ase fekuo',
  'More tools': 'Nnwinnade pii',
  'Pro tip': 'Akwankyerɛ pa',
  Again: 'Bio',
  Hard: 'Ɛyɛ den',
  Good: 'Ɛyɛ',
  Easy: 'Ɛnyɛ den',
  'Ask AI to explain': 'Bisa AI kyerɛ',
  'Mark my answer': 'Hyɛ me mmuaeɛ agyinamu',
  Learn: 'Sua',
  Plan: 'Nhyehyɛe',
  'Study together': 'Sua bom',
  Insights: 'Nhunumuɛ',
  'Natural language — say what you need': 'Ka deɛ wohia',
  Go: 'Kɔ',
  English: 'Borɔfo',
  Twi: 'Twi',
}

type LanguageContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (en: string) => string
  isTwi: boolean
}

const Ctx = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Lang) || 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* quota */
    }
  }, [])

  const t = useCallback(
    (en: string): string => {
      if (lang === 'en') return en
      return TWI[en] ?? en
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang, t, isTwi: lang === 'twi' }),
    [lang, setLang, t],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
