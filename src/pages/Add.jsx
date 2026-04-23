import { useState } from 'react'
import { useApp } from '../context/AppContext'

const PALETTE = [
  '#534AB7', '#E879A0', '#14B8A6', '#F97316',
  '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B',
  '#06B6D4', '#84CC16', '#EC4899', '#10B981',
]

export default function Add() {
  const { categories, addCard, addCategory } = useApp()

  const [catId,       setCatId]       = useState(() => categories[0]?.id ?? '')
  const [question,    setQuestion]    = useState('')
  const [answer,      setAnswer]      = useState('')
  const [showNewCat,  setShowNewCat]  = useState(categories.length === 0)
  const [newName,     setNewName]     = useState('')
  const [newColor,    setNewColor]    = useState(PALETTE[0])
  const [toastMsg,    setToastMsg]    = useState('')
  const [toastVis,    setToastVis]    = useState(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVis(true)
    setTimeout(() => setToastVis(false), 2200)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim() || !catId) return
    addCard({ categoryId: catId, question: question.trim(), answer: answer.trim() })
    setQuestion('')
    setAnswer('')
    showToast('✓ Carte ajoutée !')
  }

  const handleCreateCat = () => {
    if (!newName.trim()) return
    const cat = addCategory({ name: newName.trim(), color: newColor })
    setCatId(cat.id)
    setNewName('')
    setNewColor(PALETTE[0])
    setShowNewCat(false)
    showToast('✓ Catégorie créée !')
  }

  return (
    <main className="page">
      <div className="home-header">
        <h1 className="page-title">Nouvelle carte</h1>
      </div>

      <form onSubmit={handleSave}>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Catégorie</label>
          {categories.length > 0 && (
            <div className="select-wrap">
              <select
                className="form-select"
                value={catId}
                onChange={e => setCatId(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: 8 }}
            onClick={() => setShowNewCat(v => !v)}
          >
            {showNewCat ? '✕ Annuler' : '+ Nouvelle catégorie'}
          </button>

          {showNewCat && (
            <div className="new-cat-panel">
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Nom</label>
                <input
                  className="form-input"
                  placeholder="ex : Maths, Biologie…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateCat())}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Couleur</label>
                <div className="color-picker">
                  {PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-swatch ${newColor === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewColor(color)}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCreateCat}
                disabled={!newName.trim()}
              >
                Créer la catégorie
              </button>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="form-group">
          <label className="form-label">Question</label>
          <textarea
            className="form-textarea"
            placeholder="Entrez votre question…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={3}
          />
        </div>

        {/* Answer */}
        <div className="form-group">
          <label className="form-label">Réponse</label>
          <textarea
            className="form-textarea"
            placeholder="Entrez la réponse…"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={!question.trim() || !answer.trim() || !catId}
        >
          Ajouter la carte
        </button>
      </form>

      {/* Toast */}
      <div className={`toast ${toastVis ? 'show' : ''}`}>{toastMsg}</div>
    </main>
  )
}
