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
pnpm db:push                            # crée le schéma SQLite
pnpm --filter akjol seed:fixtures       # charge les 24 programmes + 12 métiers de démo dans la DB
pnpm dev                                # lance akjol sur http://localhost:3000
```

> **Windows / better-sqlite3** — si `pnpm db:push` ou `seed:fixtures` plante avec
> *"Could not locate the bindings file"*, il manque les Visual Studio Build Tools.
> Installe `windows-build-tools` ou les **Build Tools for Visual Studio 2022** (workload
> "Desktop development with C++"), puis `pnpm rebuild better-sqlite3 --force`.
> En attendant, l'app continue de tourner : les routes API détectent l'absence de DB
> et tombent automatiquement sur les fixtures bundle (zéro régression démo).

## Pipeline d'ingestion (data réelle)

ONISEP est implémenté ; Mon Master / UCAS / Common App sont stubs.

```bash
pnpm ingest:onisep                      # télécharge le CSV data.gouv.fr (~60k formations) → SQLite
pnpm ingest onisep --limit 500          # smoke test
```

Voir [`packages/ingest/README.md`](packages/ingest/README.md) pour les détails.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — architecture cible (canvas node-based, à implémenter dans une phase ultérieure)
