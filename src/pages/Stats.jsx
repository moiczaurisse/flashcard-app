import { useApp } from '../context/AppContext'

export default function Stats() {
  const { categories, getCatStats, getStreak, totalReviewed } = useApp()
  const streak = getStreak()

  return (
    <main className="page">
      <div className="home-header">
        <h1 className="page-title">Statistiques</h1>
      </div>

      {/* Global */}
      <div className="stats-global">
        <div className="stat-global-item">
          <div className="stat-global-value">{totalReviewed}</div>
          <div className="stat-global-label">Cartes révisées</div>
        </div>
        <div className="stat-global-item">
          <div className="stat-global-icon">🔥</div>
          <div className="stat-global-value">{streak}</div>
          <div className="stat-global-label">{streak > 1 ? 'Jours consécutifs' : 'Jour consécutif'}</div>
        </div>
      </div>

      {/* Per category */}
      <p className="section-label">Par catégorie</p>

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">Aucune donnée à afficher.</p>
        </div>
      ) : (
        categories.map(cat => {
          const cs = getCatStats(cat.id)
          const pct = cs.total > 0 ? Math.round((cs.mastered / cs.total) * 100) : 0
          return (
            <div key={cat.id} className="stats-cat-card">
              <div className="stats-cat-header">
                <span className="cat-dot" style={{ background: cat.color }} />
                <span className="stats-cat-name">{cat.name}</span>
                <span className="stats-cat-pct" style={{ color: cat.color }}>{pct}%</span>
              </div>
              <div className="progress-bar stats-cat-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: cat.color }} />
              </div>
              <div className="stats-cat-grid">
                <div className="stats-cat-item">
                  <div className="stats-cat-val">{cs.total}</div>
                  <div className="stats-cat-lbl">Total</div>
                </div>
                <div className="stats-cat-item">
                  <div className="stats-cat-val" style={{ color: '#15803D' }}>{cs.mastered}</div>
                  <div className="stats-cat-lbl">Maîtrisées</div>
                </div>
                <div className="stats-cat-item">
                  <div className="stats-cat-val">{cs.total - cs.mastered}</div>
                  <div className="stats-cat-lbl">En cours</div>
                </div>
                <div className="stats-cat-item">
                  <div className="stats-cat-val" style={{ color: '#DC2626' }}>{cs.due}</div>
                  <div className="stats-cat-lbl">À réviser</div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </main>
  )
}
