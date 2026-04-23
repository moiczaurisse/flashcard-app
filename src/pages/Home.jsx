import { useApp } from '../context/AppContext'

export default function Home({ onReview }) {
  const { categories, getStats, getCatStats } = useApp()
  const stats = getStats()

  return (
    <main className="page">
      <div className="home-header">
        <p className="home-greeting">Bonne révision !</p>
        <h1 className="page-title">Flashcards</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-label">À réviser</div>
          <div className="stat-value">{stats.dueCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.totalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vues aujourd'hui</div>
          <div className="stat-value">{stats.viewedToday}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Maîtrisées</div>
          <div className="stat-value">{stats.mastered}</div>
        </div>
      </div>

      {/* CTA */}
      {stats.dueCount > 0 ? (
        <button className="review-cta" onClick={() => onReview(null)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Réviser tout · {stats.dueCount} carte{stats.dueCount > 1 ? 's' : ''}
        </button>
      ) : (
        <div className="review-cta disabled">
          ✓ Tout à jour !
        </div>
      )}

      {/* Categories */}
      <p className="section-label">Catégories</p>

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <p className="empty-state-text">Aucune catégorie.<br/>Créez votre première carte !</p>
        </div>
      ) : (
        categories.map(cat => {
          const cs = getCatStats(cat.id)
          return (
            <div key={cat.id} className="cat-item">
              <span className="cat-dot" style={{ background: cat.color }} />
              <span className="cat-name">{cat.name}</span>
              {cs.due > 0 && (
                <span
                  className="cat-due"
                  style={{ background: cat.color + '22', color: cat.color }}
                >
                  {cs.due}
                </span>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onReview(cat.id)}
                disabled={cs.due === 0}
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
