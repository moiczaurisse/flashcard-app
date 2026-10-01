const COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#3B82F6', '#F59E0B', '#84CC16', '#A855F7']

// Burst de confettis en CSS pur (aucune dépendance). Ne rend rien si
// l'utilisateur préfère moins d'animations (prefers-reduced-motion).
export default function Confetti({ count = 24 }) {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return null
  }

  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360 + Math.random() * 12
        const dist = 70 + Math.random() * 90
        const rad = (angle * Math.PI) / 180
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              '--tx': `${Math.cos(rad) * dist}px`,
              '--ty': `${Math.sin(rad) * dist}px`,
              '--rot': `${Math.random() * 720 - 360}deg`,
              '--delay': `${Math.random() * 0.12}s`,
              background: COLORS[i % COLORS.length],
            }}
          />
        )
      })}
    </div>
  )
}
