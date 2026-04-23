import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'

export default function Manage() {
  const { cards, categories, deleteCard, updateCard, importData } = useApp()
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [editCard, setEditCard] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleExport = () => {
    const data = JSON.stringify({ cards, categories }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flashcards-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.cards && !data.categories) throw new Error('Format invalide')
        importData(data)
        const count = (data.cards || []).length
        showToast(`${count} carte${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''}`)
      } catch {
        showToast('Fichier invalide')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const grouped = categories
    .map(cat => ({ ...cat, cards: cards.filter(c => c.categoryId === cat.id) }))
    .filter(cat => cat.cards.length > 0)

  const toggleExpand = (id) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDelete = () => {
    deleteCard(deleteTarget)
    setDeleteTarget(null)
    setExpandedCards(prev => { const n = new Set(prev); n.delete(deleteTarget); return n })
  }

  return (
    <main className="page">
      <div className="manage-top-bar">
        <h1 className="page-title">Gérer</h1>
        <div className="manage-io-buttons">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exporter
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importer
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      {toast && <div className="manage-toast">{toast}</div>}

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🃏</div>
          <p className="empty-state-text">Aucune carte.<br />Commencez par en créer une !</p>
        </div>
      ) : (
        grouped.map(cat => (
          <div key={cat.id} className="manage-group">
            <div className="manage-group-header">
              <span className="cat-dot" style={{ background: cat.color }} />
              <span className="manage-group-name">{cat.name}</span>
              <span className="manage-group-count">{cat.cards.length}</span>
            </div>
            {cat.cards.map(card => (
              <ManageCard
                key={card.id}
                card={card}
                expanded={expandedCards.has(card.id)}
                onToggle={() => toggleExpand(card.id)}
                onEdit={() => setEditCard(card)}
                onDelete={() => setDeleteTarget(card.id)}
              />
            ))}
          </div>
        ))
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Supprimer cette carte ?</h3>
            <p className="modal-body">Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editCard && (
        <EditModal
          card={editCard}
          categories={categories}
          onSave={(updates) => { updateCard(editCard.id, updates); setEditCard(null) }}
          onClose={() => setEditCard(null)}
        />
      )}
    </main>
  )
}

function ManageCard({ card, expanded, onToggle, onEdit, onDelete }) {
  return (
    <div className="manage-card">
      <div className="manage-card-question" onClick={onToggle}>
        <span className="manage-card-q-text">{card.question}</span>
        <svg
          className={`manage-card-chevron ${expanded ? 'expanded' : ''}`}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {expanded && (
        <div className="manage-card-answer">
          <div className="manage-answer-label">Réponse</div>
          <div className="manage-answer-text">{card.answer}</div>
          <div className="manage-card-actions">
            <button className="btn btn-secondary btn-sm" onClick={onEdit}>Modifier</button>
            <button className="btn btn-danger-light btn-sm" onClick={onDelete}>Supprimer</button>
          </div>
        </div>
      )}
    </div>
  )
}

function EditModal({ card, categories, onSave, onClose }) {
  const [question, setQuestion] = useState(card.question)
  const [answer, setAnswer] = useState(card.answer)
  const [categoryId, setCategoryId] = useState(card.categoryId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return
    onSave({ question: question.trim(), answer: answer.trim(), categoryId })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-form" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Modifier la carte</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <div className="select-wrap">
              <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Question</label>
            <textarea
              className="form-textarea"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Réponse</label>
            <textarea
              className="form-textarea"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  )
}
