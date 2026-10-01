# Améliorations & bugs — Flashcards SRS

Liste de travail. Les 4 premiers points sont des anomalies repérées dans
l'export réel des données (2026-10-01).

## 🐛 Bugs / anomalies de données (priorité)

### 1. Encodage cassé à l'export JSON (UTF-8) — IMPORTANT
Dans le fichier exporté, tous les accents sont corrompus :
`FranÃ§ais` au lieu de `Français`, `Ã©pistÃ©mologie`, `Â«`, etc.
C'est un double-encodage (UTF-8 relu comme Latin-1).
- **Risque** : réimporter ce fichier corromprait définitivement les accents
  des ~492 cartes.
- **À faire** : forcer l'UTF-8 à l'export (Blob avec `type: 'application/json;charset=utf-8'`,
  et éventuellement préfixer un BOM) et vérifier le flux d'import.
- Script de réparation d'un fichier déjà cassé : `scripts/clean-export.mjs`.

### 2. Doublons dans « Capitales du monde »
- « Guinée équatoriale » (Malabo) : présente en `cap92` ET `cap190`.
- « São Tomé-et-Príncipe » (São Tomé) : présente en `cap100` ET `cap191`.
- **À faire** : dédoublonner (le script `clean-export.mjs` le fait), et
  éventuellement empêcher les doublons de question à l'ajout.

### 3. Date d'échéance invalide
- `cap101` (capitale des États-Unis) : `dueDate` = `2026-04-24T00::00:00.000Z`
  (double `:`). `new Date(...)` renvoie une date invalide → la carte n'est
  jamais considérée comme "à réviser".
- **À faire** : corriger la valeur + rendre `isDue`/l'import robustes aux
  dates invalides.

### 4. Intervalle emballé (overflow SRS)
- `k1` (ubiquité) : `interval` = 16577 jours, échéance en **2071**.
  Conséquence de « Facile » répétés sans plafond.
- **À faire** : plafonner l'intervalle maximal (ex. 365 jours, comme Anki
  par défaut) dans `calculateNextReview`.

## 💡 Pistes d'amélioration (backlog, à prioriser)

- [ ] Nettoyage des catégories « Français » (3) et « Géographie » (2) issues
      du seed : fusionner ou supprimer.
- [ ] Écran Stats enrichi : nombre de cartes par catégorie, maîtrisées /
      en cours / à réviser (inventaire permanent).
- [ ] Garde-fous à l'ajout : détection de doublons de question.
- [ ] Sauvegarde/export plus sûr (UTF-8, nom de fichier daté — déjà daté).

## ✅ Fait
- (rien pour l'instant)
