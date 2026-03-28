import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { scheduleNextReview } from '../lib/spacedRep'
import type { Card, Deck } from '../types/practice'
import { newCard } from '../types/practice'
import { SEED_DECKS } from '../data/seedData'

const STORAGE_KEY = 'edugap_decks'

function load(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_DECKS
    const arr = JSON.parse(raw) as Deck[]
    return arr.length > 0 ? arr : SEED_DECKS
  } catch {
    return SEED_DECKS
  }
}
function save(decks: Deck[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

type DeckContextValue = {
  decks: Deck[]
  createDeck: (d: Omit<Deck, 'id' | 'createdAt' | 'cards'> & { cards?: Deck['cards'] }) => Deck
  deleteDeck: (id: string) => void
  addCards: (
    deckId: string,
    cards: Array<Pick<Card, 'type' | 'front' | 'back'> & { options?: string[] }>,
  ) => void
  gradeCard: (deckId: string, cardId: string, quality: number) => void
  markStudied: (deckId: string) => void
}

const Ctx = createContext<DeckContextValue | null>(null)

export function DeckProvider({ children }: { children: ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>(load)

  const persist = useCallback((next: Deck[]) => {
    setDecks(next)
    save(next)
  }, [])

  const createDeck = useCallback(
    (d: Omit<Deck, 'id' | 'createdAt' | 'cards'> & { cards?: Deck['cards'] }) => {
      const deck: Deck = {
        ...d,
        id: crypto.randomUUID(),
        cards: d.cards ?? [],
        createdAt: Date.now(),
      }
      persist([...load(), deck])
      return deck
    },
    [persist],
  )

  const deleteDeck = useCallback(
    (id: string) => persist(load().filter((d) => d.id !== id)),
    [persist],
  )

  const addCards = useCallback(
    (
      deckId: string,
      cards: Array<Pick<Card, 'type' | 'front' | 'back'> & { options?: string[] }>,
    ) => {
      persist(
        load().map((d) =>
          d.id === deckId ? { ...d, cards: [...d.cards, ...cards.map(newCard)] } : d,
        ),
      )
    },
    [persist],
  )

  const gradeCard = useCallback(
    (deckId: string, cardId: string, quality: number) => {
      const now = Date.now()
      persist(
        load().map((d) => {
          if (d.id !== deckId) return d
          return {
            ...d,
            cards: d.cards.map((c) => {
              if (c.id !== cardId) return c
              const r = scheduleNextReview({
                quality,
                repetitions: c.repetitions,
                easiness: c.easeFactor,
                interval: c.interval,
              })
              return {
                ...c,
                easeFactor: r.easiness,
                interval: r.interval,
                repetitions: r.repetitions,
                nextReviewAt: now + r.nextInDays * 86_400_000,
                lastReviewedAt: now,
              }
            }),
          }
        }),
      )
    },
    [persist],
  )

  const markStudied = useCallback(
    (deckId: string) =>
      persist(
        load().map((d) => (d.id === deckId ? { ...d, lastStudiedAt: Date.now() } : d)),
      ),
    [persist],
  )

  const value = useMemo(
    () => ({ decks, createDeck, deleteDeck, addCards, gradeCard, markStudied }),
    [decks, createDeck, deleteDeck, addCards, gradeCard, markStudied],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDecks() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDecks must be used within DeckProvider')
  return ctx
}
