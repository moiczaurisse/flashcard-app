import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function DailyGoal({ onStart, onSkip }) {
  const { categories, setDailyGoal } = useApp()
  const [picking, setPicking] = useState(false)

  const pickRandom = () => {
    const goal = setDailyGoal('random')
    if (goal) onStart(goal)
  }

  const pickTheme = (catId) => {
    const goal = setDailyGoal('theme', catId)
    if (goal) onStart(goal)
  }

  return (
    <main className="page">
      <div className="home-hero">
        <div className="home-greeting-text">Objectif du jour</div>
        <div className="home-due-row">
          <div className="home-due-number">50</div>
          <div className="home-due-info">
            <div className="home-due-label">cartes à réviser aujourd'hui</div>
          </div>
        </div>
      </div>

      {!picking ? (
        <>
          <p className="section-label">Comment veux-tu choisir ton thème ?</p>

          <button
            className="review-cta"
            onClick={pickRandom}
            disabled={categories.length === 0}
          >
            🎲 Thème aléatoire (fixé pour la journée)
          </button>

          <button
            className="btn btn-secondary btn-full"
            style={{ marginBottom: 12 }}
            onClick={() => setPicking(true)}
            disabled={categories.length === 0}
          >
            Choisir un thème précis
          </button>

          <button className="btn btn-ghost btn-full" onClick={onSkip}>
            Pas aujourd'hui
          </button>
        </>
      ) : (
        <>
          <p className="section-label">Choisis un thème</p>

          {categories.map(cat => (
            <div key={cat.id} className="cat-item" onClick={() => pickTheme(cat.id)} role="button">
              <span className="cat-dot" style={{ background: cat.color }} />
              <span className="cat-name">{cat.name}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => pickTheme(cat.id)}>
                Choisir
              </button>
            </div>
          ))}

          <button className="btn btn-ghost btn-full" onClick={() => setPicking(false)} style={{ marginTop: 8 }}>
            ← Retour
          </button>
        </>
      )}
    </main>
  )
}
