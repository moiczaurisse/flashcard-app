import { createContext, useContext, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { isDue, isReviewedToday, isMastered } from '../utils/srs'

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

// ── Provider ─────────────────────────────────
export function AppProvider({ children }) {
  const [cards, setCards]           = useLocalStorage('fc_cards', SEED_CARDS)
  const [categories, setCategories] = useLocalStorage('fc_cats',  SEED_CATS)

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

  const addCategory = useCallback((data) => {
    const cat = { id: `c${Date.now()}`, ...data }
    setCategories(prev => [...prev, cat])
    return cat
  }, [setCategories])

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
    return { total: cat.length, due: cat.filter(isDue).length }
  }, [cards])

  return (
    <Ctx.Provider value={{ cards, categories, addCard, updateCard, addCategory, getDueCards, getStats, getCatStats }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
