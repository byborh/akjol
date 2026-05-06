# AkJol — Roadmap vers un produit *complet* (ui-idea-2)

> **Objectif.** Passer du MVP fonctionnel actuel à un produit livrable qui *tient sa promesse* — un routeur d'études mondial qui guide réellement un étudiant de "je suis là" à "j'ai postulé là".
>
> **Comment lire.** 44 idées, classées par priorité. Chaque idée est : pourquoi elle est nécessaire, comment la construire (fichiers, libs, approche), et à quel moment c'est "fait".
>
> - **P0** = bloque la promesse fondatrice. Sans ça, AkJol n'est qu'une démo.
> - **P1** = différenciant fort. AkJol devient utile vs juste informatif.
> - **P2** = qualité, profondeur, "wow". Polish post-launch.
>
> **Convention.** Les chemins de fichiers supposent l'arborescence actuelle (`apps/akjol_front/src/`).

---

## Sommaire

- [P0 — Fondations](#p0--fondations)
- [P1 — Différenciation](#p1--différenciation)
- [P2 — Polish & wow](#p2--polish--wow)

---

## P0 — Fondations

### 1. Globe 3D `/explore`

**Pourquoi.** Le doc original désigne le globe comme *le héros*. Aujourd'hui c'est une liste — fonctionnel mais pas la promesse émotionnelle. Sans globe, AkJol est "un autre site d'orientation", pas un *routeur*.

**Comment.**
- Lib : `react-globe.gl` (WebGL, perf OK) ou `cobe` (plus léger, atome). `react-globe.gl` est plus mature pour les use-cases avec données par pays.
- Données géo : TopoJSON `world-atlas/countries-110m.json` pour les contours.
- Composant : [`src/components/Globe.tsx`](apps/akjol_front/src/components/Globe.tsx) avec dynamic import (`ssr: false`).
- Logique : pour chaque pays modélisé dans `PROGRAMS`, calculer le meilleur statut feasibility parmi ses programmes et illuminer le pays dans la couleur correspondante (vert / ambre / rouge sourd / gris pour "non couvert").
- Interactions : drag pour orienter, scroll pour zoom, double-tap pour fitView, hover → tooltip avec stats pays, click → ouvre le drawer pays.
- Auto-rotation lente (1 tour / 60s) qui s'arrête au premier hover.
- Fallback mobile : si performance < seuil détecté (frameRate < 30fps après 1s), fallback sur `react-simple-maps` (planisphère 2D Mercator avec mêmes interactions).

**Done quand.** Léa voit la France en vert vif et ~10 autres pays colorés. Lana avec STPM voit FR/UK/MY/SG/DE en couleurs différentes selon corridors. Toggle Liste/Globe sur `/explore`.

---

### 2. Drawer pays `/explore/[country]`

**Pourquoi.** Quand l'utilisateur clique un pays sur le globe, il a besoin d'un panneau dédié — pas de quitter le globe vers une page liste. Skyscanner garde la carte visible quand tu cliques une ville.

**Comment.**
- Route Next dynamique : [`src/app/explore/[country]/page.tsx`](apps/akjol_front/src/app/explore/[country]/page.tsx).
- Slide-in droite, `w-[420px]` desktop, bottom-sheet pleine largeur mobile (`framer-motion` + `vaul` ou `react-modal-sheet` pour le drag-to-dismiss).
- Sticky header : drapeau + nom + stats (`X programmes ouverts · Y ambre · Z fermés`) + toggle "Ouverts uniquement".
- Sections collapsibles : (1) Trajectoires recommandées, (2) Programmes ouverts directement, (3) Programmes avec étape, (4) Programmes fermés *avec raison*, (5) Vivre dans ce pays (coût de la vie, droit travail étudiant, démarches visa, sources officielles).
- Le globe reste visible et interactif derrière le drawer (z-index, opacité globe légèrement réduite).

**Done quand.** Click sur Allemagne → drawer slide-in, montre TUM avec status ambre (langue manquante), et la section "Vivre en Allemagne" avec coût mensuel ~1000€.

---

### 3. `/admin/graph` — node-editor du graphe d'équivalences

**Pourquoi.** *Le moat d'AkJol.* La promesse mondiale (BTS≈Associate Degree US≈Diploma UK 5≈Diplom MY) demande une base d'équivalences entretenue par des humains. Sans outil interne propre, impossible d'étendre au-delà de la France.

**Comment.**
- Spec déjà partiellement écrite dans [`docs/ui-canva.md`](docs/ui-canva.md). Reprendre l'esquisse.
- Lib : `@xyflow/react` (anciennement react-flow), node-editor mature.
- Route : [`src/app/admin/graph/page.tsx`](apps/akjol_front/src/app/admin/graph/page.tsx) protégée par auth (cf. #21).
- Modèle : nœuds = diplômes (codés par `code`+`countryRef`), edges = équivalences avec poids (`equivalent`/`acceptedAs`/`requiresBridge`/`notRecognized`).
- Persistance : Postgres avec table `equivalence_edges` (cf. #23). UI éditable, save → API → DB.
- Vue filtrée : par pays, par niveau (Bac+0 → Bac+8), par domaine.
- Réservé strictement au rôle `curator` ou `admin`. Jamais visible à l'utilisateur final.
- Versioning : chaque modification crée une révision, possibilité de revert.

**Done quand.** Un curator peut ajouter "STPM ≈ A-Level UK", la sauve, et Lana voit immédiatement Manchester ouvert directement (sans Foundation year) sur son globe.

---

### 4. Ingestion de vraies données (ONISEP, Mon Master, UCAS, Common App)

**Pourquoi.** Le dataset hardcodé (~20 programmes) est un prototype. Pour shipper, AkJol doit couvrir 10 000+ formations FR + 1 000+ internationales. Pas faisable à la main.

**Comment.**
- API ONISEP : data.gouv.fr publie un dataset "Idéo-Formations" (CSV/JSON), 60 000+ formations.
- Mon Master : pas d'API officielle, mais scraping respectueux possible (robots.txt, throttling).
- UCAS : pas d'API publique, partenariat ou scraping ciblé sur top 50 universités.
- Common App : scraping `commonapp.org/explore`.
- Pipeline : [`packages/ingest/`](packages/ingest/) — scripts Node TypeScript, Postgres, run quotidien (cron + GitHub Actions ou Cloud Scheduler).
- Schéma cible : table `programs` avec mêmes champs que `Program` actuel + `source`, `sourceUrl`, `lastIngestedAt`.
- Normalisation : mapping ONISEP `niveau_formation` → notre `ProgramLevel`. Table de correspondance maintenue.
- Diff détection : si le contenu change vs la précédente ingestion, log + notif (potentiellement déprécier programmes "morts").

**Done quand.** `pnpm ingest:onisep` remplit la DB avec 60k formations. Une recherche "BTS Paris" sur `/catalog` retourne >100 résultats.

---

### 5. Reverse-engineering métiers complet

**Pourquoi.** Le bouton "Calculer" actuel filtre par match de mot-clé sur `outcomesJobs`. Le doc original promet *"Je sais où je veux arriver, montre-moi les chemins"* — un vrai algo de pathfinding inverse.

**Comment.**
- Modélisation graphe : nœuds = programmes + métiers + diplômes, edges = `unlocks` (programme → métier ou programme → diplôme suivant).
- Algo : BFS/Dijkstra inversé depuis le métier cible vers le passeport actuel, max profondeur 5 étapes.
- Coût des arêtes : durée + coût + 1/probabilité. Permet de classer par "le plus court", "le moins cher", "le plus probable".
- Implémentation : [`src/engine/reverseRoutes.ts`](apps/akjol_front/src/engine/reverseRoutes.ts), pure function `(passport, jobId) => Trajectory[]`.
- UI : sur `/explore` + `/catalog`, quand l'utilisateur sélectionne un métier-cible, panneau dédié "Routes vers Médecin" avec 3-5 trajectoires alternatives, durée/coût/proba mis en évidence.
- Job dataset : nouveau fichier [`src/data/jobs.ts`](apps/akjol_front/src/data/jobs.ts) avec `Job` (code, label, salary, regions, requiresDiplomas).

**Done quand.** Lana clique "Médecin" → 3 routes : Foundation+Bachelor UK→Med UK (15 ans), STPM→PASS FR→Med FR (14 ans), STPM→Pré-Med Singapour (12 ans). Chacune cliquable, ouvre le Trajectory Builder pré-rempli.

---

### 6. Calculateur budget total

**Pourquoi.** Aujourd'hui on affiche `coût/an` isolé. Un parent qui réfléchit à financer 5 ans à l'étranger a besoin du *total* (frais + vie + transport - bourses). C'est le facteur de décision n°1 pour beaucoup.

**Comment.**
- Composant [`src/components/BudgetSummary.tsx`](apps/akjol_front/src/components/BudgetSummary.tsx) — affiché sur trajectoire, programme, comparateur.
- Inputs : `Program[]` ou `Trajectory`, `Passport.constraints.maxBudgetPerYear`, table `costOfLivingByCity` (cf. #14), liste de bourses applicables (cf. #13).
- Calcul : `total = Σ(durée × (tuition + livingEstimate)) - Σ(boursesEstimées) + travelCosts`.
- UI : breakdown visuel (stacked bar : tuition / vie / transport / bourses négatif), total en gros, comparaison "vs ton budget annuel × N années".
- Sensitivity : slider "Si je rate une année" → recalcul. Slider "Avec stage rémunéré 6 mois/an" → -€X.
- Export : bouton "Partager le calcul" → URL paramétrée OR PDF.

**Done quand.** Sur trajectoire Léa = LP ASUR + Master MBDS, affiche `Total estimé : 17 000€ · ± 3000€ · 2 années`. Avec un toggle "alternance" → `Total : 0€ (employeur paie)`.

---

### 7. Visa & démarches détaillées par corridor

**Pourquoi.** Pour Lana (MY → FR/UK/DE), le visa est *plus contraignant* que les frais ou la langue. Sans cette donnée, AkJol promet "78% de chances" alors que sans visa, c'est 0%.

**Comment.**
- Nouvelle table `visaCorridors` : clé `(originCountry, destCountry, programLevel)` → `{complexity: simple|medium|complex, requiredDocs[], processingDays, fee, refusalRate, jurisprudence}`.
- Source : France-Visas + équivalents UK/DE/US/CA. Donnée publique mais éclatée — agrégation manuelle initiale ~2 jours de travail pour les 20 corridors principaux.
- UI dans drawer pays + fiche programme : section "Démarches visa pour toi" avec checklist, durée d'instruction, frais, taux de refus.
- Mise à jour critique : flag "données vérifiées le 2026-01-15", warning si > 6 mois sans review.

**Done quand.** Lana sur Manchester voit "Étudiant Tier 4 · 6 semaines délai · £363 · 8 documents · taux refus ~10%" avec liens vers les sources gov.uk et la liste de documents en clair.

---

### 8. Plan candidature avec deadlines

**Pourquoi.** Aujourd'hui "Ajouter à mon plan" sauvegarde un programme dans une liste — c'est statique. Pour vraiment aider, AkJol doit transformer ça en *plan d'action vivant* avec dates et étapes.

**Comment.**
- Extension du store `lives-store` ou nouveau `plan-store` : chaque programme adopté génère des `PlanItem` (étapes pré-définies par programme).
- Étapes types : "Inscription plateforme", "Lettre motivation", "Dossier complet", "Entretien (si convoqué)", "Réponse école".
- Dates : auto-remplies depuis `applicationOpens`/`applicationCloses` du programme + offsets typiques.
- UI : timeline horizontale sur `/passport` onglet "Mon plan", chaque étape cochable, sticky-bar mobile "Prochaine action dans X jours".
- Notifications navigateur (Web Push API) : 7j et 24h avant chaque deadline. Opt-in explicite.
- Email reminders (cf. #21) si compte connecté.

**Done quand.** Léa adopte LP ASUR → son plan affiche : "✓ Inscription IUT (1 mars-15 mai) · ☐ Lettre motivation (deadline 1 avril) · ☐ Stage CV (recommandé)". Notif navigateur 7 jours avant la deadline.

---

### 9. Auth + compte multi-device

**Pourquoi.** Aujourd'hui : 100% localStorage. Un user qui change de téléphone perd tout. Pour un produit où on construit une trajectoire sur 3-5 ans, c'est inacceptable.

**Comment.**
- Auth provider : NextAuth.js (Auth.js) avec Google + email magic-link. Pas de mot de passe (UX 15-22 ans).
- Backend : adapter Postgres ou Supabase. Tables `users`, `accounts`, `sessions`.
- Sync : quand un user se connecte, push localStorage → API ; pull API → localStorage. Conflict resolution `lastWriteWins` au niveau passeport ; merge par ID au niveau lives + plan.
- UI : bouton "Se connecter" dans la nav, modal Google/email. Page `/account` pour gérer.
- RGPD : consent screen explicit, page `/privacy`, `/terms`. Export complet de la donnée + suppression de compte (obligation légale UE).
- Migration silencieuse : si un user anonyme (localStorage seul) se connecte, ses données locales sont uploadées comme initial state du compte.

**Done quand.** Léa crée un compte → utilise sur PC → ouvre sur son tel → tout est là. Page `/account` avec bouton "Télécharger mes données" (JSON export) et "Supprimer mon compte" (effacement total avec confirmation 3 étapes).

---

### 10. Backend API

**Pourquoi.** Aujourd'hui les programmes sont dans le bundle JS — non scalable au-delà de 200 entrées (perfs + taille bundle). Il faut un backend dès qu'on dépasse l'MVP démo.

**Comment.**
- Stack proposée : Next.js API routes (`src/app/api/*/route.ts`) ou un service séparé (Hono, Fastify) selon préférence.
- Database : Postgres via Drizzle (déjà dans le monorepo `packages/db`).
- Endpoints minimaux :
  - `GET /api/programs?country=FR&level=master&search=info` — paginated, filtré.
  - `GET /api/programs/:id` — fiche complète.
  - `GET /api/schools?city=Paris` — paginated.
  - `GET /api/schools/:id` — avec ses programmes.
  - `POST /api/feasibility` — body `{passport, programIds[]}` → résultats. Permet de décharger le calcul côté client si le moteur grossit.
  - `GET /api/jobs` + `/api/jobs/:id`.
  - `POST /api/lives` (CRUD) avec auth.
- Cache : Cloudflare ou Redis pour les endpoints lecture-seule (programs, schools).
- Search : Postgres full-text initial, Meilisearch quand on dépasse 10k entrées.
- Côté front : hooks TanStack Query (déjà mentionné dans la spec §14, pas encore installé) — `useQuery` qui remplace l'import statique des données.

**Done quand.** Tous les imports `from "../data/programs"` sont remplacés par `useQuery(["programs", filters])`. Le bundle JS perd ~150KB. Le `/catalog` charge en <500ms.

---

### 11. Plan B / risk simulator

**Pourquoi.** Le doc §11 est sourd à cette dimension : *toute* trajectoire d'études peut échouer (BTS raté, prépa non admise, refus visa). Sans plan B explicite, AkJol pousse un récit "tout va bien" qui n'est pas honnête.

**Comment.**
- Sur `/program/[id]` et sur les fiches trajectoires : nouvelle section **"Et si ça ne marche pas ?"** *toujours visible* (pas en bas de page).
- Pour chaque étape avec `feasibility.probability < 1`, AkJol calcule la branche d'échec : si tu rates X, voilà 2-3 alternatives qui partent du même point.
- Implémentation : [`src/engine/planB.ts`](apps/akjol_front/src/engine/planB.ts) — `(trajectory, failurePoint) => Alternative[]`.
- Exemples :
  - "Si tu n'es pas admis en MPSI Louis-le-Grand → MPSI lycée moins coté reste possible (+5 candidatures suggérées) ou L1 Maths Sorbonne."
  - "Si tu rates ton BTS SIO → redoublement (taux réussite 72%) ou bachelor en alternance qui accepte la 1re année validée."
- UI : encart avec icône ⚠️ subtile, ton calme, factuel. Pas anxiogène.

**Done quand.** Léa sur sa fiche LP ASUR voit "Et si tu n'as pas la moyenne 12 attendue ? → BTS Réseaux post-validation (90j de travail), Bachelor cyber CESI (taux admission 78%)".

---

### 12. i18n FR / EN minimum

**Pourquoi.** Sans EN au minimum, Lana (MY) et toute la cible internationale ne peuvent pas utiliser AkJol. L'i18n n'est pas optionnelle pour un *routeur mondial*.

**Comment.**
- Lib : `next-intl` (App Router compatible, perf OK).
- Strings extraites dans `src/messages/fr.json` + `src/messages/en.json`. Toutes les chaînes UI passent par `t("key")`.
- Routes localisées : `/fr/explore`, `/en/explore`. Middleware Next pour redirection selon `Accept-Language`.
- Devises : `Intl.NumberFormat` avec fallback symbole `€`/`£`/`$`. Conversion automatique selon locale (taux d'API ouvert ECB).
- Dates : `Intl.DateTimeFormat` partout (déjà partiellement fait avec `toLocaleDateString`).
- À NE PAS faire pour MVP : ES, AR, ZH, MS — gardés pour V2 quand le coût de traduction se justifie.

**Done quand.** Switch FR/EN dans le footer ou nav. Tous les textes UI traduits. Les dates et montants sont localisés. Le passeport stocke `locale: "fr" | "en"`.

---

### 13. Page "Comment AkJol calcule"

**Pourquoi.** La spec §13 ("honnêteté épistémique") est un engagement moral. Un site qui produit des "78% de chances" sans expliquer comment il les calcule est intrinsèquement non-fiable. C'est aussi un argument de différenciation vs concurrents opaques.

**Comment.**
- Route statique : [`src/app/methodologie/page.tsx`](apps/akjol_front/src/app/methodologie/page.tsx).
- Sections :
  1. **Comment on calcule la probabilité.** Pseudo-code lisible, avec vrais coefficients du moteur. *"On part de 50%, +15% si moyenne validée, +5% par certificat de langue au-dessus du minimum…"*
  2. **Sources des données.** Liste publique : ONISEP date X, UCAS date Y, statistiques INSEE Z. Chaque source linkée.
  3. **Conditions vs suppositions.** Définitions, exemples concrets, pourquoi on les distingue.
  4. **Limites connues.** *"AkJol ne modélise pas la qualité subjective de la lettre de motivation. Ne pondère pas le réseau personnel. Ne tient pas compte des accommodations handicap."*
  5. **Biais identifiés.** *"Les programmes français sont sur-représentés. Les écoles privées avec budget marketing apparaissent plus."*
  6. **Comment contribuer / signaler.** Lien vers GitHub Issues.
- Footer-link permanent "Méthodologie" sur toutes les pages.

**Done quand.** Page accessible, lisible en <5 min par un non-tech, avec un changelog visible des mises à jour du modèle.

---

## P1 — Différenciation

### 14. Comparateur de trajectoires complètes

**Pourquoi.** Le comparateur actuel compare des *programmes isolés*. Mais une décision réelle compare des *parcours* (Bac → Prépa → École vs Bac → Médecine vs Bac → Allemagne).

**Comment.**
- Extension du store : `comparator.trajectories: Trajectory[]` (max 3).
- Bouton "Ajouter cette trajectoire au comparateur" sur chaque trajectoire sauvegardée.
- Page `/compare` : 3e tab à côté de Formations / Établissements → "Trajectoires".
- Tableau aligné : étapes (mini-frise visuelle), durée totale, coût total estimé, langue, probabilité globale (produit des étapes), visa, salaire médian sortie, reconnaissance internationale (mini-monde flags), risques.
- Mise en évidence : meilleur sur chaque ligne, plus risqué.
- Export "Sauvegarder cette comparaison" (URL stable + PDF).

**Done quand.** Léa compare "Via LP ASUR puis Master" vs "Via École d'ingé Cnam ATS" vs "Via Bachelor Epitech" → tableau côte à côte, durée 5 vs 4 vs 6 ans, coût total 15k vs 0k vs 28k, etc.

---

### 15. Feed étudiants `/feed`

**Pourquoi.** L'inspiration et la *social proof* manquent cruellement à un site d'orientation. Voir des parcours réels d'étudiants similaires lève les blocages psychologiques ("je peux le faire").

**Comment.**
- Route : [`src/app/feed/page.tsx`](apps/akjol_front/src/app/feed/page.tsx).
- Lib : `@tanstack/react-virtual` pour scroll infini performant.
- Modèle : `StudentJourney` (avatar, prénom, drapeau origine, année, mini-parcours en chips, métier final, ville, entreprise, tag "Comme toi" si match passeport ≥70%).
- V1 : *parcours synthétiques* basés sur statistiques publiques (ONISEP "Que sont-ils devenus ?", INSEE, Eurostat). Flag explicite *"Profil-type — pas une personne réelle"*.
- V1.1 : ouverture aux profils opt-in (cf. #25).
- Filtres haut : "Comme moi" (default), Origine identique, Métier visé, Pays d'arrivée, Avec bourse.
- Actions par carte : Voir parcours complet → `/trajectory/[id]`, Sauvegarder, Demander conseil (V1.1).

**Done quand.** Le feed propose 50+ parcours synthétiques. Léa voit "Maxime, FR, 2022, BTS SIO 2A → Licence pro réseau IUT Paris → Master MBDS → DevOps chez OVH" en haut.

---

### 16. Sourcing visible sur tous les chiffres

**Pourquoi.** §13 le demande. Aujourd'hui un chiffre comme "salaire médian 32k€" apparaît sans source. Un user averti ne fait pas confiance.

**Comment.**
- Extension du modèle de données : chaque champ chiffré (`costPerYear`, `outcomesSalaries`, `admissionRate`, etc.) gagne un sibling `*Source: { label, url, date }`.
- Composant [`src/components/SourcedNumber.tsx`](apps/akjol_front/src/components/SourcedNumber.tsx) — affiche le chiffre, ⓘ au survol → popover *"ONISEP 2024-09-15 · voir"*.
- Style discret : juste l'icône ⓘ (12px) à côté du nombre.
- Pour les chiffres calculés (probabilité, score composite), source = "AkJol modèle v1.4 — basé sur N dossiers" + lien vers `/methodologie` (#13).

**Done quand.** Survol "78% ± 8" sur fiche programme → popover "Modèle AkJol v1.4 · 124 dossiers similaires · méthodologie". Survol "32k€ salaire médian" → "INSEE DADS 2023 · voir source".

---

### 17. Catalogue métiers `/jobs`

**Pourquoi.** Le métier est l'autre point d'entrée logique (avec le passeport). Beaucoup de jeunes pensent métier d'abord, formation après. Sans catalogue dédié, AkJol force le sens passeport→métier.

**Comment.**
- Route : [`src/app/jobs/page.tsx`](apps/akjol_front/src/app/jobs/page.tsx) + `/jobs/[id]/page.tsx`.
- Source données : ROME (Pôle emploi), O*NET (US), ESCO (UE) — référentiels publics, ~3 000 métiers chacun.
- Schéma `Job` : code, label, descriptionFR, descriptionEN, salaryMedian by country, regionsTopHiring, dailyTasks, riskAutomation, requiresDiplomas, leadingPrograms (programmes qui y mènent), nextLevels.
- UI catalogue : grid cards avec mini-icône, salaire, "X formations mènent ici".
- Fiche métier : hero (titre, salaire, croissance), day-in-the-life (cf. #34), top 5 trajectoires depuis ton passeport (#5), témoignages (#28).
- Recherche avec autocomplete + filtres domaines.

**Done quand.** Page `/jobs` avec 200+ métiers minimum. Cliquer "Pentester" → fiche complète avec trajectoires, salaire 38-65k FR, régions Paris/Lyon/Toulouse, 6 témoignages.

---

### 18. Annuaire bourses `/bourses`

**Pourquoi.** *Argent* est le 1er filtre d'élimination. AkJol qui ne mentionne pas les bourses est incomplet. Une bourse Erasmus de 6000€/an change radicalement la carte des possibles.

**Comment.**
- Source données : CROUS (BCS, mobilité), Erasmus+, Campus France, fondations (Vallet, Robert de Sorbon…), bourses pays-spécifiques.
- Schéma `Scholarship` : nom, montant min/max, durée, critères d'éligibilité (passport-matchable), pays cibles, deadline candidature, dossier requis, taux d'attribution.
- Auto-matching : sur `/passport`, section "Bourses pour toi" qui filtre selon âge, revenus famille, pays origine/destination, niveau études.
- Intégration budget (#6) : si une bourse matche, elle est auto-appliquée en déduction dans le calcul total (avec toggle "imaginer sans la bourse").
- Page dédiée `/bourses` : filtre + liste + calendrier deadlines.

**Done quand.** Léa avec quotient familial X voit "Bourse CROUS échelon 4 · 4 600€/an · candidature avant 15 mai" + 2 autres options. Sur sa trajectoire LP+Master, le total descend de 17k à 8k.

---

### 19. Coût de la vie par ville étudiante

**Pourquoi.** "Frais de scolarité 0€" + "loyer Paris 800€" = différent de "frais 0€" + "loyer Saclay 450€". Sans cette dimension, le calculateur budget (#6) est faux.

**Comment.**
- Source : Numbeo (API), Mercer, ou compilation manuelle pour ~50 villes étudiantes principales.
- Schéma `CostOfLiving` : ville, country, monthlyRent (studio 30m²), monthlyFood, monthlyTransport, monthlyOther, currency, lastUpdated.
- Intégration : sur la fiche école, encart "Vivre à [ville]" — montant mensuel total estimé étudiant + breakdown.
- Sur le calculateur budget, multiplier par durée → coût vie total.
- Sur le drawer pays (#2), section "Vivre dans ce pays" — moyenne et top 3 villes étudiantes.

**Done quand.** Sur la fiche TUM, "Vivre à Munich · ~1 100€/mois · loyer 600€ · transport 50€ · alimentation 250€ · autres 200€".

---

### 20. Checklist documents persistée

**Pourquoi.** Préparer un dossier candidature = collecter 8-15 documents souvent réutilisables (relevés, lettres, photos, certificats). Aujourd'hui chaque programme a sa liste indépendante. Source de pénibilité énorme.

**Comment.**
- Schéma : extension du `passport-store` avec `documents: { code: string; name: string; status: "todo"|"requested"|"received"|"sent"; expiresAt?: string }`.
- Quand un programme est ajouté au plan, ses `program.documents` se mappent à des `Document` partagés (déduplication par nom).
- UI dans `/passport` onglet "Mes documents" : liste cochable, statut éditable, expiration warnings (passeport <6 mois → rouge).
- Un document utilisé sur N programmes apparaît avec badge "Réutilisé pour N candidatures".
- Future : upload de fichiers réels (PDF) avec stockage chiffré (Cloud + KMS). Phase 2.

**Done quand.** Léa ajoute LP ASUR + Master MBDS au plan → sa checklist a 6 documents distincts (au lieu de 12 dupliqués). "Bulletins BTS" est marqué "réutilisé 2x".

---

### 21. Suivi candidature manuel

**Pourquoi.** Une fois la candidature envoyée, le user veut tracker l'avancement *par programme*. Aujourd'hui c'est impossible.

**Comment.**
- Schéma : extension du `plan` avec `applicationStatus: "draft"|"submitted"|"under_review"|"interview"|"admitted"|"rejected"|"withdrawn"|"deferred"`.
- UI dans `/passport` onglet "Mon plan" : pour chaque programme adopté, un dropdown statut + champ notes libre + date de chaque transition.
- Stats persos : "X candidatures · Y en cours · Z admises" au sommet.
- Anonymisé en agrégé (cf. #22) : alimente la stat "taux d'admission réel par programme" pour les futurs users.

**Done quand.** Léa marque LP ASUR "envoyée le 15 avril", "convoquée le 5 mai", "admise le 20 mai". Stats globales : 1/1 admise.

---

### 22. Lettres de motivation assistées

**Pourquoi.** *Le* pain point. Les étudiants suent sang et eau sur la lettre, sans repère. Une assistance même légère (template + IA reformulation) fait gagner des heures et améliore la qualité.

**Comment.**
- IA : Claude (via Anthropic API) ou Gemini, prompt scoped strictement à l'aide à la rédaction (pas de "fais-la pour moi", mais "améliore cette phrase").
- Composant : éditeur texte sur fiche programme, sections pré-structurées (Pourquoi cette école, Pourquoi ce programme, Mes atouts, Mon projet pro).
- Pour chaque section : exemples anonymisés d'admis (cf. #28 témoignages), boutons IA "Reformule plus court", "Plus formel", "Vérifie grammaire/orthographe".
- Sauvegarde par programme dans `passport-store`.
- Anti-triche : disclaimer en haut "AkJol assiste, ne rédige pas. Tes admissions reposent sur tes mots."

**Done quand.** Léa rédige sa lettre LP ASUR dans AkJol, voit 3 exemples d'admis (caviardés), utilise "Reformule plus court" sur son intro et passe de 280 à 190 mots.

---

### 23. Base de données contributive

**Pourquoi.** L'ingestion automatique (#4) couvre les gros datasets. Mais il y a des milliers de petites écoles, programmes spécialisés, équivalences exotiques que seule la communauté peut maintenir. Modèle OpenStreetMap appliqué à l'éducation.

**Comment.**
- Workflow contributeur : route `/contribute` (auth requise), formulaire structuré pour proposer un programme/école/équivalence.
- Modération : table `pending_changes` Postgres, queue de review pour curators (#3).
- Outil curator : interface de review avec diff visuel, bouton Approve/Reject/Request changes.
- Gamification légère : badges de contribution ("Contributor", "Expert FR", "Equivalence master").
- Versioning : chaque entité publique a un `changeLog` consultable.
- Open data : export CSV public mensuel sous CC-BY-SA.

**Done quand.** Un user soumet "Bachelor Cybersécurité ESILV" → curator review → merge en 24h → la fiche apparaît dans le catalogue. Dashboard `/contribute/leaderboard` montre top contributeurs.

---

### 24. Témoignages réels d'anciens

**Pourquoi.** Les parcours synthétiques (V1 du feed #15) sont un proxy honnête mais limité. Des voix réelles, opt-in, modérées, augmentent radicalement la confiance.

**Comment.**
- Modèle : `Testimonial` (authorId, programId, year, role: "student"|"alumni", text, photo?, verified: boolean).
- Onboarding témoignage : quand un user marque un programme "validé/diplômé" sur son passeport, prompt opt-in "Veux-tu raconter ton expérience ?".
- Modération : table `pending_testimonials`, review humaine + heuristiques (longueur min, no-PII).
- UI : affiché sur fiche programme, fiche école, fiche métier (#17). Filtre "Profils similaires au tien".
- Vérification badge : si le user a une trajectoire complète documentée dans son compte → badge "Vérifié AkJol".
- Anti-abus : signalement utilisateur, modération community-based + équipe.

**Done quand.** 50+ témoignages publiés. Sur fiche LP ASUR, 3 témoignages visibles dont 2 "vérifiés AkJol" — "ce qui m'a surpris en LP ASUR…".

---

### 25. Vote utilité de chaque suggestion

**Pourquoi.** Le moteur de feasibility a des biais. Le seul moyen d'apprendre, c'est le feedback explicite des utilisateurs sur la qualité des recommandations.

**Comment.**
- Sur chaque carte programme dans `/explore` : micro-buttons 👍/👎 "Cette suggestion est-elle pertinente ?".
- Stockage : table `recommendation_feedback` (userId, programId, passportSnapshot, vote, timestamp).
- Boucle d'amélioration : analyse périodique → ajustement pondérations du moteur. *"Les programmes type X sont systématiquement votés non-pertinents pour profil type Y → réduire match."*
- Transparence : sur la page Méthodologie (#13), section "Apprentissage continu" qui montre les ajustements appliqués.
- Anti-spam : 1 vote / programme / user / 7 jours.

**Done quand.** 1 000+ votes collectés. Le moteur v1.5 ajuste 3 coefficients basé sur ces votes, documenté publiquement.

---

### 26. Coach IA scoped au passeport

**Pourquoi.** Beaucoup de questions n'ont pas de page dédiée : *"Est-ce que je peux faire prépa après mon BTS ?"*, *"C'est mieux Centrale ou X ?"*. Un assistant conversationnel boucle ces questions sans hallucination.

**Comment.**
- Lib : Anthropic SDK, modèle Claude Sonnet 4.6 (rapport coût/qualité).
- Prompt système strict : "Tu es l'assistant AkJol. Tu réponds UNIQUEMENT avec les données du passeport et de la base AkJol. Si tu ne sais pas, dis-le. Tu ne fabriques aucun chiffre. Tu cites toujours tes sources."
- Tool use : access aux endpoints API (#10) — `searchPrograms`, `getFeasibility`, `getJobs`. Pas d'accès web ouvert.
- UI : bouton "Demander à AkJol" floatingsur toutes les pages, ouvre un drawer chat à droite.
- Limites : 20 messages/jour pour user gratuit, illimité si premium plus tard. Coût modéré ($0.003 / 1k tokens × 500 tokens moyens = $0.0015/msg).
- Logs anonymisés pour amélioration prompts.

**Done quand.** Léa demande "Centrale ou X ?". Le coach répond avec données factuelles, signale "X n'est pas dans la base AkJol pour l'instant", suggère trois écoles comparables qu'on a.

---

### 27. Re-planning automatique

**Pourquoi.** La vie change. Diplôme validé, raté, certificat obtenu, projet réorienté. AkJol doit *suivre* l'utilisateur sur des années — pas juste l'aider une fois.

**Comment.**
- Trigger : à chaque update du passeport (diplôme statut → "obtenu", nouveau certificat, etc.), recalculer les feasibilities sur les trajectoires sauvegardées et le plan.
- Notification : *"Ton diplôme BTS validé déverrouille 3 nouveaux programmes. 1 trajectoire sauvegardée passe de 65% à 87%. 1 programme du plan se ferme (deadline passée)."*
- UI : encart sur la landing au prochain login, "Mises à jour de tes possibilités".
- Backend : cron quotidien qui scanne les passports + emails reminders sur les changements significatifs (>10pp probabilité).

**Done quand.** Léa marque BTS validé en juillet 2026 → notif "5 programmes deviennent ouverts directement (sans étape de validation)" + email récap.

---

### 28. Mode famille

**Pourquoi.** Beaucoup de décisions d'orientation se prennent en famille. Aujourd'hui les parents n'ont pas d'accès propre. Soit ils utilisent le compte de l'enfant (mauvais), soit ils sont coupés (mauvais aussi).

**Comment.**
- Modèle : un compte "famille" lie 1 étudiant (owner) + 1-2 parents (viewers). Invitation par email.
- Permissions : parent voit le passeport, les trajectoires sauvegardées, le plan, les bourses applicables. Ne peut PAS modifier le passeport. Peut commenter (notes attachées aux items du plan).
- UI : badge "Vue parent" en haut, lecture-seule visuel. Section "Notes des parents" sur chaque programme adopté.
- Notifications partagées : parent et enfant reçoivent les mêmes deadlines.
- Privacy : l'étudiant peut révoquer l'accès à tout moment. Aucune visibilité sur les recherches privées de l'étudiant (juste sur le plan officiel).

**Done quand.** Maman de Léa reçoit invitation, crée son compte, voit les 3 programmes du plan + commente "regarde aussi celui d'Aix-en-Provence si tu veux te rapprocher de mamie". Léa voit le commentaire.

---

### 29. Mode conseiller orientation

**Pourquoi.** Un prof ou conseiller d'orientation gère 30-100 élèves. Sans outil dédié, c'est ingérable. Et c'est un B2B viable (les régions/écoles paient).

**Comment.**
- Compte rôle "counselor" : peut gérer une cohorte (lien d'invitation par classe).
- Dashboard `/counselor` : liste élèves, filtres "qui n'a pas commencé", "qui est bloqué", "qui a candidaté", "deadlines proches".
- Suggestions par élève (avec consentement explicite de l'élève) : "marquer comme suivi", commentaires privés conseiller-only.
- Export PDF cohorte : "État des candidatures Terminale S 2026 — Lycée X".
- Modèle B2B : 99€/an/conseiller, payant après 30j de trial.

**Done quand.** Mme Dupont (orientation lycée Voltaire) a 27 élèves invités, dashboard fonctionne, peut envoyer rappels groupés "n'oubliez pas la deadline Parcoursup dans 7j".

---

### 30. PWA installable + offline mode

**Pourquoi.** La cible 15-22 ans utilise massivement le téléphone, parfois en réseau pourri (transports, école). Une PWA avec passeport et plan consultables offline est un game-changer ergo.

**Comment.**
- Service Worker via `next-pwa` ou Workbox.
- Cache strategy : stale-while-revalidate sur les routes statiques (`/`, `/methodologie`, fiches programme), cache-first pour les assets, network-only pour API mutations.
- Offline state : le passeport, le plan, les vies sauvegardées sont déjà localStorage → consultables sans réseau.
- Manifest.json : icônes, theme color coral, name "AkJol", display "standalone".
- Install prompt : badge UI discret quand l'utilisateur a engagé sur 2+ sessions.
- Sync différé : si offline et l'utilisateur édite, queue les mutations + sync au retour réseau (Background Sync API).

**Done quand.** "Installer AkJol" disponible sur mobile et desktop. App s'ouvre offline et le passeport reste consultable. Lighthouse PWA score > 90.

---

### 31. a11y AA

**Pourquoi.** Légal (RGAA en France pour les services publics-affiliés, prêts dans nos cibles), mais surtout juste : la cible inclut beaucoup de jeunes daltoniens, dyslexiques, malvoyants, sourds. Aujourd'hui, on n'a rien fait.

**Comment.**
- Audit : `axe-core` automatisé en CI + audit manuel `WAVE` + tests screen reader (NVDA/VoiceOver).
- Fixes prioritaires :
  - Contrastes : passer tous les `text-[#1a1d24]/40` à au moins `/60` pour AA.
  - Labels ARIA sur tous les boutons-icônes.
  - Focus rings visibles (Tailwind `focus-visible:ring-2`).
  - Navigation clavier complète (Tab order logique, raccourcis documentés).
  - Pas de couleur seule pour signifier (status open/closed → icône + texte + couleur).
  - Skip-to-content link en haut de page.
- Tests utilisateurs avec personnes en situation de handicap (3-5 sessions).
- Page `/accessibilité` documentant les choix et le contact pour signaler.

**Done quand.** Audit Lighthouse a11y score 100. Un user en VoiceOver complète l'onboarding sans aide.

---

### 32. Analytics privacy-first

**Pourquoi.** On ne sait *rien* aujourd'hui sur l'usage : où les users abandonnent, quels filtres servent, quelles trajectoires sont dupliquées. Sans data, on optimise à l'aveugle.

**Comment.**
- Stack : Plausible (self-hosted) ou PostHog (self-hosted), pas Google Analytics (RGPD + indépendance).
- Events trackés : page view, onboarding step, "Continuer depuis ici", "Sauver une vie", "Calculer" (avec aim), abandon path.
- Pas de PII : userId pseudonyme côté server, pas dans le bundle.
- Page transparence `/data` : qu'est-ce qui est collecté, comment, durée de rétention (90j max).
- Opt-out simple sur la même page.
- Funnels visuels en interne pour identifier drop-offs.

**Done quand.** Dashboard interne montre "taux complétion onboarding 68%, drop principal à étape 4 contraintes". Décisions design priorisées sur ces données.

---

## P2 — Polish & wow

### 33. Versioning du modèle de feasibility

**Pourquoi.** Quand le moteur s'améliore, l'utilisateur doit savoir que ses chiffres ont évolué — et pourquoi.

**Comment.** Tag de version sur chaque `FeasibilityResult` (`computedBy: "engine-v1.4"`). Page changelog public sur `/methodologie/changelog`. Notif user si une trajectoire sauvegardée a changé > 10 points.

**Done quand.** Page changelog visible, recalcul cron des trajectoires sauvegardées, email "ton score est passé de 78% → 71%" avec explication.

---

### 34. Day-in-the-life par métier

**Pourquoi.** Un titre de poste reste abstrait. *"7h45 réunion, 9h code review, 11h debug, 14h prez client"* est concret, projetable.

**Comment.** Texte structuré (12 horaires max), illustration ou photo, idéalement une vidéo courte 60s. Source : interviews professionnels via partenariats (CIDJ, Onisep TV).

**Done quand.** 30 métiers ont un day-in-the-life. Sur fiche métier, section pliable "Une journée type" avec timeline horizontale.

---

### 35. Quiz d'orientation RIASEC

**Pourquoi.** Pour les 30%+ d'utilisateurs qui cochent "Surprends-moi" à l'onboarding, AkJol n'a aucune piste. Un quiz RIASEC standard donne une signature qu'on peut matcher à des métiers.

**Comment.** Route `/quiz`. 30 questions standard, calcul Holland code (3 lettres dominantes), match aux métiers via leur tag RIASEC. Résultat : "Tu es ICR — voici 8 métiers à explorer". Signature stockée dans le passeport.

**Done quand.** Quiz prend <5 min, résultat lié au catalogue métiers (#17), génère 5 trajectoires perso depuis ton passeport actuel.

---

### 36. Mentorat alumni (V1.1)

**Pourquoi.** Un message direct à quelqu'un qui a fait le même parcours vaut toutes les FAQ.

**Comment.** Suite de #24 (témoignages). Auteurs opt-in pour être contactés (limité 5 messages/mois). Médiation modérée plateforme. Anti-harcèlement : signalement, blocage, modération humaine.

**Done quand.** 50+ alumni opt-in. Léa peut envoyer 1 message à un ancien LP ASUR via la plateforme, réponse en 7j en moyenne.

---

### 37. Communautés par projet

**Pourquoi.** Les candidats à la même école, la même année, ont les mêmes questions, le même stress, et veulent s'entraider.

**Comment.** Espaces "groupes" auto-créés par programme + année. Forum threadé minimal (Discourse intégré ou maison). Modération community + équipe. Privacy : visible seulement aux membres du groupe.

**Done quand.** Groupe "Médecine 2026 Paris" a 30 membres actifs, 200 messages, 0 message flaggé.

---

### 38. CV pré-rempli depuis passeport

**Pourquoi.** À chaque candidature, l'étudiant refait son CV. Le passeport contient déjà 80% des infos. Évident.

**Comment.** Page `/cv` génère un CV depuis le passeport (langues, diplômes, certificats, expériences si renseignées). Templates 3 styles (académique, créatif, sobre). Export PDF + édition WYSIWYG par-dessus.

**Done quand.** Génération <10s. PDF accepté par CommonApp/Parcoursup en upload direct.

---

### 39. Préparation entretien

**Pourquoi.** Les entretiens d'admission stressent. Avoir 20 questions types et un mode simulation aide énormément.

**Comment.** Banque de questions par école/programme, alimentée community. Mode "simulator" : IA pose les questions une par une, l'user répond à voix (transcription) ou texte, IA donne un retour structuré (pertinence, longueur, clarté). Coach IA #26 réutilisé.

**Done quand.** 200+ questions banque. 3 entretiens simulés pour Léa (LP ASUR, Cnam, Master MBDS).

---

### 40. Export PDF d'une trajectoire

**Pourquoi.** Pour partager au prof, parents, mentor. Un lien web n'est pas toujours pratique.

**Comment.** Lib `react-pdf` ou `puppeteer` server-side. Layout 3-pages : passeport résumé, trajectoire visuelle (timeline), détails programmes + budget total + plan d'action.

**Done quand.** Bouton "Exporter PDF" sur trajectoire, génère un fichier 200KB max, lisible en N&B.

---

### 41. Time machine "où serai-je en 2030 ?"

**Pourquoi.** Émotionnellement, projeter dans le temps est puissant. *"Selon cette trajectoire, en mars 2030 tu serais à Munich en M1 d'IA"*. Donne corps à une décision abstraite.

**Comment.** Sur trajectoire adoptée, slider année 2026-2035. Pour chaque tick, AkJol affiche : où tu es (ville/pays), ce que tu fais (programme/job), ton diplôme courant, ton salaire estimé (si jobs), ton coût de vie cumulé. Animation douce.

**Done quand.** Slider sur trajectoire Léa montre "2026 BTS Paris · 2027 LP ASUR · 2028 Master MBDS · 2030 DevOps junior Lyon 38k€ · 2033 Lead 55k€".

---

### 42. Diversité visible

**Pourquoi.** "% de femmes en école d'ingé", "% de boursiers en prépa", "% étrangers" — données critiques pour un user qui veut voir s'il sera "à sa place". Aujourd'hui invisible (et souvent gênant pour les écoles d'élite).

**Comment.** Source : MESR (FR), HESA (UK), équivalents. Sur chaque fiche programme, encart "Profil de la promo" : %F/%H, %boursiers, %internationaux, %insertion à 6 mois.

**Done quand.** Données affichées sur top 100 programmes français. Sourcées (#16). Note "données 2024 par MESR".

---

### 43. Empreinte carbone d'une trajectoire

**Pourquoi.** Une trajectoire internationale = avions, déménagements, coût climatique. La cible Z y est sensible. Information factuelle, pas culpabilisante.

**Comment.** Estimation simple : déplacements aller/retour pays origine ↔ destination × N années × tCO2/vol (source ADEME). Visiblement dans le résumé budget (#6) en sus du financier.

**Done quand.** Sur trajectoire Lana FR↔MY, affiche "~3,2 tCO2 sur 4 ans · équivalent à X années moyennes d'un Français".

---

### 44. Alumni map / réseau

**Pourquoi.** Un user voit "des gens qui ont fait ce parcours sont aujourd'hui chez Google, Doctolib, OVH". Concret, projectable, motivant.

**Comment.** Source : LinkedIn data agrégée (légalement complexe, voir partenariats LinkedIn ou compilation manuelle pour top programmes). Visualisation : carte monde avec heatmap entreprises + cluster par secteur. Anonymisation stricte (no individuals, juste agrégés).

**Done quand.** Sur fiche École Centrale, "Top 10 employeurs des diplômés 2018-2023" + carte mondiale des villes où ils travaillent.

---

## Comment lire et utiliser ce doc

### Ordre d'exécution recommandé

Si tu fais ces idées une par une, voici l'ordre qui maximise la valeur livrée à chaque étape :

1. **#9 Auth + compte** d'abord — sans ça, toute donnée user est volatile.
2. **#10 Backend API** — débloque la suite (ingestion, persistance lourde).
3. **#4 Ingestion vraies données** — passe d'un dataset démo à un produit utile.
4. **#1 Globe + #2 Drawer pays** — la promesse fondatrice.
5. **#3 `/admin/graph`** — le moat long-terme commence à se construire.
6. **#13 Page méthodologie** — tu peux la faire dès maintenant, c'est de la rédaction.
7. **#5 Reverse-engineering** + **#17 Catalogue métiers** ensemble — le user a maintenant 2 entrées (passeport, métier).
8. **#11 Plan B** — inscrit l'honnêteté au cœur du produit.
9. **#7 Visa & démarches** + **#19 Coût de la vie** + **#6 Budget total** — l'aspect "argent et papiers" devient sérieux.
10. **#18 Bourses** + **#8 Plan candidature deadlines** — l'aide à l'action.
11. **#12 i18n FR/EN** — débloque l'international.
12. **Le reste** dans l'ordre qui te plaît, en pondérant valeur user × effort.

### Risques & arbitrages

- **Tentation "tout-faire-en-IA".** L'IA (#26 coach, #22 lettres, #39 entretiens) est utile mais coûte cher en API et fragilise la confiance si elle hallucine. Toujours scoper aux données AkJol, jamais "ouvert".
- **Tentation "tout-réécrire-en-backend".** Le frontend actuel marche. Backend incrémental : commence par les listes de programmes/écoles, garde le reste en localStorage tant qu'il n'y a pas de besoin de sync.
- **Tentation "wow-features"** (#41 time machine, #44 alumni map) **avant les fondations.** Si l'utilisateur n'a pas confiance dans les chiffres (#13 méthodologie, #16 sourcing), aucune feature wow ne le retiendra.
- **B2B vs B2C.** Le mode conseiller (#29) est tentant car il monétise. Mais il dilue le focus B2C. À envisager une fois le B2C solide (Phase 3 minimum).

### Métriques de succès *du produit complet*

- **Onboarding completion rate** > 70% (vs probable ~40% aujourd'hui sans data).
- **Plan adoption** : > 50% des users complets adoptent au moins 1 trajectoire.
- **Retention 30j** : > 30% reviennent à 1 mois.
- **NPS** : > 40 chez les utilisateurs avec un plan adopté.
- **Couverture data** : 90% des bachelor/master FR + 60% des bachelor/master des 5 pays cibles (FR/UK/DE/US/CA).
