export default function TabBar({ active, onChange, dueCount }) {
  return (
    <nav className="tab-bar">
      <button className={`tab-item ${active === 'home' ? 'active' : ''}`} onClick={() => onChange('home')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Accueil
      </button>

      <button className={`tab-item ${active === 'review' ? 'active' : ''}`} onClick={() => onChange('review')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="15" rx="2"/>
          <path d="M8 10h8M8 14h5"/>
        </svg>
        {dueCount > 0 && (
          <span className="tab-badge">{dueCount > 99 ? '99+' : dueCount}</span>
        )}
        Réviser
      </button>

      <button className={`tab-item ${active === 'add' ? 'active' : ''}`} onClick={() => onChange('add')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Ajouter
      </button>

      <button className={`tab-item ${active === 'manage' ? 'active' : ''}`} onClick={() => onChange('manage')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="m18.5 2.5 3 3L12 15H9v-3z"/>
        </svg>
        Gérer
      </button>

      <button className={`tab-item ${active === 'stats' ? 'active' : ''}`} onClick={() => onChange('stats')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        Stats
      </button>
    </nav>
  )
}
