export function calculateNextReview(card, quality) {
  let { interval, easeFactor, repetitions } = { ...card }

  if (quality === 0) {
    // Again — reset, re-show tomorrow
    repetitions = 0
    interval = 1
  } else if (quality === 1) {
    // Hard — small bump, ease drops
    interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2))
    easeFactor = Math.max(1.3, +(easeFactor - 0.15).toFixed(2))
  } else if (quality === 2) {
    // Good — standard SM-2
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions++
  } else {
    // Easy — accelerated, ease rises
    if (repetitions === 0) interval = 4
    else if (repetitions === 1) interval = 10
    else interval = Math.round(interval * easeFactor * 1.3)
    easeFactor = Math.min(4.0, +(easeFactor + 0.15).toFixed(2))
    repetitions++
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

export function fmtInterval(days) {
  if (days <= 0) return '<1j'
  if (days === 1) return '1j'
  if (days < 30) return `${days}j`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}a`
}
