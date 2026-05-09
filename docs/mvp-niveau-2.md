# MVP — Niveau 2 : la dette technique avant prod

> **Objectif.** Passer du *MVP démo présentable* (état actuel : pages soignées, données hardcodées,
> auth cosmétique, équivalences localStorage) au *MVP fonctionnel multi-user* qui tient ses promesses.
>
> **Convention.** Cases à cocher pour suivre l'avancement. Effort indicatif sur 1 dev solo expérimenté.
> Les chemins sont relatifs à la racine du repo.

## Ce qu'on n'attaque PAS dans ce doc

- Les scrapers Mon Master / UCAS / Common App (stubs aujourd'hui — le ROI ne vient qu'après #1).
- L'IA (#22 lettres, #26 coach) — autre couche de risque, autre ticket.
- a11y AA, PWA, analytics, mode famille/conseiller — ces features sont indépendantes de la dette
  technique listée ici.

## Pourquoi ces 3 phases dans cet ordre

```
Phase 0 (env)   →   Phase 1 (front ↔ DB)   →   Phase 2 (auth sync)   →   Phase 3 (équivalences DB)
   bloquant         premier moat data       compte multi-device         multi-curator
   2h max           3-4h                    4-6h                        3h
```

**Phase 1 dépend de Phase 0.** Sans `better-sqlite3` qui build, `getDb()` retourne toujours `null`
côté API → l'API tombe sur les fixtures hardcodées → migrer le front vers `useQuery` n'apporte rien.

**Phase 2 et 3 sont indépendantes.** Tu peux les paralléliser. Phase 2 a plus de valeur user
(perte de données = pain réel), Phase 3 a plus de valeur produit (le moat équivalences ne respire
qu'en mode multi-curator).

---

## Phase 0 — Environnement build qui marche (≤ 10 min)

> Pré-requis Windows uniquement. Sur Linux/macOS, `better-sqlite3` build tout seul.

### 0.1 Tenter le prebuild (à essayer EN PREMIER — souvent suffit)

`better-sqlite3` ship des binaires précompilés via `prebuild-install`. À l'installation, pnpm peut
échouer silencieusement à les fetch (timeout, restrictions corporate, etc.) → on les déclenche à la
main :

- [x] `cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3`
- [x] `node "../../../prebuild-install@*/node_modules/prebuild-install/bin.js" --verbose`
- [x] Vérifier que le binding apparaît :
      `ls build/Release/better_sqlite3.node`

Si ça marche → saute 0.2, va direct en 0.3.

### 0.2 Fallback : Visual Studio Build Tools 2022 (seulement si 0.1 échoue)

Cas où le prebuild ne fonctionne pas : Node trop récent sans prebuild publié, archi exotique,
tarball corrompu côté GitHub. Plan B = compile from source.

- [ ] Télécharger l'installeur : https://visualstudio.microsoft.com/visual-cpp-build-tools/
- [ ] Workload **« Desktop development with C++ »** + Windows 11 SDK
- [ ] Installer (~3 GB, ~15 min)
- [ ] Redémarrer le terminal
- [ ] `pnpm rebuild better-sqlite3 --force`

### 0.3 Tester la chaîne DB

- [x] `pnpm db:push` doit passer (crée `data/akjol.db` avec toutes les tables)
- [x] `pnpm --filter akjol seed:fixtures` doit afficher `OK — 24 programs, 12 jobs`
- [ ] `pnpm dev` puis `curl http://localhost:3000/api/programs?pageSize=5` doit renvoyer 5 programmes
      (et plus le warning `[/api/programs] DB read failed, using fixtures` dans la console serveur).

> **Bug de chemin** corrigé en 2026-05 : seed-fixtures.ts et lib/db.ts résolvaient `./data/akjol.db`
> à partir du cwd au lieu du repo root. Désormais ils utilisent `import.meta.url` pour pointer
> systématiquement sur `<repo>/data/akjol.db`. Si tu vois `Cannot open database because the
> directory does not exist`, vérifie que ce fix est bien là.

**Done quand :** les warnings `SQLite unavailable` disparaissent au démarrage du dev server.

---

## Phase 1 — Front ↔ API DB (3-4h)

> Aujourd'hui : le front fait `import { PROGRAMS } from "../data/programs"` partout — le bundle JS
> contient 24 fiches, et l'API `/api/programs` (qui lit la DB ou fallback) n'est jamais sollicitée
> par le front. Cible : front fait `useQuery(['programs', filters])` → API → DB → 60k lignes ONISEP.

### 1.1 Installer TanStack Query

- [ ] `pnpm --filter akjol add @tanstack/react-query @tanstack/react-query-devtools`
- [ ] Créer `apps/akjol_front/src/components/QueryProvider.tsx` (client component, wraps children
      avec `<QueryClientProvider>`, désactiver `refetchOnWindowFocus` pour le dev)
- [ ] Wrapper `<QueryProvider>` dans `apps/akjol_front/src/app/layout.tsx`, juste sous `<IntlProvider>`
- [ ] Ajouter `<ReactQueryDevtools />` en dev uniquement

### 1.2 Définir les hooks data

Créer `apps/akjol_front/src/hooks/data.ts` avec :

- [ ] `usePrograms(filters)` → `useQuery(['programs', filters], () => fetch('/api/programs?…'))`
- [ ] `useProgram(id)` → `useQuery(['program', id])` (avec `enabled: !!id`)
- [ ] `useJobs(query?)` → `useQuery(['jobs', query])`
- [ ] `useJob(id)` → `useQuery(['job', id])`
- [ ] Toutes les options : `staleTime: 60_000`, `gcTime: 5 * 60_000`

### 1.3 Cartographier les call sites

```bash
pnpm grep "from \"../data/programs\"" apps/akjol_front/src
pnpm grep "from \"../../data/programs\"" apps/akjol_front/src
pnpm grep "from \"../../../data/programs\"" apps/akjol_front/src
```

- [ ] Lister tous les fichiers qui importent `PROGRAMS`, `findProgram`, `getProgramsByFormationCode`
- [ ] Idem pour `JOBS`, `findJob`, `searchJobs`, `jobsForProgram`

### 1.4 Refactor par page (l'ordre compte — du plus simple au plus complexe)

#### 1.4.1 `/catalog` (le plus simple)

- [ ] Remplacer `import { PROGRAMS }` par `const { data: programs = [] } = usePrograms()`
- [ ] Adapter le `useMemo` pour retourner un loading state si `programs` vide
- [ ] Idem pour les schools : la dérivation `getAllSchools(programs)` doit être faite côté hook

#### 1.4.2 `/jobs` et `/jobs/[id]`

- [ ] `/jobs` → `useJobs()`
- [ ] `/jobs/[id]` → `useJob(id)` + `usePrograms()` pour les "Formations qui mènent ici"
- [ ] Conserver `findCountry`, `findScholarship` (data statiques OK)

#### 1.4.3 `/program/[id]` et `/school/[id]`

- [ ] `useProgram(id)` au lieu de `findProgram(id)`
- [ ] Le `notFound()` Next doit déclencher quand `data === null` après loading

#### 1.4.4 `/explore` (le plus complexe — feasibility synchrone sur data async)

- [ ] `usePrograms()` au top du composant
- [ ] `enriched` ne se calcule que quand `programs.length > 0`
- [ ] Le **moteur** `computeFeasibility(passport, program, edges)` reste synchrone et inchangé —
      c'est juste l'arrivée des programmes qui devient async

#### 1.4.5 `/compare` et `/parcours/[id]`

- [ ] Les programmes du comparateur sont identifiés par `id` → `usePrograms()` puis `.find()`
- [ ] Idem pour les étapes du parcours

#### 1.4.6 Composants réutilisables

- [ ] `Globe.tsx` → `usePrograms()` (au lieu de `import { PROGRAMS }`)
- [ ] `TrajectoryFlow.tsx` → garde `findProgram` mais via le cache TanStack si possible, sinon
      accepter un fallback hardcoded pour les nœuds (pas critique vu que c'est cosmétique)
- [ ] `JobTargetPanel.tsx` (déjà supprimé, skip)

### 1.5 Garder `data/programs.ts` mais ne plus l'importer dans les composants

- [ ] Le fichier reste utilisé par `scripts/seed-fixtures.ts` (qui pousse les fixtures dans la DB)
- [ ] Ajouter en haut du fichier un commentaire :
      `// SEED ONLY. Ne pas importer depuis un composant — utiliser usePrograms() / useProgram(id).`
- [ ] Optionnel : ajouter une règle ESLint `no-restricted-imports` pour interdire l'import depuis
      `app/**` et `components/**`

### 1.6 Test de bout en bout avec ONISEP

- [ ] `pnpm ingest onisep --limit 500` → 500 formations dans la DB
- [ ] `pnpm dev` → `/catalog` doit afficher 524 entrées (24 fixtures + 500 ONISEP)
- [ ] `/explore` doit montrer un volume de programmes plus large dans le globe et la liste
- [ ] Le moteur de feasibility doit gérer gracieusement les programmes ONISEP qui ont des champs
      `null` (pas de `acceptedDiplomas` détaillés, pas de `language.minLevel`) → ils tomberont
      probablement en `closed` ou `uncovered`, c'est OK pour cette phase

**Done quand :** un `pnpm ingest:onisep --limit 5000` permet de naviguer 5000+ formations sans rien
casser dans le démo Léa/Lana.

---

## Phase 2 — Auth + sync passeport multi-device (4-6h)

> Aujourd'hui : cookie HMAC signé, pas de table users en DB. Le passeport, le plan, les parcours
> et les documents vivent dans le localStorage du navigateur. Cible : un user qui se connecte sur
> un nouveau device retrouve son passeport.

### 2.1 Schéma DB

Étendre `packages/db/src/schema.ts` :

- [ ] Table `users` : `id` (text, ulid ou nanoid), `email` (unique), `name`, `createdAt`, `role`
      (text default `"student"` — utile pour Phase 3)
- [ ] Table `user_passports` : `userId` (FK users.id, primary key), `passport` (text, JSON), `updatedAt`
- [ ] Table `user_plans` : `userId`, `planJson` (text), `updatedAt`
- [ ] Table `user_parcours` : `userId`, `parcoursJson` (text), `updatedAt`
- [ ] Table `user_documents` : `userId`, `documentsJson` (text), `updatedAt`

> Choix du blob JSON vs colonnes éclatées : le passeport et le plan sont *atomiques* du point de vue
> user (on les édite tout entiers). JSON suffit, et permet d'ajouter des champs sans migration.

- [ ] `pnpm db:generate` → migration générée
- [ ] `pnpm db:push` → migration appliquée (en local)

### 2.2 Adapter l'auth pour créer/lier un user en DB

`apps/akjol_front/src/app/api/auth/login/route.ts` :

- [ ] Sur login, `INSERT OR IGNORE INTO users (id, email, name)` puis SELECT pour récupérer l'`id`
- [ ] Ajouter `userId` dans le payload du cookie de session (pas juste `email`)
- [ ] Mettre à jour `lib/session.ts` pour parser/encoder ce nouveau champ

### 2.3 API de sync

Créer `apps/akjol_front/src/app/api/passport/route.ts` :

- [ ] `GET` → si session, retourne `{ passport, plan, parcours, documents }` depuis la DB
- [ ] `PUT` → upsert chaque blob en DB, retourne `{ updatedAt }`
- [ ] Auth : `decodeSession` du cookie, 401 si invalide

### 2.4 Hook de sync côté front

Créer `apps/akjol_front/src/hooks/useSync.ts` :

- [ ] Sur `auth.user` qui apparaît : `GET /api/passport`, merger avec localStorage en `lastWriteWins`
      au niveau du blob (compare `updatedAt`)
- [ ] À chaque changement de store (passeport, plan, parcours, documents), debounce 1s puis `PUT`
- [ ] Sur logout : reset des stores + clear localStorage
- [ ] Indicateur visuel "Synchronisé · il y a 2s" dans le header (petit badge)

### 2.5 Stratégie de conflit

- [ ] **Passeport** : `lastWriteWins` (le `updatedAt` du blob)
- [ ] **Plan** : merge par `programId` — un programme ajouté sur device A et device B se garde une seule fois
- [ ] **Parcours** : merge par `id` (nanoid) — pas de conflit possible, fusion des deux listes
- [ ] **Documents** : merge par `name` (clé), keep le plus récent par champ

### 2.6 Migration silencieuse

- [ ] Si user anonyme (localStorage seul) se connecte pour la première fois, pousser localStorage → DB
      comme initial state (pas de fetch GET en premier qui écraserait avec du vide)

### 2.7 RGPD

- [ ] Endpoint `DELETE /api/account` qui supprime ligne `users` + cascade sur les autres tables
- [ ] `/account` page : le bouton "Supprimer mes données" appelle ce endpoint au lieu de juste
      clear localStorage
- [ ] L'export JSON existe déjà sur /account, pas besoin de toucher

### 2.8 Mettre à jour `/account`

- [ ] Retirer la mention "Profil local pour l'instant" — la sync est désormais réelle
- [ ] Afficher la date de dernière sync, le nombre d'items synchronisés

**Done quand :** Léa crée son compte sur Chrome desktop, ferme tout, ouvre Firefox sur son téléphone,
se connecte avec son email → son passeport, plan, parcours et documents sont là.

---

## Phase 3 — Équivalences en DB + multi-curator (3h)

> Aujourd'hui : `useEquivalencesStore` persisté en localStorage du curator. Personne d'autre ne voit
> ses éditions. Cible : `/admin/graph` édite la DB, tout le monde lit la version canonique, et le rôle
> `curator` est nécessaire pour écrire.

### 3.1 Schéma DB

- [ ] Table `equivalence_edges` : `id` (text), `from` (text), `to` (text), `kind` (text), `weight`
      (real), `note` (text nullable), `updatedAt`, `updatedBy` (FK users.id)
- [ ] Table `equivalence_revisions` : log append-only des modifs pour le revert (cf. `/admin/graph`
      qui a déjà l'UI History)

- [ ] Migration générée + appliquée
- [ ] Seeder : pousser `SEED_EQUIVALENCES` ([data/equivalences.ts](apps/akjol_front/src/data/equivalences.ts))
      dans la table au premier démarrage

### 3.2 Auth role-gate

- [ ] `lib/session.ts` : ajouter `role` dans le payload
- [ ] `app/api/auth/login/route.ts` : récupérer le rôle depuis la DB, l'inclure dans le cookie
- [ ] `middleware.ts` (Next root) : si `pathname.startsWith("/admin")` et `role !== "curator"` →
      redirect `/account?error=admin-required`
- [ ] Outil dev : un script `scripts/promote-curator.ts <email>` qui set `role = "curator"` sur un user

### 3.3 API CRUD

Créer `apps/akjol_front/src/app/api/equivalences/route.ts` :

- [ ] `GET` (public) → renvoie tous les edges
- [ ] `POST` (curator) → crée un edge, log dans `equivalence_revisions`
- [ ] `PUT /:id` (curator) → patch un edge
- [ ] `DELETE /:id` (curator) → supprime un edge (soft-delete dans révisions, hard delete dans table)
- [ ] `POST /revert` (curator) → restore depuis une révision

### 3.4 Adapter le store front

- [ ] `useEquivalencesStore` : remplacer `SEED_EQUIVALENCES` initial par `[]`
- [ ] Au mount, fetch `GET /api/equivalences` et populate
- [ ] `add/update/remove` : optimistic update local + appel API ; en cas d'échec, rollback + flash error
- [ ] Retirer la persistence localStorage (les données vivent maintenant en DB)

### 3.5 Synchroniser avec le moteur

- [ ] `engine/feasibility.ts` continue de prendre `edges` en paramètre — pas de changement
- [ ] L'API `/api/feasibility` doit charger les edges depuis la DB plutôt que d'utiliser
      `SEED_EQUIVALENCES` par défaut. Cache TanStack côté front : déjà en place.

### 3.6 UX `/admin/graph`

- [ ] Le bandeau vert ("Tes éditions affectent maintenant le moteur") devient légitime — il l'était
      pour le local, il l'est désormais pour tous les users connectés
- [ ] Ajouter dans le coin haut-droit : badge curator + son email (récupéré via `useAuthStore`)
- [ ] Si non-curator (cas où le middleware aurait raté), afficher l'éditeur en read-only avec
      bandeau rouge

**Done quand :** un curator A modifie `BTS_SIO_SISR ≡ DUT_INFO` ; un user B se connecte sur un autre
device, va sur /explore, et voit que les programmes qui acceptent DUT_INFO sont désormais ouverts pour
son BTS.

---

## Checklist de release MVP "vraie prod"

À cocher seulement quand les 3 phases sont done :

- [ ] `pnpm typecheck` vert sur tout le monorepo
- [ ] `pnpm ingest:onisep` exécutable en CI (workflow `.github/workflows/ingest.yml` déjà là)
- [ ] Compte Léa créé sur 2 devices, données synchronisées
- [ ] Curator fictif créé via `scripts/promote-curator.ts`, édit visible par tous
- [ ] Suppression de compte (RGPD) testée — toutes les tables nettoyées
- [ ] Lighthouse sur `/explore` ≥ 90 perf, ≥ 90 a11y
- [ ] Le bouton "Synchronisé" affiche bien la dernière sync
- [ ] README mis à jour avec les nouvelles commandes (`pnpm dev` reste l'entrypoint)

## Pièges connus

1. **TanStack Query SSR** : par défaut, hydratation côté serveur peut être touchy. Si Next se plaint,
   utiliser `experimental_taintObjectReference` pour les pages serveur, ou bouger les composants
   data-fetching en `"use client"` strict.
2. **Drizzle + better-sqlite3 + WAL** : déjà actif, attention si tu lances en parallèle un test et
   le dev server, le verrou peut bloquer. Couper `pnpm dev` avant `pnpm db:push`.
3. **Cookies HttpOnly + sync hook** : le cookie n'est pas lisible en JS. Pour savoir si l'user est
   loggué côté front avant le 1er fetch, on a déjà `/api/me`. L'utiliser comme source de vérité.
4. **Conflits de merge sur les listes** : `merge-by-id` fonctionne tant que les ids sont des nanoids
   (collisions improbables). Si un jour tu dois fusionner du contenu user-edited (notes parcours), il
   faudra un vrai algo CRDT — pas dans ce ticket.
5. **`/admin/graph` sans curator** : tester impérativement le redirect du middleware avant de
   déployer en public, sinon la prod expose l'éditeur à n'importe qui.
