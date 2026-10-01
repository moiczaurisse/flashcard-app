# CONTEXTE COMPLET — Application Flashcards SRS

> Fichier à coller (ou à joindre) dans un assistant IA pour lui donner le
> contexte exact du projet avant toute demande d'amélioration.
> Dernière mise à jour : 2026-10-01.

## 1. QUI JE SUIS / COMMENT JE TRAVAILLE
Je développe seul une application web de flashcards (révision par répétition
espacée). Je ne suis pas développeur professionnel : j'avance par itérations,
en décrivant en français ce que je veux, et je m'appuie sur un assistant IA
pour écrire/modifier le code.

Mon environnement de travail :
- **Éditeur** : VS Code sous **Windows 11**, terminal **PowerShell**.
- **Assistant IA** : GitHub Copilot (chat + complétions) dans VS Code.
- **Workflow Git** : une seule branche `main`, commits directs (pas de PR,
  pas de branches de feature). Messages de commit courts, en français
  (ex. « ajout objectif quotidien », « détail météo », « fix dossier morning »).
- **Remote** : GitHub → https://github.com/moiczaurisse/flashcard-app.git
  (NB : le repo distant s'appelle `flashcard-app`, le dossier local
  `flashcards-app`.)
- Je lance l'app en local avec `npm run dev` (Vite, http://localhost:5173).
- Je build avec `npm run build`, je prévisualise avec `npm run preview`.

Ce que j'attends de l'assistant :
- M'expliquer en français, simplement.
- Me donner le code complet des fichiers modifiés (je copie/colle), ou des
  diffs clairs, sans supposer que je connais tous les concepts.
- Respecter le style et l'architecture existants (voir plus bas).
- Me prévenir avant toute manip risquée (git reset, suppression, etc.).

## 2. STACK TECHNIQUE (exacte)
- **React 18.3** (composants fonctionnels + hooks uniquement, pas de classes).
- **Vite 5.4** comme bundler/dev server, plugin `@vitejs/plugin-react`.
- **PWA** via `vite-plugin-pwa` 0.20 en stratégie `injectManifest`
  (service worker custom `src/sw.js`, `registerType: autoUpdate`).
- **Pas de TypeScript** : tout est en JSX/JS (.jsx / .js).
- **Pas de librairie de routing** : la navigation est gérée à la main avec
  un simple `useState('home'|'review'|'add'|'manage'|'stats')` dans App.jsx.
- **Pas de librairie UI / CSS framework** : tout le style est écrit à la main
  dans un seul fichier `src/index.css` (~1000 lignes, variables CSS custom,
  thème violet #534AB7).
- **Pas de backend / pas de base de données** : 100 % côté client.
  Toutes les données sont persistées dans le **localStorage** du navigateur.
- Langue de l'interface : **français**.
- Seules dépendances runtime : `react`, `react-dom`. Tout le reste est fait main.

## 3. ARCHITECTURE DU CODE (fichiers réels)
```
Racine : index.html, package.json, vite.config.js
src/
  main.jsx                → point d'entrée, monte <App> dans <AppProvider>, StrictMode
  App.jsx                 → navigation par onglets (state `tab`), orchestre les pages
                            et la logique "objectif quotidien" (DailyGoal)
  index.css               → TOUT le style de l'app (un seul fichier)
  sw.js                   → service worker PWA (precache workbox)
  context/
    AppContext.jsx        → CŒUR de l'app : Context React global. Contient les
                            données (cards, categories, totalReviewed, dailyGoal),
                            les données de départ (SEED_CATS, SEED_CARDS), et
                            TOUTES les fonctions CRUD + stats + objectif quotidien.
                            Hook d'accès : `useApp()`.
  hooks/
    useLocalStorage.js    → hook générique qui synchronise un state React avec
                            le localStorage (clés préfixées `fc_`).
  utils/
    srs.js                → algorithme de répétition espacée (variante SM-2 /
                            inspiré d'Anki). Fonctions : calculateNextReview,
                            isDue, isMastered, isReviewedToday. Qualité de réponse
                            sur 4 niveaux : 0=Again, 1=Hard, 2=Good, 3=Easy.
    morningNotification.js → logique de notification/routine du matin.
  components/
    TabBar.jsx            → barre d'onglets fixe en bas (badge "dues").
  pages/
    Home.jsx             → accueil : stats du jour, lancement des révisions.
    Review.jsx           → session de révision (max 20 cartes, ordre aléatoire
                            intelligent, flip carte, boutons Again/Hard/Good/Easy).
    Add.jsx              → ajout de cartes / catégories.
    Manage.jsx          → gestion des catégories et cartes (édition, suppression,
                            fusion de catégories, import/export JSON).
    Stats.jsx           → statistiques globales.
    DailyGoal.jsx       → objectif quotidien (50 cartes/jour, mode thème ou aléatoire).
public/
  favicon.svg
  morning/              → mini-page "routine du matin" séparée (HTML + JS vanilla,
    index.html           hors de React) avec questions du matin + météo.
    morning-questions.js (202 questions en dur : chefs-lieux + numéros de départements)
```

## 4. MODÈLES DE DONNÉES (tels qu'utilisés)
Carte (card) :
```
{ id, categoryId, question, answer,
  interval,        // jours avant prochaine révision
  easeFactor,      // facteur de facilité SM-2 (défaut 2.5, borné 1.3–4.0)
  repetitions,     // nb de révisions réussies d'affilée
  dueDate,         // ISO string
  lastReviewed,    // ISO string ou null
  createdAt }      // ISO string
```
IDs générés via `k${Date.now()}` (cartes) et `c${Date.now()}` (catégories).

Catégorie : `{ id, name, color }`  (color = hex, ex #534AB7)

Objectif quotidien (dailyGoal) :
`{ date, mode('theme'|'random'), categoryId, target(=50), count }`

Clés localStorage : `fc_cards`, `fc_cats`, `fc_total_reviewed`, `fc_daily_goal`.

## 5. ALGORITHME SRS (règles exactes, src/utils/srs.js)
- Variante SM-2 à 4 boutons. `inLearning` = repetitions < 2.
- Again (0) : interval→1, repetitions→0, pénalité d'ease (-0.20) seulement si
  la carte était déjà en phase "review".
- Hard (1) : reste en apprentissage ou avance lentement (×1.2), ease -0.15
  sur cartes review ; repetitions NON incrémenté.
- Good (2) : graduation SM-2 standard (1j → 6j → interval×easeFactor), ease inchangé.
- Easy (3) : graduation accélérée (4j → 10j → interval×ease×1.3), ease +0.15.
- "fuzz" : randomisation ±15 % sur les intervalles ≥ 7j pour éviter les pics.
- isMastered : interval ≥ 21 jours et repetitions > 0.

## 6. ÉTAT DU CONTENU (données réelles, export du 2026-10-01)
Mes vraies cartes vivent dans le localStorage (elles ne sont PAS dans le repo ;
le code ne contient qu'un jeu d'exemple de 7 cartes). Snapshot actuel :
**≈ 492 cartes réparties sur 7 catégories.**

| Thème (catégorie)                       | Couleur   | Cartes |
|-----------------------------------------|-----------|-------:|
| Capitales du monde                      | `#14B8A6` |    198 |
| Chefs-lieux des départements français   | `#EF4444` |    101 |
| Numéros des départements français       | `#3B82F6` |    101 |
| Histoire (cour des Valois / Bourbons)   | `#E879A0` |     44 |
| Vrac TDS (culture générale, type quiz)  | `#F97316` |     43 |
| Français (vocabulaire)                  | `#534AB7` |      3 |
| Géographie (divers)                     | `#14B8A6` |      2 |

- La géographie (capitales + départements) = ~81 % du deck.
- « Français » (3) et « Géographie » (2) sont les restes du jeu d'exemple
  d'origine — candidats à la fusion/au nettoyage.
- Voir `AMELIORATIONS.md` pour les anomalies connues dans ces données.

## 7. CONVENTIONS À RESPECTER
- Code commenté en anglais par endroits, UI/textes en français.
- Alignement vertical des imports et des `=` par endroits (style perso).
- Toute donnée partagée passe par AppContext ; ne pas introduire de state
  global parallèle ni de nouvelle lib sans le justifier.
- Pas de nouvelle dépendance npm sauf nécessité réelle.
- Garder le style "un seul index.css".

## 8. ÉTAT ACTUEL / DERNIERS TRAVAUX
Derniers commits : objectif quotidien, app "routine du matin" avec météo,
gestion des catégories, sessions de 20 cartes max avec ordre aléatoire,
import/export JSON, améliorations UI, améliorations de l'algo SRS.

## 9. MA DEMANDE
[→ décris ici précisément la fonctionnalité ou le bug à traiter]
```

