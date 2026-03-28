export type CardType = 'flashcard' | 'mcq' | 'fill_blank'
export type StudyMode = 'flashcard' | 'fill_blank' | 'mcq' | 'mixed'

export type Card = {
  id: string
  type: CardType
  front: string
  back: string
  options?: string[]
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewAt: number
  lastReviewedAt?: number
}

export type Deck = {
  id: string
  title: string
  subject: string
  level: 'BECE' | 'WASSCE'
  description?: string
  sourceMaterial?: string
  cards: Card[]
  createdAt: number
  lastStudiedAt?: number
}

export function newCard(
  partial: Pick<Card, 'type' | 'front' | 'back'> & { options?: string[] },
): Card {
  return {
    id: crypto.randomUUID(),
    ...partial,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: 0,
  }
}

export function getDueCards(deck: Deck): Card[] {
  const now = Date.now()
  return deck.cards
    .filter((c) => c.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
}

export function deckMastery(deck: Deck): number {
  if (deck.cards.length === 0) return 0
  const mastered = deck.cards.filter((c) => c.repetitions >= 3).length
  return Math.round((mastered / deck.cards.length) * 100)
}
