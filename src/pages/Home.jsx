import { useEffect, useState } from 'react'
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
      {/* ─── TEMP DEBUG (standalone iOS only) — à retirer après screenshot ─── */}
      {navigator.standalone && <StandaloneDebug />}

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

// ─── TEMP DEBUG — à supprimer après diagnostic ───────────────────
function StandaloneDebug() {
  const [d, setD] = useState(null)

  useEffect(() => {
    const read = () => {
      // env(safe-area-inset-*) lus via une sonde cachée (padding = env(...)).
      const probe = document.createElement('div')
      probe.style.cssText =
        'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);'
      document.body.appendChild(probe)
      const pcs = getComputedStyle(probe)
      const sat = pcs.paddingTop
      const sab = pcs.paddingBottom
      probe.remove()

      const tab = document.querySelector('.tab-bar')
      const r = tab?.getBoundingClientRect()
      const cs = tab ? getComputedStyle(tab) : null
      setD({
        innerH: window.innerHeight,
        screenH: window.screen.height,
        vvH: window.visualViewport ? Math.round(window.visualViewport.height) : 'n/a',
        sat,
        sab,
        rectTop: r ? Math.round(r.top) : 'n/a',
        rectBottom: r ? Math.round(r.bottom) : 'n/a',
        cssPos: cs?.position ?? 'n/a',
        cssHeight: cs?.height ?? 'n/a',
        cssBottom: cs?.bottom ?? 'n/a',
        cssPadB: cs?.paddingBottom ?? 'n/a',
      })
    }
    const id = requestAnimationFrame(read)
    window.addEventListener('resize', read)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', read) }
  }, [])

  if (!d) return null
  const Row = ({ k, v }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span>{k}</span><b>{v}</b>
    </div>
  )
  return (
    <div style={{
      fontSize: 11, lineHeight: 1.6, fontFamily: 'ui-monospace, monospace',
      color: 'var(--text)', background: 'var(--surface-2)',
      border: '1px solid var(--border)', borderRadius: 8,
      padding: '10px 12px', marginBottom: 16,
    }}>
      <Row k="innerHeight" v={d.innerH} />
      <Row k="screen.height" v={d.screenH} />
      <Row k="visualViewport.h" v={d.vvH} />
      <Row k="safe-area top" v={d.sat} />
      <Row k="safe-area bottom" v={d.sab} />
      <Row k="tab rect.top" v={d.rectTop} />
      <Row k="tab rect.bottom" v={d.rectBottom} />
      <Row k="tab css position" v={d.cssPos} />
      <Row k="tab css height" v={d.cssHeight} />
      <Row k="tab css bottom" v={d.cssBottom} />
      <Row k="tab css padBottom" v={d.cssPadB} />
    </div>
  )
}
