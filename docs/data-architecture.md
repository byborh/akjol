# Architecture des données — état actuel, dette, refonte cible

> **Objectif.** Documenter la dette de modélisation des données ONISEP (et plus largement
> de toute source externe), expliquer pourquoi `/explore`, `/catalog` et la future recherche
> souffrent dès qu'on dépasse quelques milliers d'entrées, et proposer une refonte progressive
> à attaquer **après** le soft launch.
>
> **Statut.** Document d'architecture — pas un plan d'exécution. Aucun code ne doit être
> écrit sur la base de ce doc tant que les arbitrages section [Décisions ouvertes](#décisions-ouvertes)
> ne sont pas tranchés.
>
> **Dernière mise à jour.** 2026-05-13, après ingestion ONISEP « Formations initiales »
> (5 829 lignes en DB).

## TL;DR

On a importé un dataset ONISEP qui décrit le **catalogue national des types de
formations** (~5 800 entrées), pas les fiches d'établissement. Notre table `programs`
écrase trois concepts qu'ONISEP modélise séparément :

1. **Type de formation** (ex. « BTS SIO option SISR »)
2. **Structure d'enseignement** (ex. « Lycée Magendie, Bordeaux »)
3. **Programme dispensé** = jointure des deux (« Magendie propose BTS SIO SISR »)

Conséquences directes en prod :
- La recherche ne peut JAMAIS trouver « Lycée Magendie » — l'établissement n'existe pas
  dans la table, on n'a que le sigle de la formation dans le champ `schoolName`.
- Le filtrage `/explore` se fait côté client sur un sous-ensemble fetché — ça ne scale
  pas au-delà de ~5k entrées.
- Pas de géolocalisation précise, donc le globe ne peut pas zoomer au niveau ville.
- Aucune notion de « 240 étudiants en M2 », de « taux d'accès Parcoursup », etc. —
  ces données existent dans d'autres datasets publics mais on n'a pas le pivot pour les
  brancher.

Refonte cible : **3 tables (formation_types, schools, programs)** + **SQLite FTS5**
pour la recherche + **1 adapter d'ingestion par dataset** au lieu d'un mégafichier.
Effort estimé : 3-5 jours dev solo après soft launch.

---

## 1. Le diagnostic

### 1.1 Ce qu'on a aujourd'hui

```
table programs (5 853 lignes, dont 5 829 ONISEP)
├── id              "onisep:FOR.6271"
├── title           "diplôme d'ingénieur de l'UTT…"
├── schoolName      "UTT"           ← sigle de la formation, PAS l'école
├── schoolCity      ""              ← vide pour 100% des entrées ONISEP
├── formationCode   "DIPL_INGE"
└── ...
```

Le normalizer `packages/ingest/src/normalizers/onisep.ts` mappe le sigle de la
formation dans `schoolName` faute de mieux — le dataset téléchargé ne contient pas
le nom de l'établissement. C'est sémantiquement faux mais c'est ce qu'on a pu
extraire d'un dataset qui n'est pas conçu pour ça.

### 1.2 Pourquoi le dataset téléchargé n'a pas les bonnes colonnes

ONISEP publie ~12 datasets sur data.gouv.fr. Celui qu'on utilise s'appelle
**« Idéo - Formations initiales en France »** (slug `ideo-formations-initiales-en-france`).
Son rôle est de lister les **types** de diplômes du système éducatif français,
pas leurs lieux de dispense. Les colonnes le confirment : `code NSF`, `sigle type
formation`, `libellé formation principal`, `code RNCP`, `niveau de certification`,
`tutelle`, `URL et ID Onisep`. Aucune colonne ville, UAI, capacité d'accueil.

C'est l'équivalent du catalogue des **références** d'un libraire : tu sais qu'il
existe « Le Rouge et le Noir », pas dans quelles librairies on le trouve.

### 1.3 Conséquences observables

**1. La section « établissements » de `/explore` ou `/catalog` montre des sigles de
formation au lieu d'écoles.** « UTT », « ENAC », « ESILV » apparaissent comme s'ils
étaient des établissements alors que ce sont des sigles agrégés du *type* de
formation diplôme d'ingénieur.

**2. La recherche full-text est impossible côté serveur.** Aujourd'hui on fait :
```ts
const { data: programs } = usePrograms(filters);   // ~50 entrées paginées
const matches = programs.filter(p => p.title.includes(query));
```
Tu ne peux JAMAIS taper « Magendie » et obtenir un résultat — l'établissement n'est
nulle part. Et même si on indexait `title`, la pagination côté serveur ne charge que
50 entrées à la fois, donc 99% de la DB est invisible.

**3. La fiche `/program/[id]` est appauvrie.** Pas de ville, pas de capacité, pas de
taux d'accès, pas de coordonnées GPS. Ce sont précisément les chiffres qui rendent
AkJol crédible (« 240 étudiants admis · 32% taux d'accès Parcoursup »).

**4. Le globe ne peut pas zoomer plus bas que le pays.** Sans `lat`/`lng` au niveau
établissement, on ne peut pas faire ce que Skyscanner fait avec les villes.

**5. Aucun lien possible avec Parcoursup / Mon Master / l'Annuaire de l'Éducation.**
Ces sources tierces utilisent toutes le **code UAI** comme clé d'établissement. On
ne le stocke pas, donc on ne peut rien croiser.

---

## 2. Comment ONISEP modélise réellement

ONISEP distingue rigoureusement trois entités et publie un dataset distinct pour
chacune. Toute l'application onisep.fr est construite sur ces trois niveaux.

| Niveau | Entité | Dataset data.gouv | Volume approximatif | Clé stable |
|---|---|---|---|---|
| 1 | **Type de formation** (catalogue national) | `Idéo - Formations initiales en France` | ~5 800 | `FOR.xxxxx` |
| 2 | **Structure d'enseignement** (école physique) | `Idéo - Structures d'enseignement` | ~25 000 | `UAI` (8 chars) |
| 3 | **Programme dispensé** (jointure structure × formation) | `Idéo - Idéo Structures Formations` | ~60 000+ | `(UAI, FOR.xxxxx)` |

Quand un utilisateur cherche sur onisep.fr, il interroge un index full-text qui
couvre les trois tables. Le résultat « Lycée Magendie - BTS SIO option SISR »
vient de la table de jointure, enrichi des champs des deux tables référencées.

### 2.1 Sources complémentaires gratuites

| Source | Apport | Clé de jointure |
|---|---|---|
| `data.education.gouv.fr` — Annuaire de l'éducation | 64 000 établissements scolaires avec lat/lng, téléphone, code postal | `UAI` |
| `enseignementsup-recherche.gouv.fr` — Atlas régional des effectifs étudiants | Nombre d'étudiants par établissement × filière × année | `UAI` |
| `api.parcoursup.gouv.fr` — Données ouvertes Parcoursup | Dates d'ouverture/fermeture officielles, taux d'accès des bacheliers, capacité d'accueil | `(UAI, formation_code)` |
| `api.opendata.onisep.fr` — Métiers ROME | Référentiel métiers normalisé | code ROME |
| `data.gouv.fr` — Bourses CROUS | Critères, montants, deadlines | (pas de clé naturelle, à indexer par académie) |

**Croiser 3 sources sur UAI = 80% des champs riches qu'on veut afficher.**

---

## 3. Architecture cible

### 3.1 Trois tables au lieu d'une

```
formation_types
  id              text PK           -- "FOR.6271" (ID ONISEP stable)
  code            text              -- "BTS_SIO_SISR" (notre code interne)
  label           text NOT NULL
  level           text NOT NULL     -- ProgramLevel enum
  durationYears   integer NOT NULL
  domains         text              -- JSON array
  rncpCode        text              -- "37955"
  source          text NOT NULL
  contentHash     text NOT NULL
  lastIngestedAt  integer
  deprecated      boolean DEFAULT false

schools
  id              text PK           -- "uai:0331662H" (UAI préfixé)
  uai             text UNIQUE       -- "0331662H" (clé nationale)
  name            text NOT NULL     -- "Lycée Magendie"
  type            text              -- "public" | "privé sous contrat" | …
  city            text NOT NULL
  postalCode      text
  departement     text
  region          text
  countryRef      text NOT NULL     -- "FR"
  lat             real
  lng             real
  websiteUrl      text
  contactEmail    text
  studentCount    integer           -- enrichi par dataset Atlas
  source          text NOT NULL
  contentHash     text NOT NULL
  lastIngestedAt  integer
  deprecated      boolean DEFAULT false

programs (table de jointure enrichie — ~60k lignes cible)
  id              text PK           -- sha1(school_id + formation_type_id + voie)
  schoolId        text FK schools.id NOT NULL
  formationTypeId text FK formation_types.id NOT NULL
  voie            text NOT NULL     -- "initiale" | "apprentissage" | "continue"
  capacity        integer           -- places officielles Parcoursup
  applicationOpens  text
  applicationCloses text
  applicationFee  integer
  costPerYear     integer           -- override si différent du défaut
  admissionRate   real              -- taux d'accès Parcoursup
  employmentRate  real              -- taux d'insertion à 6 mois
  source          text NOT NULL
  contentHash     text NOT NULL
  lastIngestedAt  integer
  deprecated      boolean DEFAULT false

  UNIQUE (schoolId, formationTypeId, voie)
```

Ce qui se débloque immédiatement :

| Requête utilisateur | SQL | Avant | Après |
|---|---|---|---|
| « Toutes les formations à Bordeaux » | `JOIN programs ON schools WHERE city='Bordeaux'` | Impossible | < 10ms |
| « Toutes les écoles offrant Master MBDS » | `WHERE formation_type_id='FOR.xxx'` | Impossible | < 10ms |
| « Lycée Magendie » | `WHERE schools.name LIKE '%Magendie%'` | 0 résultat | Tous les BTS, BAC PRO, etc. dispensés là |
| Globe avec markers par ville | `SELECT lat, lng FROM schools` | Impossible (pas de coord) | Pin par école |
| « 240 étudiants en M2 » | `SELECT studentCount FROM schools` | Champ inexistant | Affiché sur fiche |

### 3.2 Recherche en DB, pas en mémoire

Le pattern actuel `useQuery` → page de 50 résultats → `.filter()` côté client est
viable jusqu'à ~5 000 entrées. Au-delà, trois paliers à considérer :

| Volume cible | Outil | Setup | Latence p95 |
|---|---|---|---|
| < 10 k | `LIKE '%q%'` avec index trigram | 0 ligne de config | 50 ms |
| 10 k – 100 k | **SQLite FTS5** (virtual table) | 1 migration raw SQL + 2 triggers | < 10 ms |
| > 100 k ou typo-tolerance, synonymes, facets natifs | **MeiliSearch** ou **Typesense** | Container Docker + reindex post-ingest | < 20 ms |

**Recommandation pour AkJol : SQLite FTS5.** Pour 60-100k programmes c'est le sweet spot.
Drizzle ne supporte pas FTS5 en DSL — il faut l'ajouter en raw SQL dans une migration
custom (`drizzle-kit` permet d'éditer le SQL généré avant `db:push`).

Schéma FTS5 cible :

```sql
CREATE VIRTUAL TABLE programs_fts USING fts5(
  program_id UNINDEXED,
  formation_label,
  school_name,
  school_city,
  domains,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Triggers pour synchronisation automatique
CREATE TRIGGER programs_ai AFTER INSERT ON programs BEGIN
  INSERT INTO programs_fts(program_id, formation_label, school_name, school_city, domains)
  SELECT NEW.id, ft.label, s.name, s.city, ft.domains
  FROM formation_types ft, schools s
  WHERE ft.id = NEW.formationTypeId AND s.id = NEW.schoolId;
END;
-- (idem pour AFTER UPDATE, AFTER DELETE)
```

Une route `/api/search?q=magendie+bts` répondrait via :
```sql
SELECT program_id, bm25(programs_fts) AS rank
FROM programs_fts
WHERE programs_fts MATCH ?
ORDER BY rank LIMIT 30;
```
Latence cible : < 50ms même à 60 k entrées sur un VPS modeste.

### 3.3 Pipeline d'ingestion : un adapter par source

Le pattern actuel `packages/ingest/src/cli.ts` est OK mais il faut éclater
`onisep.ts` en plusieurs adapters spécialisés et ajouter un **linker** qui
résout les FK :

```
packages/ingest/src/
├── sources/
│   ├── onisep-formations.ts        → produit FormationType[]
│   ├── onisep-structures.ts        → produit School[]
│   ├── onisep-link.ts              → produit ProgramLink[] (UAI, FOR.xxxxx)
│   ├── education-gouv-annuaire.ts  → enrichit School (géoloc, téléphone)
│   ├── parcoursup.ts               → enrichit Program (dates, taux d'accès)
│   └── enseignementsup-atlas.ts    → enrichit School (effectifs étudiants)
├── linker/
│   ├── upsert-schools.ts           → INSERT OR REPLACE par UAI
│   ├── upsert-formation-types.ts   → INSERT OR REPLACE par FOR.xxxxx
│   ├── upsert-programs.ts          → résout les FK, log soft-delete
│   └── enrich.ts                   → applique les sources d'enrichissement
└── cli.ts                          → orchestration
```

Chaque adapter fait **une seule chose** et est testable isolément. Le linker
orchestre dans cet ordre obligatoire :

```
1. upsert schools (toutes les sources, par UAI)
2. upsert formation_types (toutes les sources, par FOR.xxxxx)
3. upsert programs (résout les FK, échoue si une référence manque)
4. enrich (Parcoursup, Atlas) — UPDATE only, jamais INSERT
```

### 3.4 Identifiants stables — la règle d'or

Toujours stocker l'ID source brut + dériver un ID interne avec préfixe :

```
schools.id        = "uai:0331662H"                          (préfixe source + ID natif)
formation_types.id= "onisep:FOR.6271"
programs.id       = sha1(school_id + formation_type_id + voie).slice(0, 12)
```

Règles non-négociables :
- **Jamais** utiliser un nom d'établissement comme clé. Les renommages cassent tout.
- **Jamais** hard-delete une entrée référencée par un `plan_items` user. Soft-delete
  via `deprecated = true` + `deprecatedAt = now()`.
- **Toujours** garder `source` + `contentHash` pour détecter les diffs entre runs.

### 3.5 Invalidation et soft-delete

Quand on re-ingest demain :

| Cas | Action |
|---|---|
| Entrée existe en DB et en source, hash identique | `unchanged`, bump `lastIngestedAt` |
| Entrée existe en DB et en source, hash différent | `updated`, log dans `ingestion_runs.notes` |
| Entrée existe en DB, absente de la source | `deprecated = true`, `deprecatedAt = now()`. **Pas de delete.** |
| Entrée existe en source, absente de DB | `inserted` |

L'UI cache les `deprecated` par défaut sauf pour les users qui les ont sauvegardés
(avec un badge « cette formation n'est plus offerte »).

### 3.6 Facets / filtres dynamiques

`/explore` aujourd'hui filtre côté front (count par pays, par niveau). À 60 k
programmes ça ne marche plus. Deux options :

- **Précalculées** : table dérivée `facet_counts(facet_key, value, count)`
  reconstruite après chaque ingest. Lecture en O(1), reconstruction en O(N).
- **À la volée** : `SELECT level, COUNT(*) GROUP BY level`. SQLite tient ça
  sans broncher à 60 k.

Recommandation : **à la volée** tant qu'on est sous 200 k. Pas la peine d'ajouter
une table dérivée tant que les requêtes répondent en < 100ms.

---

## 4. Migration progressive — comment y aller sans tout casser

Le user a déjà des données dans son localStorage (passeport, plan attaché à des
program IDs). Casser les IDs = casser leur plan. Stratégie de migration :

### Phase A — refonte non-breaking (2 jours)

1. Ajouter `schools` et `formation_types` au schéma.
2. Garder `programs` tel quel, ajouter deux colonnes nullables `schoolId` et
   `formationTypeId` (FK vers les nouvelles tables).
3. Migration de données : pour chaque programme existant, créer une fake
   `school` (avec name = `schoolName`, city = `schoolCity`) et un fake
   `formation_type` (avec id = `programs.id + ':type'`). Renseigner les FK.
4. Typecheck doit passer — l'UI ne change pas, juste les types de retour API
   gagnent `school` et `formationType` en plus.

### Phase B — vraie ingestion (1 jour)

1. Écrire `onisep-structures.ts` + `onisep-link.ts`.
2. `pnpm ingest:onisep-structures` → peuple `schools` avec ~25 k établissements.
3. `pnpm ingest:onisep-link` → peuple `programs` avec ~60 k vraies jointures.
4. Marquer les fakes de Phase A comme `deprecated = true` plutôt que les
   supprimer (les users existants gardent leur plan fonctionnel).
5. UI : ajouter un encart « cette formation a été remplacée par X » pour les
   programmes deprecated qui ont un successeur évident.

### Phase C — recherche (½ jour)

1. Migration raw SQL FTS5 + triggers.
2. Route `/api/search` qui retourne `{ schools[], programs[], formation_types[] }`.
3. Composant `<GlobalSearchBar>` dans `<AppNav>` avec autocomplete.

### Phase D — enrichissement (½ jour par source)

1. `education-gouv-annuaire.ts` → géoloc des 25 k schools.
2. `parcoursup.ts` → dates + taux d'accès.
3. `enseignementsup-atlas.ts` → effectifs.

**Total estimé : 4-5 jours dev solo.**

---

## 5. Décisions ouvertes

À trancher avant d'attaquer une seule ligne de code de la refonte.

### 5.1 SQLite ou Postgres ?

| Critère | SQLite | Postgres |
|---|---|---|
| Volume actuel (~6k) | Suffit largement | Overkill |
| Volume cible (~60k) | Tient sans problème avec FTS5 | Confort marginal |
| Volume « si on prend l'international » (~500k) | Limite arrive | Confort net |
| Recherche avancée (typo, synonymes, facets) | FTS5 (basique) ou MeiliSearch en plus | `pg_trgm` + `tsvector` natif, ou MeiliSearch |
| Multi-writer (CI ingest pendant que le user édite) | Verrou WAL — fonctionne mais sensible | Aucun souci |
| Setup déploiement | Fichier `.db` à monter | Service managé (Neon, Supabase, RDS) |
| Coût hébergement | Quasi nul | ~10-25 €/mois |

**Recommandation MVP** : SQLite + FTS5. Migrer vers Postgres quand on dépasse
50 k MAU OU quand on a besoin de queries concurrentes lourdes (recherche pendant
ingest). La migration Drizzle SQLite → Postgres est faisable en quelques heures
(le DSL est compatible à 90%, restent les colonnes JSON et les `unixepoch()` à
réécrire).

### 5.2 Refonte avant ou après soft launch ?

| Argument **avant** | Argument **après** |
|---|---|
| Pas encore d'utilisateurs avec plan = pas de migration de données user à gérer | On valide d'abord que les gens utilisent vraiment l'app avant d'investir 5 jours |
| Modèle propre dès le départ = pas de dette future | Le feedback va probablement changer les priorités (peut-être qu'on n'a pas besoin de 60k entrées, juste de 500 bien sourcées) |
| Recherche full-text débloque tout `/catalog` et `/explore` | Le globe + la liste actuelle suffisent pour 50 testeurs |

**Recommandation** : **après**. Tu vas découvrir en feedback utilisateur que
70% des requêtes tapées sont « médecine », « informatique », « école d'ingé
Lyon » — pas « Lycée Magendie ». Tu prioriseras peut-être la recherche
avant l'enrichissement des écoles. Faire la roadmap dans le mauvais ordre
te coûte 2 jours.

### 5.3 Refonte d'un coup ou par tranches ?

Phases A→D sont indépendantes. Tu peux merger Phase A seule, vivre avec pendant
2 semaines, puis attaquer Phase B. Recommandé pour minimiser le risque.

---

## 6. Pièges connus

1. **L'UAI a parfois 9 caractères au lieu de 8** (Mayotte, COM). Toujours stocker
   en text, jamais en int.
2. **Les sigles d'établissements ne sont PAS uniques.** « CFA » existe dans
   chaque académie. Toujours croiser par UAI.
3. **ONISEP renomme parfois les `FOR.xxxxx`** lors d'une refonte du référentiel.
   Garder l'ancien ID en colonne `previousIds` (JSON array) pour ne pas casser
   les références.
4. **Parcoursup ne couvre que la France et seulement le premier cycle.** Pas de
   données pour les masters (→ Mon Master) ni l'international.
5. **MeiliSearch a un mode read-only pour les index** — utile pour servir la
   recherche en prod pendant qu'on ré-indexe en arrière-plan. Mais coût de
   maintenance d'un service supplémentaire à peser.
6. **L'API ONISEP officielle (`api.opendata.onisep.fr`) a un quota.** Préférer
   les exports data.gouv.fr (illimités) pour l'ingestion massive, garder l'API
   pour les détails enrichis (descriptions longues, vidéos, etc.) à la demande.
7. **Le geocoding est cher** si on veut du précis-à-l'adresse. L'Annuaire de
   l'éducation fournit déjà lat/lng pour les ~64k établissements scolaires —
   c'est gratuit et précis. Ne pas chercher à géocoder soi-même.

---

## 7. Liens de référence

- `packages/db/src/schema.ts` — schéma actuel à étendre
- `packages/ingest/src/sources/onisep.ts` — adapter actuel à éclater
- `packages/ingest/src/normalizers/onisep.ts` — normalizer actuel (à conserver
  pour `formation_types`, à dupliquer pour les structures)
- `apps/akjol_front/src/lib/db.ts` — singleton DB côté Next, pas à toucher
- `apps/akjol_front/src/app/api/programs/route.ts` — pattern de fallback à
  préserver pour `/api/search`

### Datasets data.gouv.fr utiles

- [Idéo - Formations initiales en France](https://www.data.gouv.fr/fr/datasets/ideo-formations-initiales-en-france/) — déjà ingéré (~5 800)
- Idéo - Structures d'enseignement — à ingérer (~25 000)
- Idéo - Idéo Structures Formations — à ingérer (~60 000 liens)
- Annuaire de l'éducation (data.education.gouv.fr) — enrichissement géoloc
- Données ouvertes Parcoursup — enrichissement admission
