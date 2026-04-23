import { useState } from 'react'
import TabBar from './components/TabBar'
import Home   from './pages/Home'
import Review from './pages/Review'
import Add    from './pages/Add'
import { useApp } from './context/AppContext'

export default function App() {
  const [tab, setTab]                   = useState('home')
  const [reviewCatId, setReviewCatId]   = useState(null)
  const { getDueCards } = useApp()

  const startReview = (catId = null) => {
    setReviewCatId(catId)
    setTab('review')
  }

  const dueCount = getDueCards().length

  return (
    <>
      {tab === 'home' && (
        <Home onReview={startReview} />
      )}

      {tab === 'review' && (
        <Review
          key={`review-${reviewCatId}`}
          categoryId={reviewCatId}
          onDone={() => { setReviewCatId(null); setTab('home') }}
        />
      )}

      {tab === 'add' && (
        <Add onSaved={() => setTab('home')} />
      )}

      <TabBar
        active={tab}
        onChange={(t) => { if (t !== 'review') setReviewCatId(null); setTab(t) }}
        dueCount={dueCount}
      />
    </>
  )
}
