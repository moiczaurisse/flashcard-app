# CLAUDE.md — Flashcards SRS

Contexte complet pour démarrer chaque session. Voir aussi `CONTEXTE-APP.md`
(prompt réutilisable) et `AMELIORATIONS.md` (backlog/bugs).

## 1. Projet

Application web perso de flashcards à répétition espacée (SRS). PWA installable,
interface en français, 100 % côté client. Développée par un non-développeur qui
décrit ses besoins en français et s'appuie sur **Claude Code** comme assistant.

**Stack**
- React 18.3 (composants fonctionnels + hooks uniquement), **sans TypeScript**.
- Vite 5.4 (`@vitejs/plugin-react`) ; PWA via `vite-plugin-pwa` (`injectManifest`,
  SW custom `src/sw.js`, `registerType: autoUpdate`).
- **Pas de backend/BDD** : tout en `localStorage` (clés préfixées `fc_`).
- **Pas de routing lib** : navigation par `useState` d'onglet dans `App.jsx`.
- **Pas de framework CSS** : tout le style dans un seul `src/index.css`
  (variables CSS, thème violet `#534AB7`).
- Seules dépendances runtime : `react`, `react-dom`.
- Scripts : `npm run dev` (localhost:5173), `npm run build`, `npm run preview`.

**Architecture (`src/`)**
- `main.jsx` → monte `<App>` dans `<AppProvider>` (StrictMode).
- `App.jsx` → navigation par onglets, orchestre pages + objectif quotidien.
- `context/AppContext.jsx` → **cœur** : état global, CRUD, stats, objectif
  quotidien, **fusion des packs bundlés au démarrage**, migrations au chargement
  (réparation cartes + couleurs). Seed VIDE (deck réel = packs). Hook `useApp()`.
- `hooks/useLocalStorage.js` → state React synchronisé avec localStorage.
- `utils/srs.js` → algo SRS + helpers (`calculateNextReview`, `isDue`,
  `isMastered`, `migrateCard`, `planBacklogResorb` — étale + mélange le backlog).
- `utils/palette.js` → `CAT_PALETTE` (12 couleurs vives, source unique couleurs catégories).
- `components/TabBar.jsx` → barre d'onglets fixe (badge "dues").
- `components/Confetti.jsx` → burst CSS (objectif atteint ; off en reduced-motion).
- `data/` → contenu bundlé : `cards-base.json` + `packs/*.json` (auto-inclus via
  `import.meta.glob`), même format que l'export. Contenu seul (sans SRS).
- `pages/` → `Home` (hero anneau/streak/heatmap), `Review` (session 10 cartes max,
  ordre entrelacé, flip), `Add`, `Manage` (CRUD, fusion, import/export, Outils),
  `Stats`, `DailyGoal`.

**Modèles de données**
- Carte : `{ id, categoryId, question, answer, interval, easeFactor,
  repetitions, dueDate, lastReviewed, createdAt }`. IDs : `k${Date.now()}`.
- Catégorie : `{ id, name, color }`. IDs : `c${Date.now()}`.
- Objectif quotidien : `{ date, mode('theme'|'random'), categoryId, target, count }`.
- Journal d'activité `fc_review_log` : `{ "YYYY-MM-DD": { reviewed, good } }`.
- Clés localStorage : `fc_cards`, `fc_cats`, `fc_total_reviewed`, `fc_daily_goal`,
  `fc_review_log`, `fc_deleted_ids` (jamais re-fusionnés), `fc_cat_palette_v`,
  `fc_goal_celebrated`.

**Règles SRS (`utils/srs.js`)** — variante SM-2, 4 boutons, `inLearning` = reps < 2.
- Again (0) : interval→1, reps→0 ; ease −0.20 si déjà en review.
- Hard (1) : avance lente (×1.2), ease −0.15 (review only) ; reps non incrémenté.
- Good (2) : graduation standard (1j → 6j → interval×ease) ; ease inchangé.
- Easy (3) : graduation accélérée (4j → 10j → interval×ease×1.3) ; ease +0.15.
- `fuzz` : ±15 % sur intervalles ≥ 7j. `MAX_INTERVAL` = 365 jours.
- `isMastered` : interval ≥ 21 et reps > 0.

**Données réelles** : désormais **bundlées dans l'app** (`src/data/cards-base.json`
= 490 cartes nettoyées, + packs). Fusion par id au démarrage : un nouvel appareil
reçoit tout le deck ; un appareil existant ne voit rien écrasé (progression SRS
intacte). Pour ajouter un pack : déposer un `*.json` (même format) dans
`src/data/packs/`. Backup source : `data/flashcards-clean.json` (racine).
Mode clair/sombre auto via `@media (prefers-color-scheme)`.

**Conventions**
- Textes/UI en français ; commentaires de code souvent en anglais.
- Tout état partagé passe par `AppContext` ; pas de state global parallèle.
- Pas de nouvelle dépendance npm sauf nécessité réelle.
- Garder le style "un seul `index.css`" et les classes existantes (`btn`,
  `modal`, `section-label`…).

## 2. Workflow

- Une seule branche **`main`**, commits directs (pas de PR, pas de branches).
- Messages de commit **courts, en français** (ex. « ajout objectif quotidien »).
- **Demander avant toute opération git risquée** (reset, rebase, push --force,
  suppression) et avant d'écraser des données.
- **Expliquer simplement, en français.** Donner le code complet des fichiers
  modifiés ou des diffs clairs ; ne pas supposer de connaissances avancées.
- Remote : `github.com/moiczaurisse/flashcard-app` (dossier local `flashcards-app`).

## 3. Journal

> Règle : après chaque fonctionnalité que l'utilisateur a validée, ajouter une
> entrée datée (quoi changé, ce qui a marché ou non, idées suivantes), la plus
> récente en haut. Garder ce fichier sous ~150 lignes.

### 2026-10-01 — Overhaul visuel + mode sombre
- `utils/palette.js` (12 couleurs vives) ; migration unique (`fc_cat_palette_v`)
  recolore les catégories existantes (corrige 2 teals identiques).
- Hero : dégradé violet→corail + mini-cartes grands chiffres (streak/aujourd'hui).
  Carte de révision : bandeau couleur catégorie (`--cat`). Tab bar : pilule + rebond.
  Boutons révision colorés (rouge/orange/vert/bleu). Confettis CSS à l'objectif.
- **Mode sombre** via `@media (prefers-color-scheme: dark)` (variables redéfinies).
  Limite : quelques accents codés en dur dans Stats peu contrastés en sombre.

### 2026-10-01 — Packs bundlés + couche motivation
- Cartes **embarquées** (`src/data/cards-base.json` + `packs/*.json`, `import.meta.glob`),
  fusion par id au démarrage (jamais d'écrasement), `fc_deleted_ids`, seed vidé.
  Base = export nettoyé (490, ids identiques → 0 doublon sur appareil existant).
- `fc_review_log` + `getStreak` ; Accueil : anneau objectif, streak 🔥, heatmap
  12 semaines ; Stats : maîtrise globale.

### 2026-10-01 — Safe-area iOS (résolu)
- Cause du flottement bas : `apple-mobile-web-app-status-bar-style: black-translucent`
  rendait `innerHeight = écran − barre de statut`, bas tronqué. Passé à **`default`**
  → la tab bar touche le bord (barre de statut opaque en échange ; re-add écran
  d'accueil requis). Tab bar : `56px + --tab-bottom(10px)`, collée `bottom:0`.
- `planBacklogResorb` **mélange** maintenant (Fisher-Yates) → journées multi-catégories
  (résout la limite notée plus bas).

### 2026-10-01 — Suppression routine du matin + icône
- **Routine du matin supprimée** : `public/morning/`, `src/utils/morningNotification.js`,
  le handler `notificationclick` de `sw.js` et l'opt-in notif dans `Home.jsx`.
  Le daily goal et le reste sont conservés. Cause du bug « le site s'ouvrait sur
  la page morning » : aucune redirection de `/` — la page morning était atteinte
  via la notification quotidienne et/ou un raccourci écran d'accueil capturé sur
  `/morning/` (page qui était indépendamment installable). `sw.js` garde
  `skipWaiting`/`clientsClaim`/`cleanupOutdatedCaches` → les anciens caches
  (dont morning) sont purgés à l'activation.
- **Icône de l'app changée** : nouveaux `favicon.svg`, `apple-touch-icon.png` (180),
  `icon-192.png`, `icon-512.png` dans `public/`. Manifest : icônes 192/512
  (purpose any), précache des png/svg via `globPatterns`.
- Note : un raccourci écran d'accueil existant pointant sur `/morning/` doit être
  retiré puis réajouté (l'URL capturée ne peut pas être changée à distance).

### 2026-10-01
- **srs.js** : intervalle plafonné à 365 jours (`MAX_INTERVAL`).
- **migrateCard** (au chargement) : répare les `dueDate` invalides et ramène les
  échéances aberrantes (ex. 2071) ; `isDue` robuste aux dates invalides.
- **Manage → Outils** : « Résorber le retard » (replanifie le backlog, 30/jour,
  seules les dates changent) et « Rechercher les doublons » (par catégorie,
  garder une carte / supprimer les autres).
- Testé sur l'export réel : OK (k1 16577→365j ; date `00::00` réparée ;
  490 cartes en retard → 17 jours).
- **Limite connue** : le planificateur de backlog répartit les cartes dans
  l'ordre du fichier → chaque journée est dominée par une seule catégorie
  (mélange/entrelacement à faire).
