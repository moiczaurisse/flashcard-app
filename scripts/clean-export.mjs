// Nettoie un export JSON de flashcards :
//   1. Corrige l'encodage cassé (double-encodage UTF-8 → Latin-1).
//   2. Supprime les cartes en double (même question), en gardant la plus révisée.
//   3. Répare les dueDate invalides (ex. "2026-04-24T00::00:00.000Z").
//
// Usage (depuis la racine du projet) :
//   node scripts/clean-export.mjs data/flashcards-raw.json data/flashcards-clean.json
//
// Si les arguments sont omis : lit data/flashcards-raw.json et écrit
// data/flashcards-clean.json à côté.

import { readFileSync, writeFileSync } from 'node:fs'

const inPath  = process.argv[2] || 'data/flashcards-raw.json'
const outPath = process.argv[3] || 'data/flashcards-clean.json'

// ── 1. Lecture + correction d'encodage ───────────────────────────
// Le fichier est un UTF-8 valide, mais son CONTENU a été double-encodé
// (accents type "Ã©" au lieu de "é"). On lit donc le texte en UTF-8, puis
// on inverse le double-encodage : réencoder ces caractères en 'latin1'
// récupère les octets UTF-8 d'origine, qu'on redécode en 'utf8'.
const rawBytes = readFileSync(inPath)
const asUtf8    = rawBytes.toString('utf8')
const repaired  = Buffer.from(asUtf8, 'latin1').toString('utf8')

// Compte les marqueurs de mojibake (séquences "Ã.", "Â.", "Å.") et les
// caractères de remplacement U+FFFD. On garde la version qui en a le moins :
// si le fichier était déjà propre, la "réparation" en ajouterait.
const badMarkers = (s) => (s.match(/[�]|[ÃÂÅ][\x80-\xBF]/g) || []).length
let text = badMarkers(repaired) < badMarkers(asUtf8) ? repaired : asUtf8

const data = JSON.parse(text)
const cards = Array.isArray(data.cards) ? data.cards : []
const categories = Array.isArray(data.categories) ? data.categories : []

// ── 2. Réparation des dates invalides ────────────────────────────
let fixedDates = 0
for (const c of cards) {
  if (c.dueDate && isNaN(Date.parse(c.dueDate))) {
    // Corrige le cas "::" puis, si toujours invalide, retombe sur createdAt / maintenant.
    const repaired = String(c.dueDate).replace(/::/g, ':')
    c.dueDate = isNaN(Date.parse(repaired))
      ? (c.createdAt && !isNaN(Date.parse(c.createdAt)) ? c.createdAt : new Date().toISOString())
      : repaired
    fixedDates++
  }
}

// ── 3. Dédoublonnage par question ────────────────────────────────
// En cas de doublon, on garde la carte la plus "avancée"
// (repetitions les plus élevées, puis lastReviewed le plus récent).
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
const score = (c) => (c.repetitions || 0) * 1e13 + (c.lastReviewed ? Date.parse(c.lastReviewed) : 0)

const byQuestion = new Map()
for (const c of cards) {
  const key = `${c.categoryId}::${norm(c.question)}`
  const existing = byQuestion.get(key)
  if (!existing || score(c) > score(existing)) byQuestion.set(key, c)
}
const deduped = [...byQuestion.values()]
const removed = cards.length - deduped.length

// ── Écriture ─────────────────────────────────────────────────────
const clean = { cards: deduped, categories }
writeFileSync(outPath, JSON.stringify(clean, null, 2), { encoding: 'utf8' })

console.log(`✔ Nettoyage terminé → ${outPath}`)
console.log(`   Cartes      : ${cards.length} → ${deduped.length} (${removed} doublon(s) retiré(s))`)
console.log(`   Catégories  : ${categories.length}`)
console.log(`   Dates réparées : ${fixedDates}`)
