import { createContext, useContext, useCallback, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { isDue, isReviewedToday, isMastered, migrateCard, planBacklogResorb } from '../utils/srs'

const Ctx = createContext(null)

// ── Seed data ────────────────────────────────
function makeCard(id, catId, q, a, daysOffset = 0, interval = 0, reps = 0) {
  const due = new Date()
  due.setDate(due.getDate() + daysOffset)
  due.setHours(0, 0, 0, 0)
  return {
    id,
    categoryId: catId,
    question: q,
    answer: a,
    interval,
    easeFactor: 2.5,
    repetitions: reps,
    dueDate: due.toISOString(),
    lastReviewed: null,
    createdAt: new Date().toISOString(),
  }
}

const SEED_CATS = [
  { id: 'c1', name: 'Français',    color: '#534AB7' },
  { id: 'c2', name: 'Histoire',    color: '#E879A0' },
  { id: 'c3', name: 'Géographie',  color: '#14B8A6' },
]

const SEED_CARDS = [
  makeCard('k1', 'c1', "Que signifie « ubiquité » ?",
    "La capacité d'être présent partout à la fois."),
  makeCard('k2', 'c1', "Donnez un synonyme d'« indigent ».",
    "Pauvre, démuni, nécessiteux."),
  makeCard('k3', 'c1', "Définissez « épistémologie ».",
    "Branche de la philosophie étudiant la nature et les fondements de la connaissance.",
    4, 4, 2),
  makeCard('k4', 'c2', "En quelle année a eu lieu la prise de la Bastille ?",
    "14 juillet 1789."),
  makeCard('k5', 'c2', "Qui était Vercingétorix ?",
    "Chef arverne qui unifia les Gaulois contre César. Vaincu à Alésia en 52 av. J.-C.",
    30, 30, 6),
  makeCard('k6', 'c3', "Quelle est la capitale de l'Australie ?",
    "Canberra (et non Sydney ou Melbourne !)."),
  makeCard('k7', 'c3', "Combien de pays composent l'Union européenne ?",
    "27 pays (depuis le Brexit en 2020)."),
]

// ── Daily goal helpers ───────────────────────
const DAILY_GOAL_TARGET = 50

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Provider ─────────────────────────────────
export function AppProvider({ children }) {
  const [cards, setCards]               = useLocalStorage('fc_cards', SEED_CARDS)
  const [categories, setCategories]     = useLocalStorage('fc_cats',  SEED_CATS)
  const [totalReviewed, setTotalReviewed] = useLocalStorage('fc_total_reviewed', 0)
  const [dailyGoal, setDailyGoalRaw]    = useLocalStorage('fc_daily_goal', null)
  // Journal d'activité par jour : { "YYYY-MM-DD": { reviewed, good } }
  const [reviewLog, setReviewLog]       = useLocalStorage('fc_review_log', {})

  // One-time data repair on load: fix malformed dueDates, clamp runaway
  // intervals, pull absurd far-future dueDates back. Only writes if something
  // actually changed (migrateCard returns the same ref otherwise), so this is
  // idempotent and safe under StrictMode's double-invoke.
  useEffect(() => {
    if (cards.some(c => migrateCard(c) !== c)) {
      setCards(prev => prev.map(migrateCard))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addCard = useCallback((data) => {
    const card = {
      id: `k${Date.now()}`,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: new Date().toISOString(),
      lastReviewed: null,
      createdAt: new Date().toISOString(),
      ...data,
    }
    setCards(prev => [...prev, card])
    return card
  }, [setCards])

  const updateCard = useCallback((id, updates) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [setCards])

  const deleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id !== id))
  }, [setCards])

  const deleteCards = useCallback((ids) => {
    const set = new Set(ids)
    setCards(prev => prev.filter(c => !set.has(c.id)))
  }, [setCards])

  // Spreads the overdue backlog over the coming days (perDay at a time),
  // changing only dueDate. Returns the plan so the caller can report numbers.
  const resorbBacklog = useCallback((perDay = 30) => {
    const plan = planBacklogResorb(cards, perDay)
    if (plan.overdueCount > 0) {
      setCards(prev => prev.map(c =>
        plan.assignments[c.id] ? { ...c, dueDate: plan.assignments[c.id] } : c
      ))
    }
    return plan
  }, [cards, setCards])

  const addCategory = useCallback((data) => {
    const cat = { id: `c${Date.now()}`, ...data }
    setCategories(prev => [...prev, cat])
    return cat
  }, [setCategories])

  const updateCategory = useCallback((id, updates) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [setCategories])

  const deleteCategory = useCallback((id, { moveTo = null } = {}) => {
    if (moveTo) {
      setCards(prev => prev.map(c => c.categoryId === id ? { ...c, categoryId: moveTo } : c))
    } else {
      setCards(prev => prev.filter(c => c.categoryId !== id))
    }
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [setCards, setCategories])

  const mergeCategories = useCallback((sourceId, targetId) => {
    setCards(prev => prev.map(c => c.categoryId === sourceId ? { ...c, categoryId: targetId } : c))
    setCategories(prev => prev.filter(c => c.id !== sourceId))
  }, [setCards, setCategories])

  const importData = useCallback((data) => {
    if (data.categories && Array.isArray(data.categories)) {
      setCategories(prev => {
        const existing = new Set(prev.map(c => c.id))
        const newCats = data.categories.filter(c => !existing.has(c.id))
        return [...prev, ...newCats]
      })
    }
    if (data.cards && Array.isArray(data.cards)) {
      setCards(prev => {
        const existing = new Set(prev.map(c => c.id))
        const newCards = data.cards.filter(c => !existing.has(c.id))
        return [...prev, ...newCards]
      })
    }
  }, [setCards, setCategories])

  // Returns today's goal, or null if none was set / it's stale (different day).
  const getDailyGoal = useCallback(() => {
    if (!dailyGoal || dailyGoal.date !== todayKey()) return null
    return dailyGoal
  }, [dailyGoal])

  // mode: 'theme' (fixed categoryId) or 'random' (a category picked once and locked for the day).
  const setDailyGoal = useCallback((mode, categoryId = null) => {
    let catId = categoryId
    if (mode === 'random') {
      if (categories.length === 0) return null
      catId = categories[Math.floor(Math.random() * categories.length)].id
    }
    const goal = {
      date: todayKey(),
      mode,
      categoryId: catId,
      target: DAILY_GOAL_TARGET,
      count: 0,
    }
    setDailyGoalRaw(goal)
    return goal
  }, [categories, setDailyGoalRaw])

  const clearDailyGoal = useCallback(() => {
    setDailyGoalRaw(null)
  }, [setDailyGoalRaw])

  const recordCardReview = useCallback((categoryId = null, quality = null) => {
    setTotalReviewed(prev => prev + 1)
    const key = todayKey()
    setReviewLog(prev => {
      const day = prev[key] || { reviewed: 0, good: 0 }
      return {
        ...prev,
        [key]: {
          reviewed: day.reviewed + 1,
          good: day.good + (quality >= 2 ? 1 : 0),
        },
      }
    })
    setDailyGoalRaw(prev => {
      if (!prev || prev.date !== todayKey()) return prev
      if (prev.categoryId && categoryId && prev.categoryId !== categoryId) return prev
      return { ...prev, count: Math.min(prev.target, prev.count + 1) }
    })
  }, [setTotalReviewed, setReviewLog, setDailyGoalRaw])

  // Jours consécutifs avec ≥ 1 révision. Tolère qu'aujourd'hui soit encore
  // vide : la série qui se termine hier reste valable (grâce d'un jour).
  const getStreak = useCallback(() => {
    const has = (d) => {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return (reviewLog[k]?.reviewed || 0) > 0
    }
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    if (!has(cursor)) {
      cursor.setDate(cursor.getDate() - 1)
      if (!has(cursor)) return 0
    }
    let streak = 0
    while (has(cursor)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }, [reviewLog])

  const getDueCards = useCallback((catId = null) => {
    return cards.filter(c => {
      if (catId && c.categoryId !== catId) return false
      return isDue(c)
    })
  }, [cards])

  const getStats = useCallback(() => ({
    dueCount:    cards.filter(isDue).length,
    totalCount:  cards.length,
    viewedToday: cards.filter(isReviewedToday).length,
    mastered:    cards.filter(isMastered).length,
  }), [cards])

  const getCatStats = useCallback((catId) => {
    const cat = cards.filter(c => c.categoryId === catId)
    return {
      total:    cat.length,
      due:      cat.filter(isDue).length,
      mastered: cat.filter(isMastered).length,
      learning: cat.filter(c => !isMastered(c)).length,
    }
  }, [cards])

  return (
    <Ctx.Provider value={{
      cards, categories,
      addCard, updateCard, deleteCard, deleteCards, addCategory,
      updateCategory, deleteCategory, mergeCategories,
      getDueCards, getStats, getCatStats,
      recordCardReview, totalReviewed,
      reviewLog, getStreak,
      importData, resorbBacklog,
      getDailyGoal, setDailyGoal, clearDailyGoal,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
