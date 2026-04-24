import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateNextReview, isDue } from '../utils/srs'

const SESSION_LIMIT = 10

function fisherYates(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildInterleavedQueue(cards) {
  const shuffled = fisherYates(cards)
  for (let i = 2; i < shuffled.length; i++) {
    if (
      shuffled[i].categoryId === shuffled[i - 1].categoryId &&
      shuffled[i].categoryId === shuffled[i - 2].categoryId
    ) {
      let swapIdx = -1
      for (let j = i + 1; j < shuffled.length; j++) {
        if (shuffled[j].categoryId !== shuffled[i].categoryId) {
          swapIdx = j
          break
        }
      }
      if (swapIdx !== -1) {
        ;[shuffled[i], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i]]
      }
    }
  }
  return shuffled
}

// Due cards first (oldest overdue first), then future cards (soonest first).
// Never leaves any card unreachable — the whole deck is always accessible.
function buildSessionQueue(allCards) {
  const due = allCards
    .filter(isDue)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const future = allCards
    .filter(c => !isDue(c))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  return buildInterleavedQueue([...due, ...future].slice(0, SESSION_LIMIT))
}

function FlipCard({ card, onRate }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <>
      <div
        className="flip-wrap"
        onClick={() => !flipped && setFlipped(true)}
        role="button"
        aria-label={flipped ? 'Réponse affichée' : 'Révéler la réponse'}
      >
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-face">
            <div className="face-label">Question</div>
            <p className="face-text">{card.question}</p>
          </div>
          <div className="flip-face flip-back">
            <div className="face-label">Réponse</div>
            <p className="face-text">{card.answer}</p>
          </div>
        </div>
      </div>

      {!flipped ? (
        <p className="flip-hint">Appuyez sur la carte pour révéler la réponse</p>
      ) : (
        <div className="rating-grid">
          <button className="rate-btn rate-again" onClick={() => onRate(0)}>
            <span className="rate-label">Raté</span>
          </button>
          <button className="rate-btn rate-hard" onClick={() => onRate(1)}>
            <span className="rate-label">Difficile</span>
          </button>
          <button className="rate-btn rate-good" onClick={() => onRate(2)}>
            <span className="rate-label">Bien</span>
          </button>
          <button className="rate-btn rate-easy" onClick={() => onRate(3)}>
            <span className="rate-label">Facile</span>
          </button>
        </div>
      )}
    </>
  )
}

export default function Review({ categoryId, onDone }) {
  const { cards, updateCard, categories, recordCardReview } = useApp()

  const getCatCards = () =>
    cards.filter(c => (categoryId ? c.categoryId === categoryId : true))

  const [queue, setQueue] = useState(() => buildSessionQueue(getCatCards()))
  const [reviewed, setReviewed] = useState(0)
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  const card = queue[0]
  const category = card ? categories.find(c => c.id === card.categoryId) : null
  const sessionSize = reviewed + queue.length

  const startNewSession = () => {
    setQueue(buildSessionQueue(getCatCards()))
    setReviewed(0)
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 })
  }

  const rate = (quality) => {
    // Always update the card scheduling, then always advance to next card.
    // The rating affects when this card reappears, not the current session flow.
    updateCard(card.id, calculateNextReview(card, quality))
    recordCardReview()

    const keys = ['again', 'hard', 'good', 'easy']
    setSessionStats(prev => ({ ...prev, [keys[quality]]: prev[keys[quality]] + 1 }))
    setReviewed(r => r + 1)
    setQueue(prev => prev.slice(1))
  }

  // ── Session complete ──────────────────────────
  if (queue.length === 0) {
    return (
      <main className="review-page">
        <div className="done-screen">
          <div className="done-icon">✅</div>
          <h2 className="done-title">Session terminée !</h2>
          <p className="done-sub">
            {reviewed} carte{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''} dans cette session.
          </p>
          {reviewed > 0 && (
            <div className="done-stats">
              {sessionStats.again > 0 && (
                <div className="done-stat">
                  <span className="done-stat-val" style={{ color: '#DC2626' }}>{sessionStats.again}</span>
                  <span className="done-stat-lbl">Raté</span>
                </div>
              )}
              {sessionStats.hard > 0 && (
                <div className="done-stat">
                  <span className="done-stat-val" style={{ color: '#B45309' }}>{sessionStats.hard}</span>
                  <span className="done-stat-lbl">Difficile</span>
                </div>
              )}
              {sessionStats.good > 0 && (
                <div className="done-stat">
                  <span className="done-stat-val" style={{ color: '#15803D' }}>{sessionStats.good}</span>
                  <span className="done-stat-lbl">Bien</span>
                </div>
              )}
              {sessionStats.easy > 0 && (
                <div className="done-stat">
                  <span className="done-stat-val" style={{ color: '#1D4ED8' }}>{sessionStats.easy}</span>
                  <span className="done-stat-lbl">Facile</span>
                </div>
              )}
            </div>
          )}
          <div className="done-actions">
            <button className="btn btn-secondary btn-full" onClick={startNewSession}>
              Nouvelle session
            </button>
            <button className="btn btn-ghost btn-full" onClick={onDone}>Retour à l'accueil</button>
          </div>
        </div>
      </main>
    )
  }

  // ── Active review ─────────────────────────────
  const progress = reviewed / sessionSize

  return (
    <main className="review-page">
      <div className="review-header">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="review-count">{reviewed + 1} / {sessionSize}</span>
      </div>

      {category && (
        <div className="review-badges">
          <span
            className="cat-badge"
            style={{ background: category.color + '20', color: category.color }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: category.color, display: 'inline-block',
            }} />
            {category.name}
          </span>
        </div>
      )}

      <FlipCard key={reviewed} card={card} onRate={rate} />
    </main>
  )
}
