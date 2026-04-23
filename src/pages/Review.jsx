import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateNextReview } from '../utils/srs'

const SESSION_LIMIT = 20

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
  const { getDueCards, updateCard, categories, cards, recordCardReview } = useApp()

  const [sessionInfo] = useState(() => {
    const due = getDueCards(categoryId)
    const totalDue = due.length
    const sessionSize = Math.min(totalDue, SESSION_LIMIT)
    const totalSessions = Math.ceil(totalDue / SESSION_LIMIT) || 1
    return { totalDue, sessionSize, totalSessions }
  })

  const [queue, setQueue] = useState(() => {
    const due = getDueCards(categoryId)
    const sorted = [...due].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    return buildInterleavedQueue(sorted.slice(0, SESSION_LIMIT))
  })
  const [reviewed, setReviewed] = useState(0)
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })
  const [freeMode, setFreeMode] = useState(false)

  const card = queue[0]
  const category = card ? categories.find(c => c.id === card.categoryId) : null
  const allCards = cards.filter(c => categoryId ? c.categoryId === categoryId : true)

  const startFreeSession = () => {
    setQueue(buildInterleavedQueue(allCards))
    setReviewed(0)
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 })
    setFreeMode(true)
  }

  const rate = (quality) => {
    let updates = null
    if (!freeMode) {
      updates = calculateNextReview(card, quality)
      updateCard(card.id, updates)
    }
    recordCardReview()

    const keys = ['again', 'hard', 'good', 'easy']
    setSessionStats(prev => ({ ...prev, [keys[quality]]: prev[keys[quality]] + 1 }))
    setReviewed(r => r + 1)

    setQueue(prev => {
      const rest = prev.slice(1)
      if (quality === 0) {
        const updatedCard = updates ? { ...prev[0], ...updates } : prev[0]
        if (rest.length === 0) return [updatedCard]
        // Insert in the latter half of the remaining queue
        const minPos = Math.max(1, Math.ceil(rest.length * 0.5))
        const insertAt = minPos + Math.floor(Math.random() * (rest.length - minPos + 1))
        return [...rest.slice(0, insertAt), updatedCard, ...rest.slice(insertAt)]
      }
      return rest
    })
  }

  // ── Done / nothing due (SRS mode) ─────────────
  if (queue.length === 0 && !freeMode) {
    return (
      <main className="review-page">
        <div className="done-screen">
          <div className="done-icon">{reviewed === 0 ? '✨' : '✅'}</div>
          <h2 className="done-title">Tu es à jour !</h2>

          {reviewed > 0 ? (
            <>
              <p className="done-sub">
                {reviewed} carte{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''} dans cette session.
              </p>
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
            </>
          ) : (
            <p className="done-sub">
              Toutes les cartes{categoryId ? ' de cette catégorie' : ''} sont à jour.
            </p>
          )}

          <div className="done-actions">
            {allCards.length > 0 && (
              <button className="btn btn-secondary btn-full" onClick={startFreeSession}>
                Réviser quand même
              </button>
            )}
            <button className="btn btn-ghost btn-full" onClick={onDone}>Retour à l'accueil</button>
          </div>
        </div>
      </main>
    )
  }

  // ── Free session complete ─────────────────────
  if (queue.length === 0 && freeMode) {
    return (
      <main className="review-page">
        <div className="done-screen">
          <div className="done-icon">🎉</div>
          <h2 className="done-title">Bien joué !</h2>
          <p className="done-sub">
            {reviewed} carte{reviewed > 1 ? 's' : ''} passée{reviewed > 1 ? 's' : ''} en revue.
          </p>
          <button className="btn btn-primary btn-full" style={{ maxWidth: 280 }} onClick={onDone}>
            Retour à l'accueil
          </button>
        </div>
      </main>
    )
  }

  // ── Active review ─────────────────────────────
  const progress = reviewed / (reviewed + queue.length)

  return (
    <main className="review-page">
      <div className="review-header">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="review-count">{queue.length} restante{queue.length > 1 ? 's' : ''}</span>
      </div>

      {!freeMode && (
        <div className="session-info">
          Session 1/{sessionInfo.totalSessions} · {sessionInfo.sessionSize} carte{sessionInfo.sessionSize > 1 ? 's' : ''}
        </div>
      )}

      {(category || freeMode) && (
        <div className="review-badges">
          {category && (
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
          )}
          {freeMode && (
            <span className="free-badge">Révision libre</span>
          )}
        </div>
      )}

      <FlipCard key={reviewed} card={card} onRate={rate} />
    </main>
  )
}
