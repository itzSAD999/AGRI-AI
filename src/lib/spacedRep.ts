/** Simplified SM-2 style scheduling (0–5 quality). Returns days until next review. */
export function scheduleNextReview(params: {
  quality: number
  repetitions: number
  easiness: number
  interval: number
}): { repetitions: number; easiness: number; interval: number; nextInDays: number } {
  let { repetitions, easiness, interval } = params
  const q = Math.min(5, Math.max(0, params.quality))

  if (q < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easiness)
    repetitions += 1
  }

  easiness = Math.max(
    1.3,
    easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )

  return { repetitions, easiness, interval, nextInDays: interval }
}
