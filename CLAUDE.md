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
- `context/AppContext.jsx` → **cœur** : état global (cards, categories,
  totalReviewed, dailyGoal), seed data, CRUD, stats, objectif quotidien,
  migration au chargement. Hook `useApp()`.
- `hooks/useLocalStorage.js` → state React synchronisé avec localStorage.
- `utils/srs.js` → algo SRS + helpers (`calculateNextReview`, `isDue`,
  `isMastered`, `migrateCard`, `planBacklogResorb`).
- `components/TabBar.jsx` → barre d'onglets fixe (badge "dues").
- `pages/` → `Home`, `Review` (session 20 cartes max, ordre aléatoire),
  `Add`, `Manage` (CRUD, fusion, import/export, Outils), `Stats`, `DailyGoal`.

**Modèles de données**
- Carte : `{ id, categoryId, question, answer, interval, easeFactor,
  repetitions, dueDate, lastReviewed, createdAt }`. IDs : `k${Date.now()}`.
- Catégorie : `{ id, name, color }`. IDs : `c${Date.now()}`.
- Objectif quotidien : `{ date, mode('theme'|'random'), categoryId, target, count }`.
- Clés localStorage : `fc_cards`, `fc_cats`, `fc_total_reviewed`, `fc_daily_goal`.

**Règles SRS (`utils/srs.js`)** — variante SM-2, 4 boutons, `inLearning` = reps < 2.
- Again (0) : interval→1, reps→0 ; ease −0.20 si déjà en review.
- Hard (1) : avance lente (×1.2), ease −0.15 (review only) ; reps non incrémenté.
- Good (2) : graduation standard (1j → 6j → interval×ease) ; ease inchangé.
- Easy (3) : graduation accélérée (4j → 10j → interval×ease×1.3) ; ease +0.15.
- `fuzz` : ±15 % sur intervalles ≥ 7j. `MAX_INTERVAL` = 365 jours.
- `isMastered` : interval ≥ 21 et reps > 0.

**Données réelles** : les vraies cartes vivent dans le localStorage du navigateur
(≈ 490 cartes, 7 catégories, surtout géographie). Elles ne sont PAS dans le repo ;
le code ne contient qu'un seed de 7 cartes. Backup : `data/flashcards-clean.json`.

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
