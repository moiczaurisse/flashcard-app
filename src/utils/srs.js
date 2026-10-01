const MIN_EASE = 1.3
const MAX_EASE = 4.0

// Cap on the scheduling interval (days). Prevents runaway intervals from
// repeated "Easy" answers pushing a card years into the future (Anki uses
// a similar default maximum).
export const MAX_INTERVAL = 365

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

  interval = Math.min(MAX_INTERVAL, interval)

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
  // A malformed dueDate (e.g. "2026-04-24T00::00:00.000Z") parses to NaN.
  // Treat such a card as due today so it resurfaces instead of vanishing.
  if (isNaN(due.getTime())) return true
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

// One-time data repair, applied to each card on load. Returns the SAME object
// reference when nothing needs fixing, so callers can cheaply detect changes
// and avoid unnecessary writes. Fixes:
//   - malformed dueDate strings ("::" typo, or otherwise unparseable),
//   - intervals above MAX_INTERVAL (runaway "Easy" cards),
//   - absurd far-future dueDates (e.g. year 2071) pulled back to a sane horizon.
export function migrateCard(card) {
  let { dueDate, interval } = card
  let changed = false

  // Repair an unparseable dueDate.
  if (!dueDate || isNaN(Date.parse(dueDate))) {
    const repaired = String(dueDate || '').replace(/::/g, ':')
    if (repaired && !isNaN(Date.parse(repaired))) {
      dueDate = repaired
    } else {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      dueDate = d.toISOString()
    }
    changed = true
  }

  // Clamp a runaway interval.
  if (typeof interval === 'number' && interval > MAX_INTERVAL) {
    interval = MAX_INTERVAL
    changed = true
  }

  // Pull a dueDate scheduled beyond today + MAX_INTERVAL back to a sane date.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + MAX_INTERVAL)
  if (new Date(dueDate) > horizon) {
    const newDue = new Date(today)
    newDue.setDate(newDue.getDate() + Math.min(interval || 0, MAX_INTERVAL))
    newDue.setHours(0, 0, 0, 0)
    dueDate = newDue.toISOString()
    changed = true
  }

  return changed ? { ...card, dueDate, interval } : card
}

// Fisher-Yates shuffle (returns a new array, leaves the input untouched).
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Plans a progressive reschedule of the overdue backlog: spreads all currently
// due cards over the coming days, `perDay` at a time, starting today. Only the
// dueDate is affected — interval / easeFactor / repetitions are left untouched.
// Returns the plan WITHOUT mutating anything.
export function planBacklogResorb(cards, perDay = 30) {
  // Shuffle first so each day mixes categories, instead of being dominated by
  // one (cards are stored grouped by category).
  const overdue = shuffle(cards.filter(isDue))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const assignments = {}
  overdue.forEach((card, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + Math.floor(i / perDay))
    d.setHours(0, 0, 0, 0)
    assignments[card.id] = d.toISOString()
  })

  return {
    overdueCount: overdue.length,
    days: overdue.length === 0 ? 0 : Math.ceil(overdue.length / perDay),
    perDay,
    assignments,
  }
}
