import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { calculateNextReview, fmtInterval } from '../utils/srs'

export default function Review({ categoryId, onDone }) {
  const { getDueCards, updateCard, categories } = useApp()

  const [queue,         setQueue]         = useState(() => [...getDueCards(categoryId)])
  const [isFlipped,     setIsFlipped]     = useState(false)
  const [reviewed,      setReviewed]      = useState(0)
  const [sessionStats,  setSessionStats]  = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  const card     = queue[0]
  const category = card ? categories.find(c => c.id === card.categoryId) : null

  // Pre-compute next intervals for each button
  const previews = useMemo(() => {
    if (!card) return null
    return {
      again: calculateNextReview(card, 0),
      hard:  calculateNextReview(card, 1),
      good:  calculateNextReview(card, 2),
      easy:  calculateNextReview(card, 3),
    }
  }, [card])

  const rate = (quality) => {
    const updates = calculateNextReview(card, quality)
    updateCard(card.id, updates)

    const keys = ['again', 'hard', 'good', 'easy']
    setSessionStats(prev => ({ ...prev, [keys[quality]]: prev[keys[quality]] + 1 }))
    setReviewed(r => r + 1)

    setQueue(prev => {
      const rest = prev.slice(1)
      // "Again" — re-queue at the end with updated data
      return quality === 0 ? [...rest, { ...prev[0], ...updates }] : rest
    })

    setIsFlipped(false)
  }

  // ── Empty on start (nothing due) ─────────────
  if (queue.length === 0 && reviewed === 0) {
    return (
      <main className="page">
        <div className="done-screen">
          <div className="done-icon">🎉</div>
          <h2 className="done-title">Tout à jour !</h2>
          <p className="done-sub">
            Aucune carte à réviser{categoryId ? ' dans cette catégorie' : ''} aujourd'hui.
          </p>
          <button className="btn btn-primary" onClick={onDone}>Retour à l'accueil</button>
        </div>
      </main>
    )
  }

  // ── Session complete ──────────────────────────
  if (queue.length === 0) {
    return (
      <main className="page">
        <div className="done-screen">
          <div className="done-icon">✅</div>
          <h2 className="done-title">Session terminée !</h2>
          <p className="done-sub">
            {reviewed} carte{reviewed > 1 ? 's' : ''} révisée{reviewed > 1 ? 's' : ''}
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

          <button className="btn btn-primary" onClick={onDone}>Retour à l'accueil</button>
        </div>
      </main>
    )
  }

  // ── Active review ─────────────────────────────
  const total    = reviewed + queue.length
  const progress = total > 0 ? reviewed / total : 0

  return (
    <main className="page">
      {/* Progress */}
      <div className="review-header">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="review-count">{queue.length} restante{queue.length > 1 ? 's' : ''}</span>
      </div>

      {/* Category badge */}
      {category && (
        <div>
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

      {/* Flip card */}
      <div
        className="flip-wrap"
        onClick={() => !isFlipped && setIsFlipped(true)}
        role="button"
        aria-label={isFlipped ? 'Carte retournée' : 'Appuyer pour révéler la réponse'}
      >
        <div className={`flip-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flip-face">
            <div className="face-label">Question</div>
            <p className="face-text">{card.question}</p>
          </div>
          {/* Back */}
          <div className="flip-face flip-back">
            <div className="face-label">Réponse</div>
            <p className="face-text">{card.answer}</p>
          </div>
        </div>
      </div>

      {/* Hint or rating buttons */}
      {!isFlipped ? (
        <p className="flip-hint">Appuyez sur la carte pour révéler la réponse</p>
      ) : (
        <div className="rating-grid">
          <button className="rate-btn rate-again" onClick={() => rate(0)}>
            <span className="rate-label">Raté</span>
            <span className="rate-interval">{fmtInterval(previews.again.interval)}</span>
          </button>
          <button className="rate-btn rate-hard" onClick={() => rate(1)}>
            <span className="rate-label">Difficile</span>
            <span className="rate-interval">{fmtInterval(previews.hard.interval)}</span>
          </button>
          <button className="rate-btn rate-good" onClick={() => rate(2)}>
            <span className="rate-label">Bien</span>
            <span className="rate-interval">{fmtInterval(previews.good.interval)}</span>
          </button>
          <button className="rate-btn rate-easy" onClick={() => rate(3)}>
            <span className="rate-label">Facile</span>
            <span className="rate-interval">{fmtInterval(previews.easy.interval)}</span>
          </button>
        </div>
      )}
    </main>
  )
}
