import { useState, useEffect } from 'react'
import TabBar from './components/TabBar'
import Home   from './pages/Home'
import Review from './pages/Review'
import Add    from './pages/Add'
import Manage from './pages/Manage'
import Stats  from './pages/Stats'
import DailyGoal from './pages/DailyGoal'
import { useApp } from './context/AppContext'

export default function App() {
  const [tab, setTab]                 = useState('home')
  const [reviewCatId, setReviewCatId] = useState(null)
  const [reviewIsDailyGoal, setReviewIsDailyGoal] = useState(false)
  const [goalPromptDismissed, setGoalPromptDismissed] = useState(false)
  const { getDueCards, getDailyGoal } = useApp()

  const startReview = (catId = null, isDailyGoal = false) => {
    setReviewCatId(catId)
    setReviewIsDailyGoal(isDailyGoal)
    setTab('review')
  }

  const startDailyGoalReview = (goal) => {
    startReview(goal.categoryId, true)
  }

  const dueCount = getDueCards().length
  const todaysGoal = getDailyGoal()
  const showGoalPrompt = !todaysGoal && !goalPromptDismissed && tab === 'home'

  return (
    <>
      {/* ─── TEMP DEBUG (standalone iOS only) — overlay global, à retirer après screenshot ─── */}
      {navigator.standalone && <StandaloneDebug />}

      {showGoalPrompt && (
        <DailyGoal
          onStart={startDailyGoalReview}
          onSkip={() => setGoalPromptDismissed(true)}
        />
      )}
      {!showGoalPrompt && tab === 'home' && (
        <Home onReview={startReview} onStartDailyGoal={startDailyGoalReview} />
      )}
      {tab === 'review' && (
        <Review
          key={`review-${reviewCatId}-${reviewIsDailyGoal}`}
          categoryId={reviewCatId}
          dailyGoalMode={reviewIsDailyGoal}
          onDone={() => { setReviewCatId(null); setReviewIsDailyGoal(false); setTab('home') }}
        />
      )}
      {tab === 'add'    && <Add onSaved={() => setTab('home')} />}
      {tab === 'manage' && <Manage />}
      {tab === 'stats'  && <Stats />}

      <TabBar
        active={tab}
        onChange={(t) => { if (t !== 'review') { setReviewCatId(null); setReviewIsDailyGoal(false) }; setTab(t) }}
        dueCount={dueCount}
      />
    </>
  )
}

// ─── TEMP DEBUG — overlay global, à supprimer après diagnostic ───
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
      position: 'fixed',
      top: 'env(safe-area-inset-top)',
      left: 8,
      right: 8,
      zIndex: 9999,
      pointerEvents: 'none',
      fontSize: 11, lineHeight: 1.6, fontFamily: 'ui-monospace, monospace',
      color: '#fff', background: 'rgba(0,0,0,0.82)',
      borderRadius: 8, padding: '8px 10px',
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
