const MIN_EASE = 1.3
const MAX_EASE = 4.0

// Randomise intervals slightly to prevent review pile-ups on a single day.
// Applied only to mature intervals (≥ 7 days) per Anki's fuzz approach.
function fuzz(n) {
  if (n < 7) return n
  const range = Math.max(1, Math.round(n * 0.15))
  return n + Math.floor(Math.random() * (range * 2 + 1)) - range
}

export function calculateNextReview(card, quality) {
  let { interval, easeFactor, repetitions } = { ...card }

  // Cards with < 2 repetitions are still in the learning phase.
  // Ease-factor adjustments only apply once a card has graduated to review.
  const inLearning = repetitions < 2

  if (quality === 0) {
    // Again — reset to start of learning.
    // Lapsed review cards (not just learning ones) receive an ease penalty.
    interval = 1
    repetitions = 0
    if (!inLearning) {
      easeFactor = Math.max(MIN_EASE, +(easeFactor - 0.20).toFixed(2))
    }
  } else if (quality === 1) {
    // Hard — stay in learning or advance slowly; ease drops on review cards only.
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 1           // keep in learning one more day
    } else {
      interval = fuzz(Math.max(1, Math.round(interval * 1.2)))
      easeFactor = Math.max(MIN_EASE, +(easeFactor - 0.15).toFixed(2))
    }
    // repetitions intentionally NOT incremented for Hard
  } else if (quality === 2) {
    // Good — standard SM-2 graduation.  No ease change (preserves ease factor
    // and avoids the ease-hell spiral triggered by too many Hard responses).
    if (repetitions === 0) { interval = 1;  repetitions = 1 }
    else if (repetitions === 1) { interval = 6;  repetitions = 2 }
    else { interval = fuzz(Math.round(interval * easeFactor)); repetitions++ }
  } else {
    // Easy — accelerated graduation with ease boost.
    if (repetitions === 0) { interval = 4;  repetitions = 1 }
    else if (repetitions === 1) { interval = 10; repetitions = 2 }
    else { interval = fuzz(Math.round(interval * easeFactor * 1.3)); repetitions++ }
    easeFactor = Math.min(MAX_EASE, +(easeFactor + 0.15).toFixed(2))
  }

  const due = new Date()
  due.setDate(due.getDate() + interval)
  due.setHours(0, 0, 0, 0)

  return {
    interval,
    easeFactor,
    repetitions,
    dueDate: due.toISOString(),
    lastReviewed: new Date().toISOString(),
  }
}

export function isDue(card) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(card.dueDate)
  due.setHours(0, 0, 0, 0)
  return due <= today
}

export function isMastered(card) {
  return card.interval >= 21 && card.repetitions > 0
}

export function isReviewedToday(card) {
  if (!card.lastReviewed) return false
  const today = new Date()
  const rev = new Date(card.lastReviewed)
  return (
    today.getFullYear() === rev.getFullYear() &&
    today.getMonth() === rev.getMonth() &&
    today.getDate() === rev.getDate()
  )
}
