# Guide de remplissage des données — Premier lot : Informatique Bac+2/3

Objectif : peupler le catalogue de formations en commençant par **l'informatique
Bac+2/3** (BUT Informatique, BTS SIO, BTS SNIR/CIEL, BUT MMI, licences info &
licences pro). Trois pipelines complémentaires existent ; on ne remplit (presque)
plus à la main.

> Rappel modèle de données : une fiche brute ingérée a `isCurated = false` (pool de
> candidats). Une fiche validée à la main a `isCurated = true` — c'est elle qui est
> servie aux utilisateurs. Le travail de migration = **passer le périmètre info de
> brut → curé, enrichi**.

---

## Vue d'ensemble : 3 pipelines

| Pipeline | Commande | Ce qu'il fait | Qui |
|----------|----------|---------------|-----|
| **A — Parcoursup** | `pnpm ingest:parcoursup:it` | Ingère les vraies fiches info par établissement (nom, ville, **UAI réel**, capacité, lien) | Technique |
| **B — Enrichissement LLM** | `pnpm enrich:llm -- --apply` | Remplit débouchés / diplômes acceptés / description / poursuites via Claude | Technique (lancement), Data (relecture) |
| **C — Import tableur** | `pnpm import:programs -- fichier.csv --apply` | Importe des fiches saisies dans un Google Sheet (écoles privées, cas manquants) | Data |
| **D — Curation Admin** | UI `/admin/programs` | Relecture finale, correction, bascule `isCurated` | Data |

**Workflow recommandé** : A (volume) → B (champs pénibles) → D (relecture) ; C en
parallèle pour ce qui manque aux datasets publics (Epitech, 42, Ynov…).

---

## Pré-requis (une fois)

```bash
pnpm install
# .env.local doit contenir :
#   AKJOL_DB=...           (ou TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
#   ANTHROPIC_API_KEY=...  (pour le pipeline B)
pnpm db:push          # applique le schéma
pnpm seed:iut         # 30 IUT (établissements BUT Info) — déjà prévus
```

---

## Pipeline A — Parcoursup (volume de vraies fiches)

Télécharge le dataset public MESR `fr-esr-parcoursup` et ingère les formations.

```bash
# Smoke test : 200 fiches info, pour vérifier
pnpm ingest:parcoursup:it -- --limit 200

# Tout l'informatique Bac+2/3
pnpm ingest:parcoursup:it
```

- `--it` filtre sur le domaine informatique (mots-clés : informatique, réseaux,
  numérique, SIO, SNIR, CIEL, MMI, cybersécurité, données…).
- Idempotent (upsert par `(source, sourceId)`) — relançable sans doublons.
- Renseigne **le code UAI réel** → la fiche se lie automatiquement à la table
  `schools`. (URL du dataset surchargeable via `PARCOURSUP_DATASET_URL`.)

Résultat : des fiches `source=parcoursup`, `isCurated=false`, prêtes à enrichir.

---

## Pipeline B — Enrichissement LLM (les champs « vite chiants »)

Prend les fiches info brutes, va lire la page de l'école si dispo, et fait
remplir par Claude : description, domaines, **débouchés**, **diplômes acceptés**,
niveaux de poursuite, semaines de stage.

```bash
# DRY-RUN (n'écrit rien, montre ce que Claude propose)
pnpm enrich:llm -- --limit 10

# Écrit les champs (la fiche reste à curer en Admin)
pnpm enrich:llm -- --limit 50 --apply

# Écrit ET bascule isCurated=true (seulement si tu as confiance)
pnpm enrich:llm -- --apply --curate

# Plus rapide, sans aller chercher la page web
pnpm enrich:llm -- --apply --no-fetch
```

- Sortie **structurée** (JSON garanti conforme au schéma) — pas de parsing hasardeux.
- Chaque résultat porte une `confidence` (low/medium/high) ; relire en priorité les `low`.
- Modèle par défaut : `claude-opus-4-8`. Pour réduire le coût sur gros volume :
  `AKJOL_ENRICH_MODEL=claude-haiku-4-5 pnpm enrich:llm -- --apply`.
- **Toujours relire en Admin** avant de considérer une fiche fiable.

---

## Pipeline C — Import par tableur (saisie contrôlée)

Pour les écoles/formations absentes des datasets publics. La personne data remplit
un tableur calqué sur `scripts/templates/programs-template.csv`, l'exporte en CSV,
puis :

```bash
# Valide seulement (n'écrit rien)
pnpm import:programs -- data/import/info-ecoles-privees.csv

# Valide + écrit
pnpm import:programs -- data/import/info-ecoles-privees.csv --apply
```

Règles de saisie :
- Listes séparées par des **barres verticales** : `Bac général|Bac STI2D`.
- `level` ∈ `lycee, bachelor, licence, licence_pro, master, ecole_inge, doctorat, certif`
  (BUT/BTS/DUT → `bachelor`).
- `admissionPlatform` ∈ `parcoursup, mon_master, ucas, common_app, direct, concours, other`.
- `schoolUai` au format `0750553U` (optionnel).
- `isCurated` vide ⇒ `true` (saisie manuelle = fiche validée).
- Chaque ligne est validée ; les erreurs sont affichées avec le n° de ligne.

Voir le template pour 2 exemples remplis (BUT Info, BTS SIO).

---

## Pipeline D — Curation finale (Admin)

UI `/admin/programs` (rôle curator+). Sert à :
- relire/corriger les fiches enrichies par B,
- associer la fiche à l'établissement réel (UAI), corriger durée (BTS = 2 ans),
  dates de candidature, coût,
- basculer `isCurated = true` quand la fiche est fiable.

Astuce : la création depuis l'admin peut pré-remplir depuis une fiche brute
(`source/sourceId`) — elle promeut la brute en curée plutôt que d'en créer une 2e.

---

## Répartition des tâches

**Technique** : lance A et B, surveille les volumes/erreurs, gère les UAI provisoires
des 30 IUT (préfixe `999…`) à remplacer par les vrais.

**Data (migration)** : relit B en Admin, remplit le tableur pour le privé, vérifie
débouchés / URLs / dates, bascule `isCurated`.

## Checklist « lot informatique terminé »

- [ ] Parcoursup info ingéré (`pnpm ingest:parcoursup:it`)
- [ ] Enrichissement LLM passé sur le périmètre (`pnpm enrich:llm -- --apply`)
- [ ] Fiches relues + curées en Admin (`isCurated = true`)
- [ ] UAI réels des IUT renseignés (remplacer les `999…`)
- [ ] Écoles privées clés ajoutées via tableur
