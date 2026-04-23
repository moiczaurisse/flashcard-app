import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'

export default function Manage() {
  const { cards, categories, deleteCard, updateCard, importData, updateCategory, deleteCategory, mergeCategories } = useApp()
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [editCard, setEditCard] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [renameCat, setRenameCat] = useState(null)
  const [deleteCatTarget, setDeleteCatTarget] = useState(null)
  const [mergeSrc, setMergeSrc] = useState(null)
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

  const handleDeleteCard = () => {
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

      {/* ── Categories section ── */}
      <div className="section-label" style={{ marginBottom: 10 }}>Catégories</div>
      <div className="manage-cats-section">
        {categories.map(cat => {
          const cardCount = cards.filter(c => c.categoryId === cat.id).length
          return (
            <div key={cat.id} className="cat-manage-row">
              <span className="cat-dot" style={{ background: cat.color }} />
              <span className="cat-manage-name">{cat.name}</span>
              <span className="manage-group-count">{cardCount}</span>
              <div className="cat-manage-actions">
                <button
                  className="icon-btn"
                  onClick={() => setRenameCat(cat)}
                  title="Renommer"
                  aria-label="Renommer la catégorie"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                {categories.length > 1 && (
                  <button
                    className="icon-btn"
                    onClick={() => setMergeSrc(cat)}
                    title="Fusionner"
                    aria-label="Fusionner avec une autre catégorie"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3"/>
                      <polyline points="15 3 12 6 9 3"/>
                      <line x1="12" y1="6" x2="12" y2="14"/>
                    </svg>
                  </button>
                )}
                <button
                  className="icon-btn icon-btn-danger"
                  onClick={() => setDeleteCatTarget(cat)}
                  title="Supprimer"
                  aria-label="Supprimer la catégorie"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Cards section ── */}
      <div style={{ marginTop: 28 }}>
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
      </div>

      {/* Delete card confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Supprimer cette carte ?</h3>
            <p className="modal-body">Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleDeleteCard}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit card modal */}
      {editCard && (
        <EditModal
          card={editCard}
          categories={categories}
          onSave={(updates) => { updateCard(editCard.id, updates); setEditCard(null) }}
          onClose={() => setEditCard(null)}
        />
      )}

      {/* Rename category */}
      {renameCat && (
        <RenameCategoryModal
          category={renameCat}
          onRename={(newName) => {
            updateCategory(renameCat.id, { name: newName })
            setRenameCat(null)
            showToast('Catégorie renommée')
          }}
          onClose={() => setRenameCat(null)}
        />
      )}

      {/* Delete category */}
      {deleteCatTarget && (
        <DeleteCategoryModal
          category={deleteCatTarget}
          categories={categories}
          cards={cards}
          onDelete={(opts) => {
            deleteCategory(deleteCatTarget.id, opts)
            setDeleteCatTarget(null)
            showToast('Catégorie supprimée')
          }}
          onClose={() => setDeleteCatTarget(null)}
        />
      )}

      {/* Merge categories */}
      {mergeSrc && (
        <MergeCategoryModal
          category={mergeSrc}
          categories={categories}
          onMerge={(targetId) => {
            const targetName = categories.find(c => c.id === targetId)?.name
            mergeCategories(mergeSrc.id, targetId)
            setMergeSrc(null)
            showToast(`Fusionné dans « ${targetName} »`)
          }}
          onClose={() => setMergeSrc(null)}
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
      <div className="modal" onClick={e => e.stopPropagation()}>
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

function RenameCategoryModal({ category, onRename, onClose }) {
  const [name, setName] = useState(category.name)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Renommer la catégorie</h3>
        <div className="form-group">
          <label className="form-label">Nouveau nom</label>
          <input
            className="form-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={() => name.trim() && onRename(name.trim())}
            disabled={!name.trim() || name.trim() === category.name}
          >
            Renommer
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteCategoryModal({ category, categories, cards, onDelete, onClose }) {
  const cardCount = cards.filter(c => c.categoryId === category.id).length
  const otherCats = categories.filter(c => c.id !== category.id)
  const [action, setAction] = useState(otherCats.length > 0 && cardCount > 0 ? 'move' : 'delete')
  const [moveTo, setMoveTo] = useState(otherCats[0]?.id || '')

  const handleConfirm = () => {
    onDelete(action === 'move' && moveTo ? { moveTo } : { moveTo: null })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Supprimer « {category.name} »</h3>
        {cardCount === 0 ? (
          <p className="modal-body">Cette catégorie est vide. Confirmer la suppression ?</p>
        ) : (
          <>
            <p className="modal-body">
              Cette catégorie contient {cardCount} carte{cardCount > 1 ? 's' : ''}.
            </p>
            <div className="delete-cat-options">
              {otherCats.length > 0 && (
                <label className={`delete-cat-option ${action === 'move' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="deleteCatAction"
                    value="move"
                    checked={action === 'move'}
                    onChange={() => setAction('move')}
                  />
                  <div className="delete-cat-option-body">
                    <span>Déplacer les cartes vers</span>
                    {action === 'move' && (
                      <div className="select-wrap" style={{ marginTop: 8 }}>
                        <select
                          className="form-select"
                          value={moveTo}
                          onChange={e => setMoveTo(e.target.value)}
                        >
                          {otherCats.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              )}
              <label className={`delete-cat-option ${action === 'delete' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="deleteCatAction"
                  value="delete"
                  checked={action === 'delete'}
                  onChange={() => setAction('delete')}
                />
                <div className="delete-cat-option-body">
                  <span>Supprimer toutes les cartes</span>
                </div>
              </label>
            </div>
          </>
        )}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={cardCount > 0 && action === 'move' && !moveTo}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

function MergeCategoryModal({ category, categories, onMerge, onClose }) {
  const otherCats = categories.filter(c => c.id !== category.id)
  const [targetId, setTargetId] = useState(otherCats[0]?.id || '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Fusionner « {category.name} »</h3>
        <p className="modal-body">
          Toutes les cartes de « {category.name} » seront déplacées dans la catégorie choisie, puis « {category.name} » sera supprimée.
        </p>
        <div className="form-group">
          <label className="form-label">Fusionner avec</label>
          <div className="select-wrap">
            <select
              className="form-select"
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
            >
              {otherCats.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-primary"
            onClick={() => targetId && onMerge(targetId)}
            disabled={!targetId}
          >
            Fusionner
          </button>
        </div>
      </div>
    </div>
  )
}
