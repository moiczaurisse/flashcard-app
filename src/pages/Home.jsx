import { useApp } from '../context/AppContext'

export default function Home({ onReview, onStartDailyGoal }) {
  const { categories, getStats, getCatStats, getDailyGoal } = useApp()
  const stats = getStats()
  const goal = getDailyGoal()
  const goalCategory = goal ? categories.find(c => c.id === goal.categoryId) : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <main className="page">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-greeting-text">{greeting}, Loïc !</div>
        <div className="home-due-row">
          <div className="home-due-number">{stats.dueCount}</div>
          <div className="home-due-info">
            <div className="home-due-label">
              carte{stats.dueCount !== 1 ? 's' : ''} à réviser
            </div>
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
    </main>
  )
}
