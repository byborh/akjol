# @akjol/ingest

Pipeline d'ingestion des sources publiques de formations vers la table
`programs` de la DB AkJol.

> Référence : `docs/ui-idea-2.md` §4 (P0).

## Sources

| source       | type     | statut     | dataset                                         |
| ------------ | -------- | ---------- | ----------------------------------------------- |
| `onisep`     | CSV/HTTP | implémenté | data.gouv.fr — Idéo-Formations initiales (~60k) |
| `mon_master` | scrape   | stub       | mon-master.gouv.fr (XHR JSON)                   |
| `ucas`       | scrape   | stub       | UCAS — top 50 universités UK                    |
| `common_app` | scrape   | stub       | commonapp.org/explore                           |

Les stubs partagent la même interface `SourceAdapter`. Quand tu attaques une
source, tu remplis `iterate()` — le reste (upsert, diff, deprecation) est déjà
mutualisé.

## Lancer

```bash
# 1. appliquer le schéma
pnpm db:push          # ou pnpm db:migrate après generate

# 2. ingérer
pnpm ingest:onisep                           # tout le dataset
pnpm ingest onisep --limit 500               # smoke test
pnpm ingest:all                              # toutes les sources
AKJOL_DB=/tmp/test.db pnpm ingest onisep     # autre DB
```

Variables d'environnement :

- `AKJOL_DB` — chemin SQLite (défaut `./data/akjol.db`)
- `ONISEP_DATASET_URL` — override de l'URL du CSV ONISEP (le slug
  data.gouv.fr peut bouger d'une révision à l'autre)

## Pipeline

```
SourceAdapter.iterate()
       │
       ▼  (NormalizedProgram)
   hashProgram()  ───┐
       │             │
       ▼             ▼
   upsertOne()   compare contentHash
       │             │
       ▼             ▼
   INSERT / UPDATE / UNCHANGED (lastIngestedAt = now)
       │
       ▼
   deprecateMissing()  → lignes même source non vues ce run = deprecated
       │
       ▼
   ingestion_runs (insert/update/unchanged/deprecated/errors)
```

## Schéma

Voir `packages/db/src/schema.ts` :

- `programs` — table cible. Une ligne = un programme/cursus, identifié par
  `(source, sourceId)` (unique). Les colonnes structurées (langue, listes
  acceptedDiplomas, documents, …) sont du JSON text — on bascule en `jsonb`
  si on migre Postgres.
- `ingestion_runs` — journal des runs (success/failed, compteurs, notes).

Diff detection : `contentHash` est un SHA-1 du JSON canonisé des champs
métier (hors provenance). Re-run ⇒ `INSERT` si nouveau, `UPDATE` si hash
diffère, `UNCHANGED` sinon (on touche juste `lastIngestedAt`). Les
programmes d'une source qui n'apparaissent plus dans le run suivant sont
marqués `deprecated = true` — pas supprimés, pour pouvoir les réactiver
si la source les republie.

## Normalisation ONISEP

`niveau_formation` ONISEP → `ProgramLevel` AkJol (`mapOnisepNiveauToLevel`).
Coût annuel inféré par type d'établissement (public FR : tarifs MESR
2024-2025 ; privé : médiane prudente). Plateforme d'admission inférée du
niveau (master → mon_master, sub-master → parcoursup, le reste → direct).

Les valeurs absentes sont `null` plutôt que des défauts arbitraires —
mieux vaut "inconnu" qu'"inventé".

## Ajouter une source

1. Créer `src/sources/<nom>.ts` exportant `create<Nom>Adapter(): SourceAdapter`.
2. Créer `src/normalizers/<nom>.ts` avec un `normalize<Nom>Row(raw): NormalizedProgram | null`.
3. Référencer dans `src/index.ts` et `src/cli.ts` (table `adapters`).
4. Ajouter le script `ingest:<nom>` dans `package.json` et le workflow.
5. Documenter ici (statut, source, fréquence cible).

## Cron

Workflow `.github/workflows/ingest.yml` — quotidien à 03:30 UTC,
appelable manuellement (`workflow_dispatch` avec input `source`). Upload
le SQLite en artifact (rétention 7j) — pas un substitut d'une vraie DB
hébergée pour la prod, juste un mécanisme de checkpoint pendant la phase
MVP.

## Limites connues

- SQLite — la doc roadmap dit Postgres ; l'app est encore SQLite. Le
  schéma est compatible (text/integer + JSON text), un futur switch
  Postgres ne touchera que `dialect` + types JSON.
- ONISEP : seul l'identifiant + le libellé sont garantis. Plein de
  champs (frais, langue exacte, documents) ne sont pas dans le dataset
  public — ils restent `null` ou par défaut. La complétion vient de
  l'enrichissement manuel + Mon Master / UCAS / Common App.
- Aucun mécanisme de reprise sur erreur transactionnelle : si un run
  ONISEP plante au milieu, les rows déjà upsert restent ; le suivant
  reprend de zéro et finit le travail. Acceptable vu l'idempotence du
  hash.
