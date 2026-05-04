# AkJol — Chemin Blanc

Plateforme d'orientation : découvre les métiers et les poursuites d'études adaptés à ta situation.

## Stack MVP

- **Next.js 16** (App Router) + **React 19** + **Tailwind 4**
- **SQLite** (better-sqlite3) + **Drizzle ORM**
- **Turborepo** + **pnpm workspaces**
- **Pino** (logging) + **Zod** (validation)
- 100% open-source, zéro service externe payant.

## Structure

```
akjol/
├── apps/
│   └── akjol/          # App Next.js (port 3000)
├── packages/
│   ├── db/              # @akjol/db — schéma Drizzle + createDb()
│   ├── logger/          # @akjol/logger — Pino + AppError + RequestContext
│   ├── shared/          # @akjol/shared — utils communs
│   └── ui/              # @akjol/ui — composants partagés
├── data/                # SQLite local (gitignored)
├── docs/                # Documentation d'architecture
└── scripts/             # Seed, migrations one-shot
```

## Démarrage

```bash
pnpm install
pnpm db:push       # crée le schéma SQLite
pnpm dev           # lance akjol sur http://localhost:3000
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — architecture cible (canvas node-based, à implémenter dans une phase ultérieure)
