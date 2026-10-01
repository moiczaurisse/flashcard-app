import { useState } from 'react'
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
