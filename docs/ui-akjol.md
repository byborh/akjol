# AkJol — Spec UI/UX du produit principal

>
> AkJol n'est **pas** un Sims, **pas** un node-editor, **pas** un catalogue. C'est un **routeur d'études mondial** : on entre son point de départ (pays + diplôme actuel + langues + budget + contraintes), et l'app calcule + visualise toutes les trajectoires d'études accessibles dans le monde, avec leurs conditions, leurs suppositions et leurs procédures.

---

## 0. Positionnement & mental model

- **Métaphore mère :** Skyscanner pour les études. L'utilisateur est *passager*, pas architecte. Il choisit une destination, AkJol calcule l'itinéraire (direct, ou avec escales : prépa langue, community college, année de remise à niveau…).
- **Killer feature :** le **graphe d'équivalences mondial** (BTS FR ≈ Associate Degree US ≈ Diploma UK level 5 ≈ Diplom MY…). L'UI est une lecture lisible de ce graphe — le moat est la donnée, pas le pixel.
- **Promesse à l'utilisateur :** *"Dis-moi où tu en es, je te montre toutes les vies possibles, les conditions pour y accéder, les chances réelles, et exactement comment postuler."*
- **Cibles primaires :** lycéens / étudiants 15–22 ans, mobile-first. Cibles secondaires : adultes en reconversion, parents.
- **Cas test obligatoires** que toute itération doit gérer correctement :
  - **Léa (FR, locale) :** BTS SIO 2A → quoi après ? Doit voir Licence pro réseau, école d'ingé via prépa ATS, master via L3 admission parallèle, alternance — avec pour chaque option : conditions de moyenne, probabilité d'admission selon son dossier, procédure (Parcoursup post-bac, Mon Master, candidature directe), deadlines.
  - **Lana (MY, internationale) :** STPM (équivalent bac malaisien) → quoi dans le monde ? Doit voir corridors France/UK/US/Allemagne/Singapour avec équivalence du STPM dans chaque système, langue requise, coût total estimé sur 3-5 ans, complexité visa, débouchés du métier visé dans le pays d'arrivée.

Le produit doit donner *la même qualité de réponse* à Léa qui veut bouger de 10 km et à Lana qui veut traverser l'Eurasie.

---

## 1. Brand & design language

- **Couleurs primaires :** Coral `#ee7768` (action, CTA, accent émotionnel), Vert `#a3cf91` (succès, "ouvert", probabilité haute), Ambre `#f5b86a` (conditions à remplir), Rouge sourd `#d96565` (fermé / non éligible).
- **Couleurs neutres :** Fond clair `#FAFAF7` (chaleur, papier), surface `#FFFFFF`, fond sombre `#1a1d24`, surface sombre `#22252c`. Bordures `black/5` en clair, `white/5` en sombre.
- **Light mode par défaut.** Le produit doit être chaleureux, optimiste, projectif. Dark mode disponible mais secondaire (pas le défaut comme dans `ui-canva.md`).
- **Polices :** OLIVE Display (titres, statements), Inter (corps), JetBrains Mono (chiffres, scores, probabilités).
- **Iconographie :** Lucide. Pas d'emoji dans l'UI produit (les emoji actuels dans `StartingPoint.tsx` 🎓📚🚀🏅 sont à retirer — ils datent les écrans).
- **Ton :** **chaud, factuel, encourageant, jamais infantilisant**. "Tu" partout. Des chiffres précis (pas "très bonnes chances" mais "78 %"). Aucun jargon administratif sans glossaire au survol.
- **Motion :** transitions 150–250ms ease-out. Le globe tourne lentement (1 tour / 60s). Pas d'animations gratuites — chaque mouvement doit signifier une transition d'état (ouverture, calcul, transition de carte). Respecter `prefers-reduced-motion`.

---

## 2. Architecture de routes

```
/                      → Landing + onboarding passeport (étape 1)
/onboarding            → Setup passeport multi-étapes (origine, diplôme, langues, budget, contraintes)
/explore               → Globe-routeur (vue monde, défaut après onboarding)
/explore/[country]     → Drawer pays : programmes accessibles, classés par match
/program/[id]          → Fiche programme : conditions, suppositions, procédure, débouchés
/compare               → Comparateur split-screen 2-3 trajectoires
/trajectory/[id]       → Trajectoire complète sauvegardée (parcours multi-étapes)
/feed                  → Feed "étudiants comme toi" (social proof / inspiration)
/passport              → Édition / consultation du passeport
/admin/graph           → Node-editor interne (cf. ui-canva.md), réservé au créateur de contenu
```

L'utilisateur ne **doit jamais voir** `/admin/graph`. C'est un outil interne de modélisation du graphe d'équivalences.

---

## 3. Onboarding : le passeport (`/onboarding`)

Première impression du produit. **Mobile-first, full-bleed, vertical.** L'utilisateur construit son "passeport-éducation" en 5 étapes courtes, une par écran. Chaque étape = une question, des options visuelles, un bouton *Continuer*. Barre de progression en haut (5 segments), bouton retour discret.

### Étape 1 — Pays d'origine
"D'où tu pars ?" — Search input typeahead avec drapeaux. ~250 pays. Détection IP en suggestion mais jamais imposée.

### Étape 2 — Diplôme actuel
"Où tu en es dans tes études ?" — Liste filtrée par le pays choisi à l'étape 1. Affiche les diplômes locaux dans leur **nom natif** (STPM, Abitur, Bac, A-Level, High School Diploma…) avec sous-titre traduit. Inclure "En cours" vs "Obtenu" avec sélecteur d'année (réelle ou prévue).

Pour les diplômes obtenus : champ optionnel pour la moyenne / GPA / note (avec aide contextuelle expliquant l'échelle locale).

### Étape 3 — Langues
"Tu parles quoi, à quel niveau ?" — Multi-select avec niveau CECRL (A1→C2) ou self-reported (basique / conversation / courant / natif). Possibilité d'ajouter un certificat (TOEFL/IELTS/DELF/TestDaF + score).

### Étape 4 — Contraintes
"Qu'est-ce qui pourrait te freiner ?" — Cartes toggleables : budget annuel max (slider), durée maximale d'études, distance max du domicile, besoin de bourse, contraintes familiales, alternance préférée. Toutes optionnelles — *Passer cette étape* visible.

### Étape 5 — Aspiration
"Tu vises quoi (même approximativement) ?" — Tags : domaines (Tech, Santé, Droit, Arts, Affaires…), métiers concrets (search), ou *"Je ne sais pas, surprends-moi"* (CTA principal pour les indécis — c'est le cas par défaut, à mettre en évidence).

### Validation
À la fin, un récap visuel du passeport sous forme de carte d'identité éducative (avatar facultatif, drapeau, diplôme, langues, contraintes). CTA *Voir mes possibilités* → bascule sur `/explore`.

Le passeport est **persisté** (localStorage immédiat, sync compte si connecté). Modifiable à tout moment depuis `/passport` ou via un bouton flottant *Modifier mon profil* présent partout.

---

## 4. Globe-routeur (`/explore`)

L'écran-pivot du produit. **Plein écran, le globe est le héros.**

### Layout

- **Globe 3D** centré (lib : `react-globe.gl` ou `cobe`). Tourne lentement, drag pour orienter, scroll pour zoom, fitView au double-tap.
- **Carte passeport flottante** (top-left, w-72, rounded-xl) : récap compact (drapeau origine, diplôme actuel, langues, budget). Click → ouvre `/passport` en modale.
- **Filtres flottants** (top-right) : durée max, budget max, langue d'enseignement, "alternance ok", domaine. Chaque filtre modifie l'illumination du globe en temps réel.
- **Search globale** (top-center) : tape un pays, une école, un métier — fly-to + drawer associé.
- **Légende** (bottom-left) : 🟢 directement ouvert · 🟡 ouvert avec une étape · 🔴 fermé pour ton profil actuel · ⚪ pas encore couvert par AkJol.
- **Stats live** (bottom-right) : *X programmes ouverts dans Y pays · Z trajectoires multi-pays accessibles*.

### Illumination des pays

Chaque pays est colorisé selon le **meilleur score d'accessibilité** parmi ses programmes pertinents pour le passeport courant :

- **Vert (`#a3cf91`)** : ≥1 programme directement éligible (équivalence reconnue + langue ok + budget ok + visa ok).
- **Ambre (`#f5b86a`)** : éligible avec **une** étape intermédiaire (ex : 6 mois de TOEFL, ou un foundation year). L'étape manquante est nommée au survol.
- **Rouge sourd (`#d96565`)** : nécessite ≥2 étapes ou bloqué par contrainte dure (visa fermé, équivalence non reconnue).
- **Gris (`#3f4046`)** : pays pas encore modélisé dans AkJol (toujours dire la vérité — ne pas faire semblant).

### Interactions globe

- **Hover pays** : tooltip — nom, drapeau, score (ex : "Allemagne — 47 programmes ouverts pour toi"), top-3 programmes en aperçu.
- **Click pays** : drawer latéral droit (`w-[420px]`, slide-in depuis la droite, le globe reste visible et reste interactif derrière). Détaillé en §5.
- **Click programme dans le drawer** → `/program/[id]` (page complète, pas une modale).
- **Search** : "Berlin" → fly-to Allemagne + drawer ouvert centré sur les programmes berlinois. "Médecine" → globe se ré-illumine sur les programmes médecine, autres atténués.

### Cas test : Léa (FR, BTS SIO 2A)

À l'arrivée sur `/explore`, la France doit être **vert vif** avec ~30+ programmes en *Licence pro réseau*, *Bachelor info*, *écoles d'ingé via ATS*, *masters via L3*. L'Allemagne ambre (langue manquante). Le Canada vert (anglophone partiel + Québec francophone). Lana, elle, voit une carte radicalement différente depuis le même UI — c'est la promesse.

### État vide (passeport incomplet)

Si l'utilisateur arrive sans passeport (lien partagé, navigation privée), afficher un overlay doux : *"Avant de te montrer le monde, j'ai besoin de te connaître"* + CTA vers `/onboarding`. Globe en arrière-plan grisé pour donner envie.

---

## 5. Drawer pays (`/explore/[country]`)

Slide-in droite, `w-[420px]`, fond `#FFFFFF` clair / `#22252c` sombre, divisé en sections collapsibles.

### Header (sticky)

- Drapeau (h-8) + nom du pays + bouton X.
- Stat ligne : *47 programmes ouverts · 12 ambre · 230 fermés · 89 non couverts*.
- Toggle *N'afficher que les programmes ouverts*.

### Sections (toutes collapsibles, ouvertes par défaut)

1. **Trajectoires recommandées** (3 cartes) — combinaisons "passeport actuel → diplôme cible" pré-calculées par le moteur. Ex pour Lana : *"STPM → Foundation year (Manchester) → Bachelor CS (Manchester) — 4 ans, ~£60k total, 82% chances"*. CTA *Voir la trajectoire* → `/trajectory/[id]`.
2. **Programmes accessibles directement** — liste de cartes programme (cf. §6 layout court).
3. **Programmes accessibles avec étape** — liste avec étape manquante en évidence ("+ TOEFL 80" / "+ Foundation year").
4. **Programmes fermés (et pourquoi)** — liste raccourcie, transparente sur les blocages.
5. **Vivre dans ce pays** — section info contextuelle : coût de la vie étudiant moyen, droit de travailler pendant études, démarches visa principales, lien vers ressources officielles. **Non décoratif** : c'est un facteur de décision majeur.

Chaque section a une animation d'ouverture courte (150ms). Le drawer doit scroller indépendamment du globe.

---

## 6. Fiche programme (`/program/[id]`)

Page **plein écran** (pas une modale), routable, partageable. La page la plus importante du produit — c'est ici que la décision se prend.

### Header

- Bandeau plein largeur avec photo de l'établissement (ratio 21:9), overlay dégradé pour lisibilité.
- En sur-impression : nom du programme, école, ville+pays, niveau (Licence/Bachelor/Master/…), durée, langue d'enseignement, mode (présentiel/alternance/distanciel).
- À droite, **gauge probabilité** circulaire (0–100%) calculée depuis le passeport — coral si <40%, ambre 40–70%, vert >70%. Le chiffre est *toujours* affiché avec son intervalle de confiance ("78 % ± 8 — basé sur 124 dossiers similaires").

### Section "Pour toi" (la signature AkJol)

Encart coloré en haut de la page, **personnalisé au passeport**. Trois blocs :

1. **Conditions remplies** ✓ liste verte — ex : "Diplôme reconnu (BTS SIO ≈ niveau requis)", "Langue OK (français C2)", "Budget compatible".
2. **Suppositions / risques** ⚠️ liste ambre — ex : "Suppose une moyenne ≥12/20 au BTS (tu as déclaré 13.4, ok)", "Suppose un avis favorable du jury", "La sélection se fait aussi sur lettre de motivation — non modélisé par AkJol".
3. **À compléter pour maximiser tes chances** liste actionnable — ex : "Passe le TOEIC ≥785 → +15% probabilité", "Stage 4 mois minimum recommandé". Chaque item est un *call to action concret*.

C'est cette section qui rend AkJol unique. Elle doit être **toujours visible sans scroll** sur desktop.

### Section "Comment postuler"

Procédure pas-à-pas, en cartes numérotées :

1. Plateforme (Parcoursup / Mon Master / UCAS / Common App / direct…) avec lien officiel.
2. Pièces à préparer (liste cochable, persistée dans le passeport).
3. Deadlines (calendrier visuel — chaque deadline est un point sur une frise mensuelle).
4. Frais de candidature.
5. Étapes optionnelles (entretien, test, oral).

Bouton *Ajouter à mon plan* → ajoute le programme à un *plan personnel* visible dans `/passport`, avec rappels possibles (email/notif).

### Section "Et après ?"

- Métiers typiques en sortie (cards) avec salaire médian dans le pays d'arrivée + 5 ans après diplôme.
- Poursuites d'études possibles (mini-graphe visuel : ce programme → masters/doctorats accessibles).
- Reconnaissance internationale du diplôme (icônes pays où ce diplôme est nativement reconnu).

### Section "Trajectoires qui passent par là"

3-5 trajectoires multi-étapes pré-calculées dont ce programme est une étape. Permet de découvrir des chemins inattendus.

### Sidebar droite (sticky desktop, drawer mobile)

- Bouton *Comparer avec…* → ajoute le programme au comparateur (max 3, badge sur le bouton flottant).
- Bouton *Voir une journée-type* → ouvre une modale avec un *day-in-the-life* (texte + visuel ; v1.1 : vidéo).
- Bouton *Étudiants qui ont fait ça* → mini-feed (3 cartes vers `/feed`).
- Lien officiel école.

### Cas test : Léa sur Licence pro réseau

- Probabilité : 84% (passeport contient BTS SIO en cours, moyenne 13.4, mention bien probable, anglais B2).
- Conditions remplies : BTS validé attendu, anglais ok, dans la bonne académie.
- Suppositions : "AkJol suppose que ton BTS sera validé en juin — si ce n'est pas le cas, cette trajectoire est suspendue", "Suppose pas plus de 2 absences non justifiées sur le S4".
- À compléter : "Stage de 8 semaines minimum côté réseau (vs sécurité)", "Lettre de motivation orientée infrastructure".
- Comment postuler : "Mon Master n'est pas pertinent ici — candidature directe sur la plateforme de l'IUT, ouverture mars, fermeture mai".

---

## 7. Comparateur de trajectoires (`/compare`)

**Split-screen 2 ou 3 colonnes** (responsive : tabs sur mobile). L'utilisateur ajoute des programmes ou des trajectoires complètes au comparateur depuis n'importe quelle fiche.

### Layout colonnes

Chaque colonne montre une *trajectoire* (parcours = liste de 1+ programmes enchaînés, sortie sur un métier). Lignes alignées horizontalement entre colonnes pour comparaison oeil-à-oeil :

| Ligne                         | Format                                                          |
| ----------------------------- | --------------------------------------------------------------- |
| Étapes                        | Mini-frise visuelle (1, 2, 3 boîtes connectées avec durée)      |
| Durée totale                  | Chiffre + barre relative                                        |
| Coût total estimé             | Chiffre + intervalle (frais scol. + vie - bourses estimées)     |
| Langue(s) requise(s)          | Badges CECRL                                                    |
| Probabilité globale           | Gauge (produit des probas étape par étape)                      |
| Visa / formalité              | Badge couleur (simple / moyen / complexe)                       |
| Salaire médian de sortie      | Chiffre dans le pays d'arrivée                                  |
| Reconnaissance internationale | Carte mini-monde des pays où le diplôme final est nativement reconnu |
| Risques principaux            | Liste courte                                                    |

Sur chaque ligne, **mise en évidence** auto de la "meilleure" colonne (vert sourd) et de la "plus risquée" (ambre sourd) — *uniquement quand un comparable existe*, jamais d'évaluation absolue.

### Footer

Bouton *Sauvegarder cette comparaison* (génère URL partageable), bouton *Choisir cette trajectoire* (ajoute la colonne choisie au plan dans le passeport).

---

## 8. Feed étudiants (`/feed`)

Vertical infinite scroll, **inspiré TikTok/Insta mais sobre**. Chaque carte = un *parcours réel* (ou synthétique flagué) d'un étudiant similaire au passeport courant.

### Carte feed

- Avatar + prénom + drapeau origine + année.
- Mini-frise du parcours (3-5 étapes en chips).
- Métier final + ville + entreprise (si public).
- Tag *"Comme toi"* coral si match passeport ≥70%.
- 3 actions : *Voir le parcours complet* (→ `/trajectory/[id]`), *Sauvegarder*, *Demander conseil* (v1.1 mentorat).

### Filtres haut de feed

*Comme moi* (default) · *Origine identique* · *Métier visé* · *Pays d'arrivée* · *Avec bourse*.

### V1 vs v1.1

V1 : feed alimenté par parcours synthétiques basés sur statistiques publiques (ONISEP, Eurostat, UNESCO) — flag *"Profil type"* explicite, pas de fausse identité.
V1.1 : ouverture aux profils réels opt-in.

---

## 9. Passeport (`/passport`)

Tableau de bord personnel. Trois onglets :

1. **Mon profil** — édition complète des champs d'onboarding, avec versionning ("J'ai validé mon BTS le 15/06" → recalcul global des probabilités).
2. **Mon plan** — programmes/trajectoires sauvegardés, deadlines à venir, checklist pièces, statut de candidature manuel.
3. **Historique** — recherches passées, comparaisons sauvegardées, parcours explorés.

---

## 10. Mobile-first

Tous les écrans doivent être **utilisables au pouce**, en portrait, sur un écran 360×800.

- Le globe sur mobile : performances limitées → fallback **carte 2D** (planisphère Mercator avec coloration identique) si device < seuil. L'illumination, les filtres, le drawer fonctionnent à l'identique.
- Le drawer pays devient un **bottom sheet** plein largeur en mobile (drag pour étendre/réduire).
- Le comparateur en mobile = **tabs swipables** (1 trajectoire visible à la fois, indicateurs en bas).
- La fiche programme : sections collapsibles, sidebar transformée en bottom sheet appelée par bouton flottant *Comparer / Sauver / Postuler*.

---

## 11. Modèle de données (esquisse, pour aligner UI et backend)

```ts
type Passport = {
  origin: { country: ISO2; languages: { code: string; level: CEFR }[] };
  currentDiploma: {
    countryRef: ISO2;
    code: string;          // "BTS_SIO_SISR", "STPM", "ABITUR", ...
    status: "in_progress" | "obtained";
    yearObtained?: number;
    yearExpected?: number;
    grade?: { value: number; scale: GradeScale };
  };
  certificates: { code: string; score: number }[]; // TOEFL, DELF, ...
  constraints: {
    maxBudgetPerYear?: { amount: number; currency: ISO3 };
    maxDurationYears?: number;
    needsScholarship?: boolean;
    workStudyPreferred?: boolean;
    maxDistanceKm?: number;
  };
  aspiration: { domains: string[]; jobs: string[]; openToSurprise: boolean };
};

type Program = {
  id: string;
  countryRef: ISO2;
  school: { id: string; name: string; city: string };
  level: "lycee" | "bachelor" | "licence" | "master" | "doctorat" | "certif";
  durationYears: number;
  languageOfInstruction: { code: string; minLevel: CEFR };
  costPerYear: { tuition: Money; livingEstimate: Money };
  admissionPlatform: "parcoursup" | "mon_master" | "ucas" | "common_app" | "direct" | string;
  requirements: AdmissionRequirement[];
  equivalenceFrom: DiplomaCode[];   // diplômes acceptés en entrée (clé du graphe mondial)
  outcomes: { jobs: JobRef[]; nextPrograms: ProgramRef[] };
  internationallyRecognizedIn: ISO2[];
};

type Trajectory = {
  id: string;
  steps: { program: ProgramRef; transition?: TransitionStep }[]; // foundation year, langue, ...
  totals: { years: number; cost: Money; probability: number };
  constraints: { visaComplexity: "simple"|"medium"|"complex"; languagesRequired: ... };
};

type FeasibilityResult = {
  status: "open" | "open_with_step" | "closed" | "uncovered";
  conditions: { met: Condition[]; unmet: Condition[] };
  assumptions: Assumption[];                    // les "suppositions" affichées à l'utilisateur
  toMaximize: ActionableSuggestion[];           // les "à compléter pour +X% chances"
  probability: { value: number; ci: number; basedOn: number };
  blockers?: Blocker[];                         // pour status "closed"
};
```

L'UI ne calcule rien : elle **rend** le `FeasibilityResult` retourné par le backend pour `(Passport, Program)`. Le moteur de feasibility est partagé entre globe (par pays, agrégé), drawer (par programme, court), fiche (par programme, complet) et comparateur (par trajectoire).

---

## 12. Gestion des "conditions" et "suppositions" (le coeur du produit)

Distinction sémantique stricte, à respecter dans l'UI :

- **Condition (verte/rouge)** : fait *vérifiable* sur le passeport. "Tu as un bac" → vrai/faux. "Ton TOEFL ≥ 80" → vrai/faux. Affiché en ✓ / ✗ avec couleur.
- **Supposition (ambre)** : hypothèse qu'AkJol est *forcé de faire* car non modélisable / non observable. "Suppose que tu obtiendras la mention bien" / "Suppose que ta lettre de motivation sera correcte" / "Suppose que la sélection 2026 ressemble à 2024-2025". Toujours préfixée *"AkJol suppose que…"* — l'utilisateur doit *savoir* que ce n'est pas garanti.
- **À compléter (coral, actionnable)** : suggestion concrète, chiffrée, qui modifierait le passeport et débloquerait/améliorerait la probabilité. *"Passe le TOEIC ≥785 (3 mois de prépa) → +15%"*.

Cette typologie doit être **homogène** dans la fiche programme, le drawer, le comparateur.

---

## 13. Honnêteté épistémique (règle non négociable)

AkJol manipule des décisions de vie. L'UI doit :

- **Toujours afficher une probabilité avec son intervalle de confiance** et la taille d'échantillon (`78% ± 8 — basé sur 124 dossiers`). Jamais un chiffre seul.
- **Ne jamais cacher les zones grises.** Si un pays n'est pas couvert : dire *"Pas encore couvert par AkJol"*, pas l'afficher faussement comme "fermé".
- **Ne pas pousser commercialement.** Le drawer pays et la fiche programme ne doivent pas mettre en avant un programme parce que son école paie. Si un modèle de monétisation B2B existe (cf. brief original), il doit être **strictement séparé** : encart *Sponsorisé* clairement étiqueté, jamais infiltré dans les recommandations.
- **Sourcer.** Chaque donnée chiffrée (salaire, coût, taux d'admission) doit être accompagnée d'un mini *Source* au survol (lien ONISEP, Eurostat, école, statistique publique).

---

## 14. Stack technique recommandée

- **Framework :** Next.js 15 (déjà en place dans `apps/akjol_front`), App Router.
- **State :** Zustand pour le passeport (un store dédié `passport-store`), TanStack Query pour les fetchs programmes/feasibility.
- **Globe :** `react-globe.gl` (WebGL) avec fallback `react-simple-maps` (SVG) en dessous d'un seuil de perf détecté.
- **UI primitives :** Radix UI + Tailwind (cohérent avec l'existant).
- **Animations :** Framer Motion (déjà utilisé), transitions explicites uniquement.
- **Cartes / drapeaux :** `flag-icons`, `world-atlas` (TopoJSON).
- **Fonts :** OLIVE Display (à licencier), Inter, JetBrains Mono via `next/font`.
- **Persistance passeport :** localStorage + sync compte si connecté (Supabase ou similaire — déjà à choisir côté back).

---

## 15. Découpage suggéré pour le MVP

1. **Phase 0 — passeport + onboarding** (sans globe). Permet déjà de stocker le profil et d'afficher une liste FR de programmes avec feasibility complète. Cas Léa testable de bout en bout.
2. **Phase 1 — globe + corridor unique** (FR ↔ MY ou FR ↔ UK). Le globe affiche tous les pays mais seul un corridor est "vert". Cas Lana testable sur un seul axe.
3. **Phase 2 — comparateur + fiche programme complète**.
4. **Phase 3 — feed (synthétique)**.
5. **Phase 4 — extension corridors**.

À chaque phase, le node-editor `/admin/graph` (cf. `ui-canva.md`) sert à modéliser/étendre le graphe d'équivalences qui alimente tout le reste. **Il ne sort jamais de la zone admin.**

---

## 16. Anti-patterns à éviter explicitement

- ❌ **Dark mode par défaut** (cassait l'émotion projective d'AkJol).
- ❌ **Métaphore node-editor / canvas / wires** côté étudiant (rebute la cible 15-22).
- ❌ **Emoji décoratifs** dans les titres de section et en-têtes.
- ❌ **Listes interminables** sans hiérarchie (le `StartingPoint.tsx` actuel charge des centaines de cartes sans guider).
- ❌ **Chiffres sans intervalle** — induisent en erreur.
- ❌ **Catalogues d'écoles sans contexte** (exigences, procédure, débouchés). Une fiche sans "Pour toi" n'a pas sa place dans AkJol.
- ❌ **Suggestions opaques** (jamais "ce programme est recommandé" sans le *pourquoi* lié au passeport).
- ❌ **Faux semblant de couverture** (afficher des programmes en pays non-modélisés).

---

## 17. Critère de succès UI/UX

Une seule métrique qualitative : **un lycéen de 16 ans, cible primaire, doit pouvoir, en moins de 5 minutes après la première ouverture, énoncer à voix haute trois trajectoires concrètes vers un métier qu'il vise — avec, pour chacune : durée, coût approximatif, probabilité, première démarche à faire.**

Si ce test échoue, l'UI a échoué, peu importe le reste.
