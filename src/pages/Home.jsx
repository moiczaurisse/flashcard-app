import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import Confetti from '../components/Confetti'

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fmtDay = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

// Intensity level (0–4) for the heatmap, based on cards reviewed that day.
function level(count) {
  if (!count) return 0
  if (count < 5) return 1
  if (count < 15) return 2
  if (count < 30) return 3
  return 4
}

// Builds the last `weeks` Monday-aligned columns of 7 days each.
function buildHeatmap(weeks = 12) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mondayOffset = (today.getDay() + 6) % 7
  const start = new Date(today)
  start.setDate(today.getDate() - mondayOffset - (weeks - 1) * 7)

  const cols = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      col.push(date)
    }
    cols.push(col)
  }
  return { cols, today }
}

function ProgressRing({ value, target }) {
  const r = 32
  const c = 2 * Math.PI * r
  const pct = target > 0 ? Math.min(1, value / target) : 0
  return (
    <div className="ring-wrap">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle className="ring-track" cx="38" cy="38" r={r} fill="none" />
        <circle
          className="ring-fill"
          cx="38" cy="38" r={r} fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 38 38)"
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value">{value}</span>
        <span className="ring-target">/ {target}</span>
      </div>
    </div>
  )
}

export default function Home({ onReview, onStartDailyGoal }) {
  const { categories, getStats, getCatStats, getDailyGoal, reviewLog, getStreak } = useApp()
  const stats = getStats()
  const goal = getDailyGoal()
  const goalCategory = goal ? categories.find(c => c.id === goal.categoryId) : null

  const [selectedDay, setSelectedDay] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const streak = getStreak()
  const todayReviewed = reviewLog[dayKey(new Date())]?.reviewed || 0
  const ringValue = goal ? goal.count : todayReviewed
  const ringTarget = goal ? goal.target : 50

  let motivation
  if (goal && goal.count >= goal.target) motivation = 'Objectif du jour atteint ! 🎉'
  else if (ringValue === 0) motivation = stats.dueCount > 0 ? 'Prêt à réviser ?' : 'Rien à réviser, profite !'
  else if (streak >= 7) motivation = `En feu ! ${streak} jours d'affilée 🔥`
  else if (goal) motivation = 'Continue, tu y es presque !'
  else motivation = 'Beau travail, continue comme ça !'

  // Confetti once per day, the first time Home is seen with the goal reached.
  useEffect(() => {
    if (goal && goal.count >= goal.target && localStorage.getItem('fc_goal_celebrated') !== goal.date) {
      localStorage.setItem('fc_goal_celebrated', goal.date)
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 1600)
      return () => clearTimeout(t)
    }
  }, [goal])

  const { cols, today } = buildHeatmap(12)

  return (
    <main className="page">
      {/* Hero */}
      <div className="home-hero">
        {showConfetti && <Confetti />}
        <div className="home-hero-top">
          <span className="home-greeting-text">{greeting}, Loïc !</span>
        </div>
        <div className="home-hero-main">
          <ProgressRing value={ringValue} target={ringTarget} />
          <div className="home-hero-info">
            <div className="home-due-number">{stats.dueCount}</div>
            <div className="home-due-label">
              carte{stats.dueCount !== 1 ? 's' : ''} à réviser
            </div>
            <div className="home-motivation">{motivation}</div>
          </div>
        </div>
        <div className="hero-tiles">
          <div className="hero-tile">
            <span className="hero-tile-value">🔥 {streak}</span>
            <span className="hero-tile-label">jour{streak > 1 ? 's' : ''} de suite</span>
          </div>
          <div className="hero-tile">
            <span className="hero-tile-value">{todayReviewed}</span>
            <span className="hero-tile-label">révisée{todayReviewed > 1 ? 's' : ''} aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* Daily goal progress */}
      {goal && (
        <div className="cat-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {goalCategory && <span className="cat-dot" style={{ background: goalCategory.color }} />}
            <span className="cat-name">
              Objectif du jour{goalCategory ? ` · ${goalCategory.name}` : ''}
            </span>
            <span className="review-count">{goal.count} / {goal.target}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (goal.count / goal.target) * 100)}%` }}
            />
          </div>
          {goal.count < goal.target && (
            <button
              className="btn btn-secondary btn-full"
              onClick={() => onStartDailyGoal(goal)}
            >
              Continuer l'objectif
            </button>
          )}
        </div>
      )}

      {/* CTA */}
      {stats.totalCount > 0 ? (
        <button className="review-cta" onClick={() => onReview(null)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          {stats.dueCount > 0
            ? `Réviser · ${stats.dueCount} à faire`
            : 'Réviser · tout à jour'
          }
        </button>
      ) : (
        <div className="review-cta disabled">
          Ajoutez des cartes pour commencer
        </div>
      )}

      {/* Categories */}
      <p className="section-label">Catégories</p>

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <p className="empty-state-text">Aucune catégorie.<br />Créez votre première carte !</p>
        </div>
      ) : (
        categories.map(cat => {
          const cs = getCatStats(cat.id)
          return (
            <div key={cat.id} className="cat-item">
              <span className="cat-dot" style={{ background: cat.color }} />
              <span className="cat-name">{cat.name}</span>
              {cs.due > 0 && (
                <span className="cat-due" style={{ background: cat.color + '22', color: cat.color }}>
                  {cs.due}
                </span>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onReview(cat.id)}
                disabled={cs.total === 0}
              >
                Réviser
              </button>
            </div>
          )
        })
      )}

      {/* Activity heatmap */}
      <p className="section-label" style={{ marginTop: 28 }}>Activité · 12 semaines</p>
      <div className="heatmap">
        <div className="heatmap-grid">
          {cols.map((col, wi) => (
            <div className="hm-col" key={wi}>
              {col.map((date, di) => {
                const future = date > today
                const count = reviewLog[dayKey(date)]?.reviewed || 0
                return (
                  <button
                    key={di}
                    className={`hm-cell lvl-${level(count)}${future ? ' hm-future' : ''}`}
                    disabled={future}
                    onClick={() => setSelectedDay({ date, count })}
                    aria-label={`${count} carte(s) le ${fmtDay(date)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="heatmap-footer">
          <span className="heatmap-selected">
            {selectedDay
              ? (selectedDay.count > 0
                  ? `${selectedDay.count} carte${selectedDay.count > 1 ? 's' : ''} le ${fmtDay(selectedDay.date)}`
                  : `Aucune révision le ${fmtDay(selectedDay.date)}`)
              : 'Appuie sur un jour'}
          </span>
          <span className="heatmap-legend">
            Moins
            <i className="hm-cell lvl-0" /><i className="hm-cell lvl-1" /><i className="hm-cell lvl-2" /><i className="hm-cell lvl-3" /><i className="hm-cell lvl-4" />
            Plus
          </span>
        </div>
      </div>
    </main>
  )
}
