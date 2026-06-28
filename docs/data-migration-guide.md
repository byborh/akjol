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

| Pipeline | Commande | Ce qu'il fait | Coût | Qui |
|----------|----------|---------------|------|-----|
| **A — Parcoursup** | `pnpm ingest:parcoursup:it` | Ingère les vraies fiches info par établissement (nom, ville, **UAI réel**, capacité, lien) | gratuit | Technique |
| **B — Enrichissement par règles** | `pnpm enrich:rules -- --apply` | Remplit débouchés / diplômes acceptés / domaines / poursuites depuis un dictionnaire par type de diplôme | **gratuit** | Technique |
| **C — Import tableur** | `pnpm import:programs -- fichier.csv --apply` | Importe des fiches saisies dans un Google Sheet (écoles privées, cas manquants) | gratuit | Data |
| **D — Curation Admin** | UI `/admin/programs` | Relecture finale, correction, bascule `isCurated` | gratuit | Data |
| **(option) B′ — Enrichissement LLM** | `pnpm enrich:llm -- --apply` | Idem B mais via Claude (par fiche, payant) | payant | — |

**Workflow recommandé** : A (volume) → B (champs pénibles, gratuit) → D (relecture) ;
C en parallèle pour ce qui manque aux datasets publics (Epitech, 42, Ynov…).

> Pourquoi B suffit sans IA : les débouchés/diplômes acceptés/poursuites d'un type
> de diplôme sont **identiques quel que soit l'établissement** (un BUT Info a les
> mêmes débouchés à Lyon ou à Lille). On écrit la connaissance une fois par type
> dans `scripts/data/it-formation-refs.ts`, et B l'applique à toutes les fiches.
> Déterministe, instantané, 0 €. Le pipeline LLM (B′) reste disponible si un jour
> tu veux des descriptions sur-mesure par établissement.

---

## Pré-requis (une fois)

```bash
pnpm install
# .env.local doit contenir :
#   AKJOL_DB=...                (ou TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
#   ANTHROPIC_API_KEY=...       (UNIQUEMENT pour l'option payante B′ ; inutile sinon)
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

## Pipeline B — Enrichissement par règles (gratuit, les champs « vite chiants »)

Rattache chaque fiche info brute à son **type de diplôme** (BUT Info, BTS SIO,
MMI…) et lui applique les débouchés / diplômes acceptés / domaines / poursuites /
durée définis une seule fois dans `scripts/data/it-formation-refs.ts`.

```bash
# DRY-RUN : montre les correspondances trouvées (et les libellés non reconnus)
pnpm enrich:rules

# Remplit les champs VIDES (n'écrase rien ; la fiche reste à curer)
pnpm enrich:rules -- --apply

# Remplit + bascule isCurated=true
pnpm enrich:rules -- --apply --curate
```

- **Ne remplit que les champs vides** — n'écrase jamais une donnée déjà présente
  (ex. débouchés venus de Parcoursup). Corrige la durée (BTS = 2 ans).
- Le DRY-RUN liste les **libellés non reconnus** : s'il en revient souvent un, ajoute
  une entrée dans `scripts/data/it-formation-refs.ts` (≈ 5 min) et relance.
- Couvre déjà : BUT Info, BUT MMI, BUT R&T, BTS SIO, BTS SNIR, BTS CIEL,
  licences info, licences pro info, bachelors info.

> **Option payante B′ (LLM)** — si tu veux un jour des descriptions sur-mesure par
> établissement : `pnpm enrich:llm -- --limit 10` (dry-run), puis `--apply`.
> Nécessite `ANTHROPIC_API_KEY`. À réserver aux cas où le générique ne suffit pas.

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
- [ ] Enrichissement par règles passé sur le périmètre (`pnpm enrich:rules -- --apply`)
- [ ] Fiches relues + curées en Admin (`isCurated = true`)
- [ ] UAI réels des IUT renseignés (remplacer les `999…`)
- [ ] Écoles privées clés ajoutées via tableur
