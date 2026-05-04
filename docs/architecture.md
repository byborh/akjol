# Lychee Akjol — Architecture complète + Prompt « Canvas Node-Based »

> Ce document a deux objectifs distincts :
>
> 1. **Partie A** — Décrire **toute** l'architecture du projet Lychee Akjol (monorepo Next.js fullstack, packages, DB, providers IA, collaboration temps réel, 3D, billing, etc.).
> 2. **Partie B** — Fournir un **prompt autonome** (à la fin du fichier) résumant le système **canvas / nodes / edges** afin de pouvoir le réimplémenter dans un autre projet en le passant tel quel à un agent.
>
> La partie A explique le « pourquoi » et le contexte. La partie B est volontairement self-contained et copy-paste.

---

## Sommaire

### Partie A — Architecture
1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Pourquoi un monorepo Next.js fullstack](#2-pourquoi-un-monorepo-nextjs-fullstack)
3. [Stack technique complète](#3-stack-technique-complète)
4. [Structure du monorepo](#4-structure-du-monorepo)
5. [Architecture Next.js (App Router fullstack)](#5-architecture-nextjs-app-router-fullstack)
6. [Packages partagés `@lychee/*`](#6-packages-partagés-lychee)
7. [Authentification, middleware et onboarding](#7-authentification-middleware-et-onboarding)
8. [Base de données et ORM](#8-base-de-données-et-orm)
9. [API Routes (backend embarqué)](#9-api-routes-backend-embarqué)
10. [Providers IA (Gemini, Veo, Tripo3D)](#10-providers-ia-gemini-veo-tripo3d)
11. [L'éditeur de workflow (canvas node-based)](#11-léditeur-de-workflow-canvas-node-based)
12. [Viewer 3D et animations](#12-viewer-3d-et-animations)
13. [Collaboration temps réel (Yjs + PartyKit)](#13-collaboration-temps-réel-yjs--partykit)
14. [Partage de projets](#14-partage-de-projets)
15. [Système de billing / credits / pool](#15-système-de-billing--credits--pool)
16. [Storage objets (Cloudflare R2)](#16-storage-objets-cloudflare-r2)
17. [Logging, errors et observabilité](#17-logging-errors-et-observabilité)
18. [Analytics](#18-analytics)
19. [Email transactionnel](#19-email-transactionnel)
20. [Super Admin (app distincte)](#20-super-admin-app-distincte)
21. [Conventions de code et naming](#21-conventions-de-code-et-naming)
22. [Variables d'environnement](#22-variables-denvironnement)
23. [Dev local : commandes et workflow](#23-dev-local--commandes-et-workflow)
24. [ADR — Décisions d'architecture](#24-adr--décisions-darchitecture)
25. [Portes de sortie pour scaler](#25-portes-de-sortie-pour-scaler)

### Partie B — Prompt
26. [PROMPT autonome : reproduire le canvas Node/Edge ailleurs](#26-prompt-autonome--reproduire-le-canvas-nodeedge-ailleurs)

---

# PARTIE A — ARCHITECTURE COMPLÈTE

## 1. Vue d'ensemble du projet

**Lychee Akjol** est un outil web de création 3D pilotée par IA. L'utilisateur compose un **pipeline visuel** (text prompt → image → modèle 3D → texture → animation → vidéo) en branchant des **nodes** dans un **canvas interactif**. Chaque node représente une étape (input ou génération via un provider IA externe). Les résultats (images, GLB 3D, vidéos) sont prévisualisés dans le canvas et sauvegardés sur Cloudflare R2.

Domaines couverts :

- **Akjol** (app principale) — éditeur, projets, billing utilisateur, partage, collab.
- **Admin** (app séparée) — dashboard super admin (workspaces, billing global, usage credits).
- **PartyKit canvas server** — serveur WebSocket dédié à la synchro temps réel des canvases.

Le tout cohabite dans **un seul dépôt Git** (monorepo), géré avec **Turborepo + pnpm workspaces**.

---

## 2. Pourquoi un monorepo Next.js fullstack

### 2.1 Next.js fullstack ?

L'app **Akjol** utilise **Next.js 16 (App Router)**. Next.js fait à la fois :

- **Le frontend** (rendu React, composants client/serveur, streaming, Suspense).
- **Le backend HTTP** via les **Route Handlers** (`app/api/**/route.ts`). Chaque fichier `route.ts` exporte des fonctions `GET`, `POST`, `PUT`, `DELETE`, etc. Ces routes tournent côté serveur (Node.js / Edge runtime au choix), accèdent à la DB Drizzle, parlent à Stripe, R2, Gemini, Tripo, etc.
- **Les Server Actions** et **Server Components** quand c'est plus simple (ex. onboarding : `createWorkspaceAction`, `submitSurveyAction`).

Conséquences :

- **Pas de service backend séparé** à déployer/versionner.
- **Un seul `pnpm turbo dev`** pour avoir front + API en local sur le même port (`localhost:3000`).
- **Type-safety bout en bout** : le client peut importer les mêmes types Zod/TypeScript que la route.
- **Co-location** : la page React qui consomme `POST /api/generate` vit à côté de `app/api/generate/route.ts`.

### 2.2 Monorepo ?

Deux apps Next.js cohabitent (`akjol` + `admin`) ainsi qu'un serveur Cloudflare (`partykit/canvas.ts`). Elles partagent :

- Le **schéma Drizzle** de la DB (single source of truth).
- La **logique d'auth** (super admin, workspace admin).
- Le **logger Pino** + la hiérarchie d'erreurs `AppError`.
- Les **plans/configs billing**.
- Les **utilitaires shared** (proxy R2 URLs, validation URL, format display name).
- La **librairie UI shadcn**.

Sans monorepo, il faudrait soit dupliquer (drift garanti), soit publier un package privé (lourd pour 2 consommateurs internes). Avec **Turborepo + pnpm workspaces** :

- `pnpm-workspace.yaml` déclare `apps/*` et `packages/*`.
- Les apps importent les packages via `@lychee/<name>` (workspace protocol).
- `turbo.json` définit le pipeline (`build`, `dev`, `lint`) avec **caching local + remote (Vercel)**.

### 2.3 Déploiement local

```bash
pnpm install                         # installe l'arbre complet
pnpm turbo dev                       # lance akjol (3000) + admin (3001) en parallèle
cd apps/akjol && pnpm partykit:dev  # lance le serveur PartyKit (1999)
```

Le `.env.local` vit **à la racine** du monorepo et est symlinké dans chaque app — une seule source de vérité pour les secrets en dev.

---

## 3. Stack technique complète

### 3.1 Infrastructure & services managés

| Couche | Service |
|--------|---------|
| Hosting (apps Next.js) | Vercel |
| Auth | Clerk v7 |
| DB | Neon (PostgreSQL serverless) |
| Storage objets | Cloudflare R2 (S3-compatible) |
| Payments | Stripe |
| Email | Resend |
| Analytics | PostHog |
| Collab WebSocket | PartyKit (Cloudflare Durable Objects) |
| Monorepo | Turborepo + remote cache Vercel |

### 3.2 Frontend

| Outil | Version | Rôle |
|-------|---------|------|
| Next.js (App Router) | 16.2.x | Framework fullstack |
| React | 19.2.x | UI |
| TypeScript | 5.x | Type-safety |
| Tailwind CSS | 4.x | Styling utility-first |
| shadcn/ui | — | Primitives UI (Radix + Tailwind) |
| `@xyflow/react` (ReactFlow) | 12.x | Canvas node-based |
| Three.js | 0.183.x | Moteur 3D WebGL |
| `@react-three/fiber` | 9.x | Renderer React de Three.js |
| `@react-three/drei` | 10.x | Helpers (Bounds, OrbitControls, Environment, etc.) |
| Zustand | 5.x | State management client |
| Framer Motion | 12.x | Animations (marketing surtout) |
| Lucide React | — | Icônes |
| `html-to-image` | — | Capture thumbnail canvas |
| `nanoid` | 5.x | IDs courts pour nodes/edges |
| `@t3-oss/env-nextjs` | 0.13.x | Variables d'env type-safe |
| Zod | 4.x | Validation schemas |

### 3.3 Backend / data layer

| Outil | Rôle |
|-------|------|
| Drizzle ORM | Schéma TS, migrations, requêtes |
| `@neondatabase/serverless` | Driver PostgreSQL Neon (HTTP / WS) |
| `@aws-sdk/client-s3` + `s3-request-presigner` | Upload R2 + presigned URLs |
| Pino | Structured JSON logging |
| AsyncLocalStorage | Request context (request id, timing) |
| `svix` | Validation webhooks Clerk |
| Stripe SDK | Checkout, customer portal, webhooks |
| Resend SDK | Emails (templates React Email) |

### 3.4 Collaboration temps réel

| Outil | Rôle |
|-------|------|
| Yjs | CRDT — source de vérité du canvas |
| `y-partykit/provider` | Provider WebSocket Yjs ↔ PartyKit |
| `y-indexeddb` | Cache offline navigateur |
| `partykit` | Serveur WebSocket Cloudflare |

### 3.5 IA / providers

| Provider | Usage |
|----------|-------|
| `@google/genai` (Gemini Imagen) | text→image, image→image, sketch→image, multiview |
| `@google/genai` (Veo 3.1) | text→video, image→video, video extend |
| Tripo3D (REST) | text→3D, image→3D, texture, rig, animate, lowpoly, convert, stylize |

---

## 4. Structure du monorepo

```
lychee_akjol/
├── apps/
│   ├── akjol/            # App principale (localhost:3000)
│   │   ├── src/
│   │   │   ├── app/       # App Router (pages + API routes)
│   │   │   ├── components/
│   │   │   ├── stores/    # Zustand
│   │   │   ├── lib/       # Logique métier
│   │   │   ├── emails/    # React Email templates
│   │   │   ├── env.ts     # @t3-oss/env-nextjs
│   │   │   └── middleware.ts
│   │   ├── partykit/
│   │   │   └── canvas.ts  # Serveur PartyKit (Cloudflare DO)
│   │   ├── partykit.json
│   │   └── package.json
│   └── admin/             # Dashboard super admin (localhost:3001)
│       └── src/app/
├── packages/
│   ├── db/                # @lychee/db — schema Drizzle + createDb()
│   ├── logger/            # @lychee/logger — Pino + AppError + RequestContext
│   ├── auth/              # @lychee/auth — fonctions pures (checkSuperAdmin, etc.)
│   ├── billing/           # @lychee/billing — PLAN_CONFIGS, guards
│   ├── shared/            # @lychee/shared — proxy URL, display name, URL validation
│   └── ui/                # @lychee/ui — shadcn components source
├── docs/
│   ├── technical-architecture.md
│   ├── design-system.md
│   ├── integrations.md
│   ├── video-nodes-ux.md
│   ├── specs/             # Specs des features livrées
│   └── architecture-and-canvas-prompt.md   ← CE FICHIER
├── scripts/
│   └── seed-templates.ts  # Seed templates depuis staging
├── drizzle.config.ts      # Pointe vers packages/db/src/schema.ts
├── turbo.json             # Pipeline Turborepo
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.local             # Symlinké dans chaque app
├── CLAUDE.md
└── README.md
```

**Règle d'or des dépendances :**
- `apps/*` peut importer depuis `@lychee/*`.
- `packages/*` **ne peut JAMAIS** importer depuis une app (sinon cycle).

---

## 5. Architecture Next.js (App Router fullstack)

### 5.1 Routing par groupes de routes

L'App Router utilise des **groupes** (`(name)`) pour grouper des pages sans affecter l'URL :

```
apps/akjol/src/app/
├── (auth)/              → /sign-in, /sign-up
├── (coming-soon)/       → pages placeholder marketing (ex. /text-to-image)
├── (marketing)/         → / (landing page)
├── (onboarding)/        → /organization, /billing, /invite, /survey
│   └── layout.tsx       → carte centrée fond sombre
├── auth/callback/       → routing post-login
├── share/[token]/       → liens publics
├── akjol/
│   ├── (app)/           → shell sidebar + header
│   │   ├── page.tsx     → /akjol (dashboard)
│   │   ├── projects/
│   │   ├── settings/
│   │   ├── admin/
│   │   └── workspaces/new/
│   └── (editor)/        → fullscreen, pas de sidebar
│       └── projects/[id]/
└── api/                 → backend embarqué (route.ts handlers)
```

### 5.2 Server Components vs Client Components

- **Par défaut**, tout est Server Component.
- Les fichiers qui ont besoin d'état/effet/listeners DOM ajoutent `"use client";` en tête.
- Les données critiques (auth, DB) sont fetchées en Server Component dès que possible et passées aux Client Components en props.

### 5.3 Server Actions

Utilisées dans l'onboarding (formulaires) :
- `createWorkspaceAction(formData)` → insert workspace + member en `primary_owner`.
- `inviteTeamMembersAction(formData)` → insert invitations + envoie emails.
- `submitSurveyAction(formData)` → insert `userOnboarding`.

### 5.4 Route Handlers (`app/api/**/route.ts`)

Tous les handlers akjol sont **wrappés** avec `withContext()` qui fournit :

- Un `requestId` unique (stocké dans AsyncLocalStorage via `RequestContext`).
- Le timing automatique de la requête.
- Le catch des `AppError` → JSON typé.
- Le logging Pino structuré.

Exemple de structure :

```ts
// apps/akjol/src/lib/with-context.ts (concept)
export function withContext<T>(handler: (req: Request) => Promise<T>) {
  return async (req: Request) => {
    return RequestContext.run({ requestId: nanoid() }, async () => {
      try {
        return Response.json(await handler(req));
      } catch (err) {
        if (err instanceof AppError) return Response.json({ error: err.message }, { status: err.status });
        logger.error({ err }, "Unhandled error");
        return Response.json({ error: "Internal" }, { status: 500 });
      }
    });
  };
}
```

### 5.5 Middleware Clerk

`apps/akjol/src/middleware.ts` protège tout sauf une whitelist publique : `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks(.*)`, `/api/cron(.*)`, `/api/invitations/accept(.*)`, `/invite(.*)`, `/share(.*)`, `/pricing`, et quelques pages SEO « coming soon ».

---

## 6. Packages partagés `@lychee/*`

### 6.1 `@lychee/db`

- **Source de vérité** du schéma DB (`packages/db/src/schema.ts`).
- Exporte une factory `createDb(databaseUrl)` qui retourne une instance Drizzle Neon.
- Chaque app crée sa propre instance (pas de singleton DB inter-app).
- `drizzle.config.ts` à la racine pointe vers ce schéma pour les migrations.

### 6.2 `@lychee/logger`

- Singleton **Pino** + domain loggers (`logger.child({ domain: "billing" })`).
- `RequestContext` (AsyncLocalStorage) — chaque log a automatiquement le `requestId`.
- Hiérarchie d'erreurs : `AppError` (base) → `AuthError`, `NotFoundError`, `ValidationError`, `ConflictError`. Chaque sous-classe porte un `status` HTTP.
- `withContext()` reste dans akjol (Next.js-specific) mais consomme ces primitives.

### 6.3 `@lychee/auth`

Fonctions **pures** :
- `checkWorkspaceAdmin(db, userId, workspaceId): Promise<boolean>`.
- `checkSuperAdmin(db, userId): Promise<{ role: string; permissions: string[] } | null>`.

Les apps wrappent avec `auth()` de Clerk pour récupérer `userId`.

### 6.4 `@lychee/billing`

- `PLAN_CONFIGS` : config statique des plans (`starter`, `pro`, `enterprise`) avec credits mensuels, daily/weekly caps, prix.
- `PROVIDER_MAP` : mapping node type → provider/operation pour le calcul de credits.
- Subscription guards (vérifie statut actif avant action billable).
- **Heavy logic** (proration, Stripe, ledger transactions) reste dans `apps/akjol/src/lib/billing/`.

### 6.5 `@lychee/shared`

- `toProxyUrl(r2Url)` — réécrit une URL R2 vers un proxy local pour CORS / présignation simple.
- `displayName(user)` — `firstName lastName` ou fallback email.
- `formatTimestamp(date)` — format consistant.
- `assertTrustedUrl(url, trustedOrigin)` — guard SSRF (à utiliser avant tout `fetch()` côté serveur depuis input utilisateur).

### 6.6 `@lychee/ui`

- Source des composants shadcn (Radix + Tailwind).
- `apps/admin` importe directement depuis le package.
- `apps/akjol` garde **sa copie** dans `src/components/ui/` (historique : akjol a démarré avant le package, et quelques composants y sont customisés).

---

## 7. Authentification, middleware et onboarding

### 7.1 Clerk v7

- Login social + email magic link.
- Session via cookie httpOnly.
- Côté serveur : `auth()` retourne `{ userId, sessionId }`.
- Côté client : `useUser()`, `useAuth()`.
- Webhook `user.created` / `user.updated` → upsert dans la table `users`.

### 7.2 Callback `/auth/callback`

1. Vérifie un cookie `pending_invitation_token` → flow d'acceptation d'invitation.
2. Sinon, vérifie `workspaceMembers` pour l'utilisateur :
   - Membre → redirect `/akjol`.
   - Pas membre → `/organization` (début onboarding).

### 7.3 Onboarding (4 étapes, layout partagé)

| # | URL | But | Server action |
|---|-----|-----|---------------|
| 1 | `/organization` | Nom workspace, industrie, taille | `createWorkspaceAction` |
| 2 | `/billing` | Plan + Stripe Checkout | redirect Stripe |
| 3 | `/invite` | Jusqu'à 10 emails (skippable) | `inviteTeamMembersAction` |
| 4 | `/survey` | Role, source, use case | `submitSurveyAction` |

PostHog tracke chaque étape pour le funnel.

---

## 8. Base de données et ORM

ORM : **Drizzle**. DB : **Neon PostgreSQL serverless**. Tout le schéma vit dans `packages/db/src/schema.ts`.

### 8.1 Tables principales

| Table | But |
|-------|-----|
| `users` | Mirror des utilisateurs Clerk (id Clerk = PK) |
| `superAdmins` | userId + role + permissions JSON |
| `workspaces` | Tenant principal (Stripe customer id, subscription status, pool config) |
| `workspaceMembers` | (workspaceId, userId, role: primary_owner/owner/admin/member) |
| `projects` | Métadonnées projet (workspaceId, name, thumbnail) — canvas non stocké ici |
| `yjsSnapshots` | `(projectId, data: bytea)` — snapshot Yjs binaire |
| `projectComments` | Commentaires épinglés sur le canvas (posX, posY, parentId) |
| `projectShares` | Partage projet → user / workspace, role |
| `projectShareLinks` | Liens publics par token |
| `generations` | Historique de chaque génération IA (provider, taskId, status, resultUrl, creditsUsed, billedWorkspaceId, reservationTxId) |
| `plans` | Config plans (`starter`/`pro`/`enterprise`, monthly credits, caps, Stripe price id) |
| `creditCosts` | (provider, operation, qualifier) → credits |
| `licenses` | Sièges (userId, workspaceId, planId, period, isActive) |
| `pendingLicenseChanges` | Downgrades planifiés à la fin de période |
| `creditTransactions` | Ledger per-user, append-only (kind: reservation/debit/cancelled/grant/adjustment) |
| `poolTransactions` | Ledger per-workspace, idem |
| `invitations` | Invitations workspace par email |
| `userOnboarding` | Survey étape 4 |

### 8.2 Conventions Drizzle

- Noms de colonnes en `camelCase` côté Drizzle, mappés en `snake_case` côté SQL.
- FK avec `cascade` ou `set null` selon la sémantique métier.
- Index UNIQUE composites pour les invariants (ex. licenses uniques par user/workspace actif).
- Validation Zod côté API au-dessus du schéma Drizzle.

### 8.3 Migrations

```bash
pnpm db:push       # push direct (dev)
pnpm db:generate   # crée les migrations
pnpm db:migrate    # applique les migrations
pnpm db:akjol     # GUI Drizzle Akjol
```

---

## 9. API Routes (backend embarqué)

Wrappées avec `withContext()`. Structure REST conventionnelle.

### 9.1 Génération IA

| Route | Méthode | Comportement |
|-------|---------|--------------|
| `/api/generate` | POST | Endpoint central (switch sur le `type` de node). Réserve les credits → appelle le provider → débite ou annule. |
| `/api/generate/[taskId]` | GET | Polling Tripo. Re-uploade les URLs Tripo (expiration ~5 min) sur R2. |
| `/api/cron/poll-generations` | POST | Cron pour générations async, protégé par `CRON_SECRET`. |
| `/api/analyze-rig` | POST | Tripo `prerigcheck`. |

### 9.2 Projets

- `/api/projects/[id]` GET/PUT/DELETE/PATCH
- `/api/projects/[id]/snapshot` GET — snapshot Yjs hex (fallback si PartyKit indisponible)
- `/api/projects/[id]/shares` GET/POST
- `/api/projects/[id]/share-links` POST
- `/api/projects/[id]/comments` GET/POST

### 9.3 Billing

- `/api/billing/checkout` POST — Stripe Checkout session
- `/api/billing/me` GET — statut billing user
- `/api/billing/portal` POST — Stripe Customer Portal

### 9.4 Workspace

- `/api/workspace` POST
- `/api/workspace/me` GET
- `/api/workspace/switch` POST
- `/api/workspace/[id]` GET
- `/api/workspace/[id]/members` GET

### 9.5 Admin (super admin only)

- `/api/admin/credit-costs` GET/POST
- `/api/admin/invite` POST
- `/api/admin/licenses` GET/POST
- `/api/admin/pool` GET/POST
- `/api/admin/usage` GET

### 9.6 Webhooks

- `/api/webhooks/clerk` — `user.created`, `user.updated` → upsert users (sig `svix`).
- `/api/webhooks/stripe` — `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.

### 9.7 Upload

- `/api/upload` POST — retourne une presigned URL R2.

---

## 10. Providers IA (Gemini, Veo, Tripo3D)

### 10.1 Gemini Imagen (images)

Fichier : `apps/akjol/src/lib/providers/gemini.ts`. SDK `@google/genai`, key `GEMINI_API_KEY`.

| Fonction | Modèles | Paramètres |
|----------|---------|------------|
| `textToImage(prompt, opts)` | `gemini-2.5-flash-image`, `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview` (default) | `modelVersion`, `aspectRatio` (1:1, 16:9, 9:16, 4:3, 3:4), `imageSize` (1k/2k), `temperature` |
| `imageToImage(prompt, images[], opts)` | idem | idem |

### 10.2 Veo 3.1 (vidéos)

Modèle hardcodé : `veo-3.1-generate-preview`. Polling 5s, max 120 essais (~10 min), back-off exponentiel sur 429/500/503.

| Fonction | Particularité |
|----------|---------------|
| `textToVideo(prompt, opts)` | — |
| `textToVideoWithReferences(prompt, refImages[], opts)` | Max 3 images, durée forcée 8s |
| `imageToVideo(prompt, image, opts, lastFrame?)` | Interpolation entre frames |
| `extendVideo(prompt?, veoUri)` | **Nécessite le `veoUri` original**, 720p uniquement |

### 10.3 Tripo3D (3D)

API REST : `https://api.tripo3d.ai/v2/openapi`. Key `TRIPO_API_KEY`.

Versions : `"2.5"` → v2.5-20250123, `"3.0"` → v3.0-20250812, `"3.1"` → v3.1-20260211.

Fonctions principales : `uploadImage`, `textToModel`, `imageToModel`, `multiviewToModel`, `textureModel`, `preRigCheck`, `rigModel`, `retargetAnimation`, `importModelFromUrl`.

**Flow STS** (quand pas de task id existant) : `getStsToken("glb")` → `uploadToS3(buffer, sts)` (via `@aws-sdk/client-s3`) → `importModelViaSts(bucket, key)`.

**Important** : Tripo retourne des URLs qui **expirent en ~5 min** → les routes Next.js re-uploadent toujours le résultat sur R2 avant de renvoyer l'URL au client.

---

## 11. L'éditeur de workflow (canvas node-based)

> Cette section décrit le système qui sera réutilisé dans la **partie B** (prompt). Lis-la attentivement.

### 11.1 Stack du canvas

- **ReactFlow** (`@xyflow/react` v12) — rendu canvas, drag, zoom, pan, edges, handles.
- **Zustand** — state management côté client (single store).
- **Yjs** — source de vérité pour le canvas, synchronisé via PartyKit.
- **`nanoid(8)`** — IDs courts pour nodes (`node-XXXXXXXX`) et edges (`e-XXXXXXXX`).

### 11.2 Architecture conceptuelle

```
┌─────────────────────────────────────────────────────────────┐
│                  Canvas Editor (browser)                    │
│                                                             │
│  ┌────────────┐   onNodesChange/onEdgesChange/onConnect    │
│  │ ReactFlow  │ ────────────────────────────►              │
│  │ (UI)       │                                  ┌────────┐ │
│  └────────────┘ ◄── nodes/edges (subscribe) ─── │Zustand │ │
│         ▲                                       │ store  │ │
│         │ render                                └───┬────┘ │
│                                                     │      │
│                                                     ▼      │
│                                           ┌─────────────┐  │
│                                           │ writeNodes/ │  │
│                                           │ writeEdges  │──┼──► Y.Doc (CRDT)
│                                           └─────────────┘  │     │
│                                                            │     ▼
│                                                            │  IndexedDB
│                                                            │  + PartyKit WS
└─────────────────────────────────────────────────────────────┘
```

Boucle de mise à jour :

- **Local** : interaction utilisateur → ReactFlow émet un change → Zustand `applyNodeChanges` → écrit dans Y.Map (`syncChangedNodesToYMap`).
- **Distant** : Y.Map observe → `flushRemoteUpdates` (batch dans `requestAnimationFrame`, wrappé dans `startTransition`) → `setState({ nodes, edges })`.

### 11.3 NODE_TYPE_REGISTRY (single source of truth)

Fichier : `apps/akjol/src/lib/editor/node-types.ts`.

```ts
export type PortType = "text" | "image" | "3d" | "video";

export interface PortDefinition {
  id: string;        // ex. "text-in", "image-out", "3d-in"
  label: string;
  type: PortType;
  multiInput?: boolean;
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  category: "input" | "generation" | "output";
  subcategory?: "2d" | "3d" | "video";
  icon: LucideIcon;
  description: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  defaultData: Record<string, unknown>;
  provider?: "lychee-2d" | "lychee-3d" | "lychee-video" | "lychee-3d-rig" | "lychee-3d-animate" | "lychee-3d-lowpoly" | "lychee-3d-convert" | "lychee-3d-stylize";
  providerLabel?: string;
  comingSoon?: boolean;
}

export const NODE_TYPE_REGISTRY: Record<string, NodeTypeDefinition> = { ... };
```

Helpers exportés : `getNodesByCategory`, `getNodesBySubcategory`, `getAllNodes`, `searchNodes`, `getNodesAcceptingInput(portType)`, `getNodesProducingOutput(portType)`.

#### Catégories de nodes (Lychee)

- **Input** : `text-prompt`, `image-upload`, `sketch-upload`, `3d-upload`.
- **Generation 2D** : `text-to-image`, `image-to-image`, `sketch-to-image`, `image-to-multiview`.
- **Generation 3D** : `text-to-3d`, `image-to-3d`, `texture-model`, `smart-lowpoly`, `rig-model` (comingSoon), `animate-model` (comingSoon), `convert-model`, `stylize-model`.
- **Generation Video** : `text-to-video`, `image-to-video`, `video-extend`.
- **Output** : `image-preview`, `3d-viewer`.

### 11.4 Validation des connexions

Fichier : `apps/akjol/src/lib/editor/connection-validator.ts`.

```ts
export function isValidConnection(connection: Connection, nodes: Node[]): boolean {
  // 1) Récupérer node source + target dans nodes[]
  // 2) Récupérer leur NodeTypeDefinition dans NODE_TYPE_REGISTRY
  // 3) Trouver sourcePort dans def.outputs (par sourceHandle)
  // 4) Trouver targetPort dans def.inputs (par targetHandle)
  // 5) Retourner sourcePort.type === targetPort.type
}

export function isMultiInputPort(nodeType: string, handleId: string): boolean {
  const port = NODE_TYPE_REGISTRY[nodeType]?.inputs.find(p => p.id === handleId);
  return port?.multiInput === true;
}
```

Branchement dans le store :
- Si `multiInput === false`, **on supprime l'edge existante** sur ce target handle avant d'ajouter la nouvelle.
- Si `multiInput === true`, on accumule les edges (utilisé pour `image-to-image` qui accepte plusieurs images de référence).

### 11.5 Couleur des ports

Fichier : `apps/akjol/src/lib/editor/port-colors.ts`.

```ts
export const PORT_COLORS: Record<PortType, string> = {
  text: "#10b981",
  image: "#ee7768",
  "3d": "#f59e0b",
  video: "#ef4444",
};
export const PORT_COLOR_VARS: Record<PortType, string> = {
  text: "var(--port-text)",
  image: "var(--port-image)",
  "3d": "var(--port-3d)",
  video: "var(--port-video)",
};
```

Les `var(--port-*)` permettent un override pour les presets daltoniens (deuteranopia/protanopia/tritanopia).

### 11.6 BaseNode

Fichier : `apps/akjol/src/components/editor/nodes/base-node.tsx`.

- Wrapper **`memo()` obligatoire** — sinon ReactFlow déclenche des re-render en cascade.
- Lit la définition dans `NODE_TYPE_REGISTRY[type]`, dérive l'icône, la couleur d'accent (premier output → premier input → fallback gris).
- Rend :
  - **Header** : icône colorée + `def.label` + `def.providerLabel`.
  - **Body** : `children` (UI custom du node).
  - **Handles** : un par port via `<HandleWithButton>` qui inclut un bouton `+` pour spawner un node connecté.
- Position des handles : `topPercent = ((index + 1) / (count + 1)) * 100`.

### 11.7 Edges custom (couleur dérivée du type de port)

Fichier : `apps/akjol/src/components/editor/colored-edge.tsx`.

- Bezier path via `getBezierPath()`.
- **Subscription Zustand sélective** : on récupère seulement `${type}:${data.status}` du node source pour éviter les re-render inutiles.
- Si `status === "generating"`, on superpose un path animé (CSS class `edge-generating`).

### 11.8 Le store Zustand (cœur de l'éditeur)

Fichier : `apps/akjol/src/stores/editor-store.ts` (~1200 lignes). Sections :

#### Slice « Project »
```ts
projectId, projectName, projectRole: "editor"|"viewer", workspaceId, isCreator
setProject(id, name, role, workspaceId, isCreator)  // reset complet du store
setProjectName(name)
```

#### Slice « Canvas »
```ts
nodes: Node[], edges: Edge[]
onNodesChange, onEdgesChange, onConnect   // standard ReactFlow
```

`onNodesChange` :
- Si `viewer` → applique uniquement les changements `select`.
- Au début d'un drag → `pushHistory` (snapshot pre-drag).
- À la fin d'un drag → `pushHistory` différé (`setTimeout(..., 0)`).
- Filtre les changements selection-only pour éviter de marquer dirty / sync à Yjs.
- Pendant le drag → `scheduleDragSync` (1 sync max par frame).

`onConnect` :
- Vérifie `isValidConnection`.
- Si target port single-input → supprime l'edge existante.
- Ajoute edge avec `id: e-${nanoid(8)}`.
- Auto-comportements :
  - `image-to-multiview` → `image-to-3d` : passe le mode du node cible en `imageMode: "multiview"`.
  - Source vers `image-to-video` : `autoAssignVideoFrameSlots` remplit les slots first/last.
- Tracke event analytics.
- `pushHistory` + `syncEdges`.

#### Slice « Selection »
```ts
selectedNodeId: string | null, selectedNodeCount: number
setSelectedNode(id)
setBoxSelecting(active)   // suspend le single-select pendant box select
```

#### Slice « Interaction mode »
```ts
interactionMode: "select" | "hand" | "comment"
setInteractionMode(mode)
```

`hand` désactive `nodesDraggable`/`nodesConnectable`/`elementsSelectable` côté ReactFlow et active `panOnDrag={[0, 1]}` (clic gauche + clic droit pannent).

#### Slice « Actions »
```ts
addNode(type, position)
addNodeAndConnect(type, position, { existingNodeId, existingHandle, newNodeHandle, direction })
updateNodeData(nodeId, partialData)         // local user
applyRemoteNodeData(nodeId, partialData)    // server-pushed (bypass viewer guard)
deleteSelected()
arrangeNodes()                              // dagre-like auto-layout
copySelected() / paste(viewportCenter) / duplicateSelected(viewportCenter) / selectAll()
undo() / redo() (history MAX_HISTORY=50, structuredClone)
```

#### Slice « Generation »
```ts
runGeneration(nodeId)                       // POST /api/generate
analyzeRig(nodeId)                          // POST /api/analyze-rig
getConnectedInputData(nodeId)               // traverse edges entrants → { text, imageUrls, modelUrl, videoUrl, veoUri, sourceTaskId, sourceModelVersion }
```

#### Slice « Yjs / sync »
```ts
isDirty, isLocalDirty, isCanvasLoaded
syncStatus: "connected" | "reconnecting" | "offline" | "save-failed"
autoRetryActive
_ydoc, _wsProvider                          // setés par useYjsProvider
_writeNodesToYDoc, _writeEdgesToYDoc        // setés par useYjsProvider
_syncInternal()                             // utilisé par auto-retry
triggerManualSync(), triggerReconnect()
saveThumbnail()                             // html-to-image, max 1 / 30s
loadTemplateCanvas(templateId)
```

### 11.9 Undo / Redo

- Stack simple `_history: HistoryEntry[]` + `_historyIndex`. Max 50.
- À chaque mutation logique → `pushHistory(get, set)` :
  - Dedup cheap **avant** clone (compare ids + positions).
  - `structuredClone(nodes/edges)` (fallback `JSON.parse(JSON.stringify(...))`).
  - Strip `selected: false` sur les nodes (selection est éphémère).
  - Si `_historyIndex < length - 1`, on coupe le futur (branche).
- **`mergeGenerationState(restored)`** : à l'undo, on **réinjecte** les champs `status, resultUrl, taskId, progress, errorMessage, generationId, veoUri, generatedViews, rigAnalysis, lastGenerationParams` depuis un cache persistant (`_generationCache`) — sinon on perdrait un résultat de génération en faisant Cmd+Z par accident.
- Pendant un undo/redo : `_isUndoRedoing = true` empêche les observers Yjs de réagir.

### 11.10 Copy / Paste / Duplicate

- `copySelected()` → `_clipboard = { nodes: clonedSelected, edges: edgesEntreSelected }`.
- `paste(center)` → réinstancie tous les nodes avec **nouveaux IDs** (`nanoid(8)`), réécrit les edges avec un mapping ancien-id → nouveau-id, repositionne autour de `center`.
- `duplicateSelected(center)` → identique à copy + paste mais en un coup.
- `selectAll()` → marque tous les nodes `selected: true`.

### 11.11 Drag & drop depuis la palette

- Palette / command palette : chaque tile a `draggable` + `onDragStart` qui set `event.dataTransfer.setData("application/reactflow-node-type", type)`.
- Canvas : `onDragOver` (preventDefault + `dropEffect = "move"`) puis `onDrop` qui lit le type, vérifie `comingSoon`, calcule la position via `screenToFlowPosition` et appelle `addNode`.

### 11.12 Création connectée via bouton « + »

`HandleWithButton` est rendu par `BaseNode`. Au clic sur `+`, un popup (`PortMenuPopup`) liste les nodes compatibles selon `getNodesAcceptingInput(portType)` ou `getNodesProducingOutput(portType)`. Quand on choisit un type, on appelle `addNodeAndConnect(type, position, { existingNodeId, existingHandle, newNodeHandle: <premier port compatible>, direction })`.

### 11.13 Configuration ReactFlow concrète

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}                  // map type → composant React
  edgeTypes={{ default: ColoredEdge }}
  isValidConnection={handleIsValidConnection}
  onDragOver={onDragOver}
  onDrop={onDrop}
  onPaneContextMenu={onContextMenu}
  onPaneClick={handlePaneClick}          // double-click → command palette
  minZoom={0.1}
  maxZoom={3}
  zoomOnDoubleClick={false}
  panOnDrag={isPanning ? [0, 1] : [1]}   // hand mode = clic gauche pan
  panOnScroll
  selectionOnDrag={!isPanning}
  selectNodesOnDrag={false}
  fitView
  nodesDraggable={!isViewer && !isPanning}
  nodesConnectable={!isViewer && !isPanning}
  elementsSelectable={!isPanning}
  edgesReconnectable={!isViewer && !isPanning}
  deleteKeyCode={isViewer ? [] : ["Backspace", "Delete"]}
>
  <Background variant={BackgroundVariant.Dots} color="#4d5263" gap={24} size={2} />
  <MiniMap nodeComponent={MiniMapNode} ... />
  <CanvasComments />
</ReactFlow>
```

### 11.14 Raccourcis clavier (gérés dans `editor-canvas.tsx`)

- **Cmd/Ctrl+Z** : undo (refusé si génération en cours — toast warning).
- **Cmd/Ctrl+Shift+Z** ou **Cmd+Y** : redo.
- **Cmd/Ctrl+C/V/D** : copy / paste / duplicate (paste/duplicate au centre du viewport).
- **Cmd/Ctrl+A** : select all.
- **Shift+A** : auto-arrange + fitView.
- **Espace maintenu** : passe temporairement en `hand` mode (mémorise le mode précédent).
- **Clic milieu maintenu** : idem espace (`panOnDrag={[1]}` natif ReactFlow).
- **Double-clic pane** : ouvre command palette à la position cliquée.
- **Touches de mode** (configurables via `usePreferencesStore.getShortcut`) : select / hand / comment / commandPalette / fitView / runGeneration / zoomIn / zoomOut.
- **Backspace/Delete** : suppression (désactivé pour les viewers).

### 11.15 Curseurs et présence

- Throttle 50 ms (20 fps max) pour `updateCursor(pos)` côté CollaborationContext.
- `updateSelectedNode(selectedNodeId)` broadcast la sélection via Yjs awareness.
- `CursorLayer` rend les curseurs des autres collaborateurs sur l'écran.
- `RemoteSelectionLayer` souligne les nodes sélectionnés par les autres.
- `presence-avatars.tsx` rend la liste d'avatars connectés.

### 11.16 Persistence : Yjs binaire dans Postgres

- **Source de vérité** = `Y.Doc` partagé entre tous les peers via PartyKit.
- PartyKit persiste un snapshot binaire dans `yjsSnapshots(projectId, data: bytea, updatedAt)`.
- Côté client, `y-indexeddb` cache le doc localement (survit refresh/crash) avec un nettoyage automatique des projets non visités > 7 jours.
- **Fallback REST** : si la sync PartyKit ne se fait pas en 8 s, on charge `/api/projects/[id]/snapshot` (hex string), `Y.applyUpdate(doc, bytes)`, et on remplit nodes/edges depuis le Y.Map.

---

## 12. Viewer 3D et animations

### 12.1 `useModelLoader` (`apps/akjol/src/lib/utils/use-model-loader.ts`)

- Cache **LRU module-level** (max 20 entrées, clé = URL) — survit aux remounts.
- Phases : `"idle"` → `"downloading"` (progress %) → `"ready"` | `"error"`.
- Download via `XMLHttpRequest` avec `onprogress`.
- Parsing via `GLTFLoader` + `DRACOLoader` (decoder Google CDN).
- Extraction de vertex pour le point cloud via `sampleVertices(scene, maxParticles)`.

### 12.2 Point cloud reveal

`apps/akjol/src/components/editor/point-cloud-scene.tsx` — particules WebGL avec shaders GLSL custom :
- Chaque particule a un `aFlowOffset` random pour mouvement organique.
- Phases : `"reveal"` (puff radial) → `"transitioning"` (modèle visible 50%) → `"done"` (shimmer).
- Couleur primaire `#ee7768`, blending additif, `depthWrite: false`.

### 12.3 Viewer inline (dans le node)

- Canvas 200 px dans le node ReactFlow.
- Camera `{ position: [5, 0, 0], fov: 20 }`.
- **Toujours cloner la scène GLTF avec `SkeletonUtils.clone()`** — sinon les viewers se partagent les meshes et les transformations interfèrent.
- Détection des textures par traversée des matériaux des meshes.
- Lecture de la première animation si présente.

### 12.4 Viewer fullscreen

`fullscreen-preview.tsx` — overlay via `createPortal` dans `document.body`. Supporte image/video/3D.

Mode 3D :
- `OrbitControls` + `GizmoHelper`, `Bounds` pour auto-fit, grille infinie au sol.
- 3 modes de rendu : **Texture** (matériaux + `Environment preset="akjol"`), **Mesh** (matcap shader), **Normal** (`MeshNormalMaterial`).
- Timeline scrubber, play/pause, vitesse 0.25x–2x, sélecteur de clip, restart/end.
- Toggle `SkeletonHelper` (couleur ambre).

---

## 13. Collaboration temps réel (Yjs + PartyKit)

### 13.1 Pourquoi Yjs

- CRDT → merge automatique sans conflit.
- Awareness protocol pour la présence (curseurs, sélection).
- Persistence locale gratuite via `y-indexeddb`.
- Format binaire compact (vs. JSON).

### 13.2 Pourquoi PartyKit

- Cloudflare Durable Objects — **un room par projet** (room.id = projectId).
- WebSocket natif, sticky par défaut.
- Auth via JWT Clerk dans `onBeforeConnect`.
- Persistence Neon depuis l'edge.

### 13.3 Structure du Y.Doc

```
Y.Doc
├── Y.Map<string, string>  "nodes"     (key = nodeId, value = JSON.stringify(node))
├── Y.Map<string, string>  "edges"     (key = edgeId, value = JSON.stringify(edge))
└── Y.Array<commentJSON>   "comments"
```

**Pourquoi du JSON dans Y.Map ?** Plus simple que de mapper chaque champ (position, data, etc.) dans des Y.Map imbriqués. La granularité par-node suffit pour les conflits métier.

### 13.4 `useYjsProvider` (`apps/akjol/src/lib/collaboration/use-yjs-provider.ts`)

Layers de persistence :
1. **`y-indexeddb`** — cache navigateur instantané.
2. **`y-partykit/provider`** — WebSocket vers PartyKit qui persiste sur Neon.

Boucle remote → local :
- Y.Map observe → on accumule `pendingNodeChanges` / `pendingEdgeChanges` (action: add/update/delete).
- `requestAnimationFrame(flushRemoteUpdates)` → on applique tout dans un seul `setState` wrappé dans `startTransition` (priorité basse).
- Avec 3+ peers : 1 render par frame au lieu de 3-6.

Boucle local → remote :
- `_writeNodesToYDoc(nodes)` (exposé sur le store) → `nodesToYMap(nodes, yNodes)` (strip `selected` + `dragging`).
- Pendant un drag : `scheduleDragSync` → 1 write max par animation frame.

Sync status :
- `connected` → invisible.
- `reconnecting` (< 5 s) → invisible (chip apparaît seulement si > 5 s).
- `offline` → chip + bouton « Reconnect ».
- `save-failed` → chip « Saved locally » + bouton « Sync » + auto-retry exponentiel (max 10 tentatives).

Resume polling Tripo :
- Au sync initial, on parcourt les nodes : si `data.status === "generating"` et `data.taskId` présent → import dynamique de `resumeTripoPolling` et reprise du polling.

### 13.5 PartyKit canvas server (`apps/akjol/partykit/canvas.ts`)

Responsabilités :
- **Auth** : vérifie le JWT Clerk dans `onBeforeConnect`, résout le rôle (`editor` / `viewer`) en queryant la DB.
- **Sync Yjs** : `onConnect` from `y-partykit` (gère merge + persistence).
- **Persistence** : sauve le snapshot binaire dans `yjsSnapshots`.
- **Tripo polling background** : reçoit un `POST` (auth via `PARTYKIT_SERVICE_SECRET`) avec un taskId à poller, push les events `gen_progress`, `gen_complete`, `gen_failed` aux clients connectés via `room.broadcast`.
- **Viewer enforcement** : rejette toute mutation Y.Doc venant d'un viewer.
- **Recovery** : `onStart` restaure les polls actifs depuis le storage Cloudflare DO.

---

## 14. Partage de projets

### 14.1 `projectShares` (direct)

Partager un projet à un user ou un workspace, role `editor` ou `viewer`.

### 14.2 `projectShareLinks` (public)

Liens token-based, role, expiration optionnelle, revocable.

### 14.3 Résolution des permissions

`apps/akjol/src/lib/auth/project-access.ts` :

1. Owner du projet (via workspace) → `editor`.
2. `projectShares` direct → role défini.
3. `projectShareLinks` valide non-révoqué → role défini.
4. Sinon → `null` (403).

---

## 15. Système de billing / credits / pool

### 15.1 Modèle

- **Seat-based** via Stripe.
- Chaque membre actif a une **licence** (siège) liée à un plan.
- Credits accordés mensuellement par licence.
- Pool optionnel par workspace (cap mensuel, top-up Stripe one-time).

### 15.2 Flow

1. **Checkout** : `/api/billing/checkout` → session Stripe.
2. **Webhook `checkout.session.completed`** : crée première licence + accorde credits.
3. **Webhook `invoice.paid`** (mensuel) : renouvelle credits, applique pending downgrades, envoie email facture.
4. **Customer Portal** : `/api/billing/portal`.

### 15.3 Operations

| Op | Effet | Credits |
|----|-------|---------|
| Add seat | nouvelle licence, facturation immédiate | proratas |
| Assign seat | siège vide → user | transfert depuis lastHolder |
| Upgrade | changement plan, facture delta | delta proratas |
| Downgrade | `pendingLicenseChange` à effet renouvellement | aucun changement immédiat |
| Delete seat | supprime siège non-assigné | — |

### 15.4 Ledger

- `creditTransactions` (per-user) et `poolTransactions` (per-workspace), append-only.
- Balance = `SUM(amount)`.
- Kinds : `reservation` → `debit` (succès) ou `cancelled` (échec) ; aussi `grant`, `adjustment`.

---

## 16. Storage objets (Cloudflare R2)

- API S3-compatible.
- Client : `apps/akjol/src/lib/r2.ts` (`@aws-sdk/client-s3` + `s3-request-presigner`).
- Upload côté client via presigned URL générée par `/api/upload`.
- Affichage dans le navigateur via `toProxyUrl()` (rewrite vers proxy interne pour éviter problèmes CORS).
- **SSRF guard** : avant tout `fetch()` côté serveur depuis input user, `assertTrustedUrl(url, env.R2_PUBLIC_URL)`.

---

## 17. Logging, errors et observabilité

### 17.1 Pino

- `console.log/warn/error` **interdit** côté serveur.
- Domain loggers : `logger.child({ domain: "billing" })`, `domain: "tripo"`, etc.
- Format JSON structuré, pretty en dev.

### 17.2 RequestContext (AsyncLocalStorage)

- `RequestContext.run({ requestId, userId? }, async () => { ... })`.
- Tous les logs émis dans le scope héritent du contexte.

### 17.3 AppError hierarchy (`@lychee/logger`)

```
AppError(message, status)
├── AuthError       → 401
├── NotFoundError   → 404
├── ValidationError → 422
└── ConflictError   → 409
```

`withContext()` traduit automatiquement en `Response.json({ error }, { status })`.

### 17.4 `instrumentation.ts`

Présent dans akjol et admin. Init Pino au démarrage de l'app.

---

## 18. Analytics

- **PostHog**.
- Client : `apps/akjol/src/lib/analytics.ts` (wrapper) + `apps/akjol/src/providers/posthog-provider.tsx`.
- Server : `apps/akjol/src/lib/posthog.ts`.
- Events : onboarding steps, project created, edge connected, node added, generation requested/completed, billing events.

---

## 19. Email transactionnel

- **Resend** via `apps/akjol/src/lib/email.ts`.
- Sender : `Lychee Akjol <${EMAIL_FROM_ADDRESS}>`.
- Templates React Email (`apps/akjol/src/emails/`), thème dark, accent `#ee7768`.

| Template | Trigger |
|----------|---------|
| `welcome.tsx` | création workspace |
| `team-invitation.tsx` | invitation membre |
| `beta-access-granted.tsx` | `betaStatus → "active"` |
| `invoice-paid.tsx` | webhook Stripe `invoice.paid` (envoyé aux admins) |

---

## 20. Super Admin (app distincte)

`apps/admin/` — Next.js séparée sur `localhost:3001`.

Pages :
- `/` — KPIs (workspaces actifs, MRR, usage).
- `/workspaces` + `/workspaces/[id]` (membres, licences, transactions).
- `/users`.
- `/plans` — CRUD plans + table coût credits.
- `/billing` — santé subscriptions.
- `/usage` — analytics par provider/workspace.

Gate : `requireSuperAdmin()` dans le root layout. 403 sinon.

---

## 21. Conventions de code et naming

- Composants nodes wrappés dans `memo()` — obligatoire.
- Classes CSS `nodrag` et `nowheel` sur les inputs/sliders/selects à l'intérieur des nodes — sinon ReactFlow intercepte.
- Toutes les `data` de node **JSON-serializable** (pas de fonction, pas de ref DOM).
- IDs : `node-${nanoid(8)}`, `e-${nanoid(8)}`.
- URLs R2 affichées : passer par `toProxyUrl()`.
- URLs serveur fetched : `assertTrustedUrl()` d'abord (SSRF).
- Anglais partout (code, UI, emails).
- Brand : coral `#ee7768`, vert `#a3cf91`, font OLIVE Display + Roboto, **dark mode only**.
- Naming : node types kebab-case (`text-to-image`), composants PascalCase, store actions camelCase, DB tables camelCase Drizzle / snake_case SQL.
- Packages : `@lychee/<name>` (workspace protocol).

---

## 22. Variables d'environnement

Config `apps/akjol/src/env.ts` via `@t3-oss/env-nextjs`. Fichier `.env.local` à la racine du monorepo.

### Server

`DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `TRIPO_API_KEY`, `GEMINI_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_URL`, `CRON_SECRET`, `PARTYKIT_SERVICE_SECRET`.

### Client (`NEXT_PUBLIC_*`)

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PARTYKIT_HOST`.

---

## 23. Dev local : commandes et workflow

```bash
# Bootstrap
pnpm install

# Dev
pnpm turbo dev                                # akjol + admin
pnpm turbo dev --filter=akjol                # akjol only
pnpm turbo dev --filter=admin                 # admin only
cd apps/akjol && pnpm partykit:dev           # PartyKit (1999)

# Build
pnpm turbo build
pnpm turbo build --filter=akjol

# DB
pnpm db:push / db:generate / db:migrate / db:akjol

# Lint
pnpm turbo lint

# Templates
npx tsx scripts/seed-templates.ts             # local DB depuis staging
npx tsx scripts/seed-templates.ts --staging-dest
npx tsx scripts/seed-templates.ts --prod-dest # confirmation typée
```

`.npmrc` utilise `public-hoist-pattern` (R3F + Clerk types) — pas de `shamefully-hoist`.

---

## 24. ADR — Décisions d'architecture

| ID | Décision | Statut |
|----|----------|--------|
| ADR-001 | REST via Next.js API routes (pas de GraphQL) | Accepté |
| ADR-002 | Drizzle plutôt que Prisma | Accepté |
| ADR-003 | Zustand pour le state client | Accepté |
| ADR-004 | ReactFlow pour le canvas node-based | Accepté |
| ADR-005 | React Three Fiber pour le 3D | Accepté |
| ADR-006 | Yjs CRDT pour le canvas (remplace JSON sérialisé) | Accepté (mars 2026) |
| ADR-007 | `fetch` natif plutôt qu'Axios | Accepté |
| ADR-008 | Zod pour la validation | Accepté |
| ADR-009 | Monorepo Turborepo + pnpm | Accepté (mars 2026) |
| ADR-010 | Pino pour le structured logging | Accepté |

---

## 25. Portes de sortie pour scaler

| Composant | Migration possible |
|-----------|-------------------|
| Clerk | Auth.js + Postgres custom |
| Neon | RDS / Supabase / self-hosted Postgres |
| Drizzle | n'importe quel ORM (schéma TS standard) |
| Vercel | Railway / Coolify / AWS Amplify / Docker |
| R2 | S3 / Backblaze B2 (API S3-compatible) |
| Resend | SendGrid / Postmark / SES |
| PostHog | self-hostable (open source) |
| PartyKit | y-websocket self-hosted |
| ReactFlow | code possédé, pas de lock-in |
| Gemini/Veo / Tripo | providers abstraits dans `lib/providers/` |

---

# PARTIE B — PROMPT

## 26. PROMPT autonome : reproduire le canvas Node/Edge ailleurs

> ✂️ **Tout ce qui suit ce séparateur est un prompt prêt à coller dans un agent.** Il ne réfère à aucune partie du document, il est self-contained. Il décrit comment implémenter un système canvas node-based identique à celui de Lychee Akjol dans n'importe quel projet React/Next.js.

```
─────────────────────────────────────────────────────────────────────────
PROMPT — IMPLÉMENTER UN CANVAS NODE-BASED RÉUTILISABLE
─────────────────────────────────────────────────────────────────────────

# Rôle
Tu es un agent de développement front-end. Implémente dans ce projet un éditeur
de workflow node-based (style ComfyUI / n8n / Blender Geometry Nodes), inspiré
de l'architecture Lychee Akjol. L'utilisateur compose visuellement un pipeline
en branchant des "nodes" via des "ports" colorés. Chaque node est piloté par un
"registry" central qui décrit ses ports, son UI, ses paramètres par défaut.

# Stack imposée
- React 19+ avec TypeScript strict.
- ReactFlow via `@xyflow/react` v12.
- Zustand v5 (un seul store global pour le canvas).
- `nanoid` pour les IDs (`node-${nanoid(8)}` / `e-${nanoid(8)}`).
- Tailwind pour le style. Dark mode par défaut, accent par type de port.
- (Optionnel collab) Yjs + `y-partykit/provider` + `y-indexeddb`.

# Architecture conceptuelle
1. NODE_TYPE_REGISTRY = la SEULE source de vérité pour : type, label, icône,
   catégorie, ports d'entrée/sortie, defaultData, provider, comingSoon.
2. Le store Zustand contient `nodes: Node[]` et `edges: Edge[]` plus toute la
   logique métier (selection, history, copy/paste, generation, sync).
3. ReactFlow est une vue PURE du store (pas de useState local pour le canvas).
4. La validation des connexions se fait sur la base du `PortType` (les ports
   d'un même type peuvent se connecter, sinon refus).

# Étapes à implémenter, dans l'ordre

## Étape 1 — Le registry et les types

Crée `lib/editor/node-types.ts` :

  export type PortType = "text" | "image" | "3d" | "video"; // adapte aux types de ton projet

  export interface PortDefinition {
    id: string;            // ex. "text-in", "image-out"
    label: string;
    type: PortType;
    multiInput?: boolean;  // true => le port accepte plusieurs edges
  }

  export interface NodeTypeDefinition {
    type: string;
    label: string;
    category: "input" | "generation" | "output";
    subcategory?: string;
    icon: LucideIcon;
    description: string;
    inputs: PortDefinition[];
    outputs: PortDefinition[];
    defaultData: Record<string, unknown>;
    provider?: string;
    providerLabel?: string;
    comingSoon?: boolean;
  }

  export const NODE_TYPE_REGISTRY: Record<string, NodeTypeDefinition> = { ... };

Helpers exportés :
  getNodesByCategory(cat), getNodesBySubcategory(sub), getAllNodes(),
  searchNodes(query), getNodesAcceptingInput(portType),
  getNodesProducingOutput(portType).

## Étape 2 — Couleurs des ports

`lib/editor/port-colors.ts` :

  export const PORT_COLORS: Record<PortType, string> = {
    text: "#10b981", image: "#ee7768", "3d": "#f59e0b", video: "#ef4444",
  };
  export const PORT_COLOR_VARS: Record<PortType, string> = {
    text: "var(--port-text)", image: "var(--port-image)",
    "3d": "var(--port-3d)", video: "var(--port-video)",
  };

Définis les `--port-*` dans le CSS global pour permettre des thèmes daltoniens.

## Étape 3 — Validation des connexions

`lib/editor/connection-validator.ts` :

  export function isValidConnection(connection: Connection, nodes: Node[]): boolean {
    const src = nodes.find(n => n.id === connection.source);
    const tgt = nodes.find(n => n.id === connection.target);
    if (!src || !tgt) return false;
    const srcDef = NODE_TYPE_REGISTRY[src.type ?? ""];
    const tgtDef = NODE_TYPE_REGISTRY[tgt.type ?? ""];
    if (!srcDef || !tgtDef) return false;
    const srcPort = srcDef.outputs.find(p => p.id === connection.sourceHandle);
    const tgtPort = tgtDef.inputs.find(p => p.id === connection.targetHandle);
    if (!srcPort || !tgtPort) return false;
    return srcPort.type === tgtPort.type;
  }

  export function isMultiInputPort(nodeType: string, handleId: string): boolean {
    return NODE_TYPE_REGISTRY[nodeType]?.inputs
             .find(p => p.id === handleId)?.multiInput === true;
  }

## Étape 4 — Le store Zustand

`stores/editor-store.ts` exporte un `useEditorStore` avec ces slices :

  Project (si tu sauvegardes des canvases distincts) :
    projectId, projectName, projectRole ("editor" | "viewer"),
    setProject(id, name, role) qui RESET tout (history, clipboard, nodes, edges).

  Canvas :
    nodes, edges,
    onNodesChange (applyNodeChanges + push history en début et fin de drag,
                   filtre les selection-only pour ne pas marquer dirty),
    onEdgesChange (applyEdgeChanges, push history au remove),
    onConnect (valide via isValidConnection, supprime l'edge existante sur le
               target handle si single-input, ajoute edge avec id e-${nanoid(8)},
               push history).

  Selection :
    selectedNodeId, selectedNodeCount, setSelectedNode,
    setBoxSelecting(active) (suspend le single-select pendant box-select).

  Interaction mode :
    interactionMode: "select" | "hand" | "comment",
    setInteractionMode.

  Actions :
    addNode(type, position) — crée un node avec id node-${nanoid(8)},
                              data = { label, ...def.defaultData }, selected=true,
                              désélectionne les autres, push history.
    addNodeAndConnect(type, position, { existingNodeId, existingHandle,
                                        newNodeHandle, direction }) — crée
                              le node + l'edge dans la foulée.
    updateNodeData(nodeId, partialData) — merge dans data, push history si
                              changement non-volatile (skip pour status/progress
                              en cours de génération).
    deleteSelected() — supprime les nodes sélectionnés et toutes les edges
                       incidentes.
    arrangeNodes() — auto-layout (dagre ou ELK).
    copySelected / paste(viewportCenter) / duplicateSelected(viewportCenter) /
                                                                  selectAll.

  Undo/Redo :
    history: HistoryEntry[] (MAX 50), historyIndex,
    pushHistory(get, set) :
      - dedup cheap AVANT clone (compare ids + positions).
      - structuredClone(nodes/edges), strip selected.
      - trim future si historyIndex < length - 1.
    undo() retourne true | false | "generating" (refus si génération en cours).
    redo().
    canUndo, canRedo.
    Implémente un _generationCache (Map<nodeId, persistentFields>) qui survit
    aux undo : à chaque restore, mergeGenerationState() réinjecte status,
    resultUrl, taskId, progress, errorMessage, generationId, etc. — un undo
    accidentel ne doit JAMAIS perdre un résultat de génération.

  Dirty state :
    isDirty (toute modif), isLocalDirty (uniquement les modifs LOCALES — utile
    pour décider quand capturer un thumbnail).

## Étape 5 — BaseNode component

`components/editor/nodes/base-node.tsx` :

  - export const BaseNode = memo(...)  // OBLIGATOIRE memo()
  - Lit la def via NODE_TYPE_REGISTRY[type].
  - Couleur d'accent = PORT_COLOR_VARS[def.outputs[0]?.type ?? def.inputs[0]?.type].
  - Layout :
      div w-[280px] rounded-xl border bg-[#2d3039]
      borderTopColor: accent, borderTopWidth: 3px
      Header (icône colorée + label + providerLabel)
      Body (children = UI custom du node)
      Handles inputs à gauche, outputs à droite, espacés équitablement
      via topPercent = ((index + 1) / (count + 1)) * 100
  - Chaque handle accompagné d'un bouton "+" : au clic, popup listant les
    nodes compatibles (utilise getNodesAcceptingInput / getNodesProducingOutput).
    Choix → addNodeAndConnect.

Tous les inputs/sliders/selects DANS le node doivent avoir les classes
"nodrag" et "nowheel" (sinon ReactFlow intercepte).

Toutes les data du node doivent être JSON-serializable (pas de fonctions,
pas de DOM refs).

## Étape 6 — ColoredEdge custom

`components/editor/colored-edge.tsx` :

  - export const ColoredEdge = memo(...).
  - Récupère depuis le store une PRIMITIVE :
      const sourceKey = useEditorStore(s => {
        const n = s.nodes.find(n => n.id === source);
        return n ? `${n.type}:${n.data?.status}` : "";
      });
    (Une primitive => Object.is, pas de re-render parasite.)
  - Calcule la couleur via PORT_COLOR_VARS[port.type] du sourceHandle.
  - Bezier path via getBezierPath().
  - Si status === "generating", rend en plus un path animé par-dessus.

Branche dans ReactFlow :  edgeTypes={{ default: ColoredEdge }}

## Étape 7 — EditorCanvas (composant racine)

`components/editor/editor-canvas.tsx` :

  - "use client";
  - Subscribe finement au store (un select par valeur).
  - Hook useReactFlow pour screenToFlowPosition, fitView, zoomIn/Out.
  - Throttle cursor broadcast à 50 ms (20 fps).
  - Gère onDragOver / onDrop pour la palette (dataTransfer key
    "application/reactflow-node-type"), refuse les types comingSoon.
  - Gère onPaneContextMenu (menu contextuel) et onPaneClick avec détection
    double-click (< 400 ms et < 10 px) pour ouvrir une command palette.
  - Raccourcis clavier (window keydown) :
      Cmd/Ctrl+Z / Cmd+Shift+Z / Cmd+Y → undo/redo.
      Cmd+C/V/D → copy/paste/duplicate (au centre du viewport pour V/D).
      Cmd+A → selectAll.
      Shift+A → arrangeNodes + fitView.
      Espace tenu → mode "hand" temporaire (mémorise le mode précédent).
      Clic milieu tenu → idem.
      Touches simples (configurables) : select / hand / comment / palette /
      fitView / runGeneration / zoomIn / zoomOut.
      Backspace/Delete → suppression (désactivé en viewer).
    Toujours guard "isInputFocused()" (skip les shortcuts si textarea/input).

  - ReactFlow props :
      nodeTypes, edgeTypes={{ default: ColoredEdge }},
      isValidConnection, onDragOver, onDrop, onPaneContextMenu, onPaneClick,
      minZoom={0.1}, maxZoom={3}, zoomOnDoubleClick={false},
      panOnDrag={isPanning ? [0, 1] : [1]}, panOnScroll, fitView,
      selectionOnDrag={!isPanning}, selectNodesOnDrag={false},
      nodesDraggable / nodesConnectable / elementsSelectable / edgesReconnectable
        désactivés si viewer ou hand mode,
      deleteKeyCode = isViewer ? [] : ["Backspace", "Delete"].
    + Background variant=Dots et MiniMap custom.

## Étape 8 — Persistence (sérialisation)

Avant de sauvegarder nodes/edges (que ce soit en JSON, dans Yjs, ou en DB) :
  STRIPER les champs éphémères : `selected`, `dragging`. Ils représentent un
  état UI local et ne doivent jamais être persistés.

Pour la collab temps réel (optionnel) :
  - Y.Doc avec Y.Map<string, string> "nodes" et "edges"
    (key = id, value = JSON.stringify(stripEphemeral(item))).
  - Observer Y.Map → batcher dans requestAnimationFrame → setState wrappé
    dans React.startTransition (priorité basse pour ne pas bloquer l'UI).
  - Provider PartyKit ou y-websocket. Cache local via y-indexeddb.
  - Fallback REST si la sync n'arrive pas après 8 s (Y.applyUpdate(doc, bytes)).
  - Sync status : "connected" | "reconnecting" | "offline" | "save-failed",
    le chip n'apparaît que > 5 s pour ne pas flasher en cas de glitch réseau.

## Étape 9 — Auto-comportements lors d'une connexion (optionnel)

Dans onConnect, après avoir ajouté l'edge, applique des auto-effets selon le
type des nodes connectés. Exemples :
  - Si source = "image-to-multiview" et target = "image-to-3d" :
        updateNodeData(target, { imageMode: "multiview" }).
  - Si target = "image-to-video" : auto-assigner les frame slots
    (first/last) en fonction des images entrantes.

Ces auto-comportements vivent dans le store, pas dans les composants.

## Étape 10 — Modes viewer

Ajoute un projectRole = "editor" | "viewer". En viewer :
  - onNodesChange n'applique QUE les changements de type "select".
  - onEdgesChange / onConnect / addNode / updateNodeData / deleteSelected /
    arrangeNodes / paste / duplicate sont tous no-op.
  - ReactFlow a nodesDraggable=false, nodesConnectable=false,
    edgesReconnectable=false, deleteKeyCode=[].
  - Pour les updates server-pushed (résultats de génération qui doivent être
    visibles par tous), expose un applyRemoteNodeData qui BYPASS le viewer
    guard.

# Conventions IMPORTANTES (à respecter sans exception)

- TOUS les composants de node sont wrappés dans memo(). Sans ça, ReactFlow
  re-render en cascade dès qu'un node change.
- Les inputs/textareas/selects DANS un node ont les classes "nodrag" et
  "nowheel".
- Les data des nodes sont JSON-serializable (pas de Map, Date, fonction, ref).
- Tous les IDs de node : `node-${nanoid(8)}`. Tous les IDs d'edge : `e-${nanoid(8)}`.
- La position des nodes est en coordonnées du flow, pas du screen — utilise
  toujours `screenToFlowPosition()` quand tu pars d'un événement souris.
- Pendant un drag, throttle l'écriture vers la persistance (Yjs ou debounce
  REST) à max 1 par animation frame.
- Le selected/dragging est éphémère et ne doit JAMAIS être restauré par
  l'undo ou persisté.
- Les fields "résultats de génération" (status, resultUrl, taskId, progress,
  errorMessage, generationId, ...) doivent survivre à un undo/redo via un
  cache séparé.

# Livrables attendus

1. lib/editor/node-types.ts (registry + helpers).
2. lib/editor/connection-validator.ts.
3. lib/editor/port-colors.ts.
4. stores/editor-store.ts (Zustand complet, slices ci-dessus).
5. components/editor/nodes/base-node.tsx + index.ts (mapping type → composant).
6. components/editor/colored-edge.tsx.
7. components/editor/editor-canvas.tsx.
8. (Optionnel) components/editor/node-command-palette.tsx, node-palette.tsx,
   canvas-context-menu.tsx, port-menu-popup.tsx, handle-with-button.tsx.
9. (Optionnel collab) lib/collaboration/yjs-sync.ts + use-yjs-provider.ts.

# Ordre de travail recommandé

1. Étapes 1 → 4 (types + validator + colors + store SANS history ni collab).
2. Étape 5 (BaseNode) avec un seul type de node de test.
3. Étape 7 (EditorCanvas minimal) : pouvoir add un node, le déplacer, le
   connecter. Ne fait pas plus tant que ça ne marche pas.
4. Étape 6 (ColoredEdge).
5. Implémente la palette + command palette + context menu.
6. History/copy/paste.
7. Modes viewer + interaction modes.
8. (Optionnel) Yjs/PartyKit pour la collab temps réel.

# Tests manuels à passer avant de considérer le travail terminé

- Drag & drop d'un node depuis la palette dans le canvas.
- Connexion entre deux ports compatibles (couleur identique).
- Refus de connexion entre ports incompatibles (visuel + état).
- Multi-input : on peut connecter 2+ sources sur un port multiInput.
- Single-input : connecter une 2e source remplace la 1ère.
- Cmd+Z / Cmd+Shift+Z restaurent l'état précédent.
- Copy/paste/duplicate fonctionnent et ne dupliquent pas les IDs.
- Mode hand pan le canvas, désactive le drag/connect.
- Espace maintenu = hand temporaire ; relâcher = retour au mode précédent.
- Double-clic sur le pane ouvre la command palette à la position cliquée.
- Backspace supprime les nodes sélectionnés et leurs edges.
- En mode viewer, aucune modification n'est possible.

─────────────────────────────────────────────────────────────────────────
FIN DU PROMPT
─────────────────────────────────────────────────────────────────────────
```

