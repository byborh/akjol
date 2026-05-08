# Dossier projet — AkJol (Chemin Blanc)

> Document de cadrage produit & business pour **enrichir le projet AkJol**.
> Source code : ce monorepo (`apps/akjol_front`, `packages/db`, `packages/ingest`, etc.).
> Date : 2026-05-08.

---

## A. Présentation synthétique

### Décrivez votre projet en quelques lignes de manière très synthétique

**AkJol** (« Chemin Blanc » en kazakh) est un **routeur d'études** : l'étudiant entre son point de départ (niveau, diplôme, pays, langues, budget) et la plateforme calcule **toutes les trajectoires d'études et de carrière accessibles**, en France et à l'international, avec leurs **conditions explicites**, leurs **probabilités d'admission** et la **procédure exacte** pour postuler.

Contrairement à un catalogue passif (Onisep, Parcoursup, MonMaster), AkJol est un **outil actif et projectif** : il *simule* les conséquences d'un choix avant qu'il soit fait — études, métier cible, salaire, pays, visa, coût de la vie, Plan B en cas d'échec.

### D'où vous vient cette idée de projet ?

De ma propre expérience et de celle de mon entourage. Le système d'orientation français est **réactif** (« voici les filières existantes ») au lieu d'être **prospectif** (« voici ce que ta vie ressemblera si tu fais ce choix »). Le cas réel de **Léa** (BTS SIO 2A, hésite entre licence pro / école d'ingé / master) est emblématique : aucun outil ne lui dit *concrètement* ce que chacune de ces routes implique — admission, équivalences, métiers en sortie, salaire, pays accessibles. Les jeunes redoublent ou se reconvertissent souvent parce qu'on leur a vendu des cursus sans leur montrer la sortie.

### Quels objectifs personnels poursuivez-vous à travers ce projet ?

- **Aider concrètement** une génération qui souffre d'angoisse d'orientation (post-Covid, marché du travail incertain, explosion des trajectoires non-linéaires).
- **Monter en compétences sur le 0 → 1** : le développement n'est pas le verrou, c'est l'acquisition utilisateur, le modèle de données fiable, la confiance.
- **Construire un actif éthique** : un outil que je serais fier de montrer à un cousin de 16 ans, sans biais commercial caché.
- **Apprendre à arbitrer** entre exhaustivité (rêve : tous les diplômes du monde) et focus (réalité : Tech/Info × France pour le MVP).

### Quels sont les objectifs du projet à court / moyen / long terme ?

- **Court terme (6-12 mois)** : valider le besoin avec ≥ 500 lycéens/étudiants Tech FR, atteindre 30 % de complétion du passeport.
- **Moyen terme (12-24 mois)** : ouvrir 3 verticales supplémentaires (Santé, Commerce, Arts), couvrir 3 pays cibles (France, Canada, Allemagne).
- **Long terme** : devenir la référence francophone du « routeur d'orientation », avec un modèle économique B2B2C neutre (établissements payants pour la donnée d'usage agrégée et anonymisée, **jamais** pour influencer les recommandations).

---

## C. Les motivations

### Quelles sont les motivations qui vous poussent à développer ce projet ?

1. **Combler un manque vécu** : aucun outil francophone ne fait du *reverse-routing* (« je veux ce métier, comment y arriver depuis MA situation ? »). Tous les outils existants forcent à parcourir un catalogue, pas à recevoir des routes calculées.
2. **Refuser le modèle pub / lead-gen** qui domine le marché privé (Diplomeo, Studyrama). La confiance est le seul actif défendable à long terme.
3. **Se confronter au monde réel** : un produit qui ne touche jamais d'utilisateurs reste une démo. Sortir le MVP même imparfait est plus utile que de polir indéfiniment.
4. **Apprendre la partie qui me manque** : pipeline data, partenariats institutionnels (lycées, CIO), modèle économique éthique chiffré.

### Avez-vous de l'expérience en entrepreneuriat ?

Pas d'entreprise créée. Expérience en **développement produit de bout en bout** : architecture (monorepo Turborepo + pnpm), base de données (Drizzle + SQLite), pipeline d'ingestion (ONISEP data.gouv ~60k formations), front Next.js 16 avec internationalisation FR/EN, authentification, moteur de faisabilité et de routes inversées. Première confrontation à la **partie commerciale & légale** à venir.

---

## D. Le produit / service

### Décrivez précisément votre projet (produit, service, …)

**AkJol est une plateforme web** (responsive mobile-first, prête PWA) composée de **7 modules** déjà implémentés ou en chantier dans ce repo :

| Module | Route | Fonction |
|---|---|---|
| **Passeport étudiant** | [/passport](apps/akjol_front/src/app/passport) | Capture le point de départ : diplôme actuel, niveau, pays, langues (CECRL), budget, contraintes visa. Source de vérité de toutes les recommandations. |
| **Onboarding guidé** | [/onboarding](apps/akjol_front/src/app/onboarding) | Construction progressive du passeport (cas Léa pré-rempli pour la démo). |
| **Explore (par pays)** | [/explore/[country]](apps/akjol_front/src/app/explore) | Globe interactif → trajectoires accessibles dans chaque pays cible, filtrées par faisabilité. |
| **Catalogue programmes** | [/catalog](apps/akjol_front/src/app/catalog) | Recherche structurée des formations (60k+ via ONISEP, à enrichir Mon Master, UCAS, Common App). |
| **Métiers** | [/jobs/[id]](apps/akjol_front/src/app/jobs) | Reverse-routing : depuis un métier cible, AkJol remonte les études qui y mènent depuis le passeport. |
| **Compare** | [/compare](apps/akjol_front/src/app/compare) | Comparateur 1-vs-1 ou 1-vs-N de programmes/écoles. |
| **Plan B & Risque** | [/parcours](apps/akjol_front/src/app/parcours) (cf. [planB.ts](apps/akjol_front/src/engine/planB.ts)) | Que se passe-t-il si admission refusée ? Routes de secours, deadlines, coûts d'opportunité. |
| **Bourses** | [/bourses](apps/akjol_front/src/app/bourses) | Annuaire de bourses sourcées + auto-matching depuis le passeport. |

**Ce qui distingue AkJol techniquement** :

- **Moteur de faisabilité** ([feasibility.ts](apps/akjol_front/src/engine/feasibility.ts), [countryFeasibility.ts](apps/akjol_front/src/engine/countryFeasibility.ts)) : score multi-critères (niveau requis, langue, budget, visa) avec **distinction explicite** entre conditions *vérifiables* (ex. CECRL B2 requis) et *suppositions* (ex. taux d'acceptation estimé sur n=120).
- **Reverse routes** ([reverseRoutes.ts](apps/akjol_front/src/engine/reverseRoutes.ts)) : depuis un métier, recalcule les chemins d'études compatibles avec le passeport.
- **Honnêteté des probabilités** : chaque taux affiché est associé à son **intervalle de confiance** et à la **taille d'échantillon**. Aucun chiffre orphelin.
- **Données ouvertes** : pipeline ONISEP fonctionnel ; stubs prêts pour Mon Master, UCAS, Common App.

**Ce que AkJol n'est PAS** :

- Pas un Parcoursup-bis (pas de candidature transmise, pas d'intermédiation contractuelle avec les écoles).
- Pas un coach IA conversationnel (pas de chat « parle-moi de mon avenir »).
- Pas un classement payant (jamais de tri commercial des résultats).

---

## E. Le marché

### Sur quel marché se situe votre nouveau produit/service ?

Marché de l'**EdTech d'orientation et d'aide à la décision étudiante** — sous-segment du marché plus large de l'EdTech (estimé à ~400 Md$ mondial). Plus précisément : **outils d'orientation et de simulation de carrière à destination du grand public scolaire & post-bac**.

### Quelle est l'étendue de votre marché ? (locale, régionale, nationale, internationale)

- **MVP** : nationale (France) + verticale **Tech/Informatique** uniquement.
- **V1** : nationale, multi-verticales (Santé, Commerce, Arts).
- **V2+** : internationale francophone (Canada FR, Belgique, Suisse, Maghreb), puis EN (UK, US, Allemagne via UCAS / Common App / DAAD).

### Quelle est la situation du marché ?

☑ **Le marché est en développement.**

- **Existe** : Onisep (public, gratuit, catalogue passif), Parcoursup (public, candidature uniquement), Studyrama / L'Étudiant (presse/SEO), Diplomeo (lead-gen écoles privées).
- **En développement** : les outils *projectifs* (simulation de vie, salaire, pays) — quasi-inexistants en français. Existence outre-Atlantique (BigFuture College Board, Niche.com) mais pas portés sur le système FR.

### Comment imaginez-vous le marché dans quelques années ?

- **Accélération de la démocratisation IA** → coachs d'orientation conversationnels (ChatGPT × scraping). Risque : génération de réponses plausibles mais non sourcées. **AkJol se positionne sur la traçabilité des sources**, pas sur la fluidité conversationnelle.
- **Pression réglementaire** post-Parcoursup : transparence des algorithmes d'admission obligatoire à terme.
- **Fragmentation des trajectoires** : alternance, gap year, bootcamps, MOOCs certifiants — le diplôme linéaire recule. AkJol doit modéliser des routes hybrides (BTS → bootcamp → alternance), pas juste linéaires.

### Qui sont les acteurs du marché ?

| Acteur | Type | Modèle |
|---|---|---|
| **Onisep** | Public | Gratuit, catalogue, passif |
| **Parcoursup** | Public | Plateforme officielle de candidature post-bac |
| **Mon Master** | Public | Plateforme officielle masters |
| **L'Étudiant / Studyrama** | Presse | Pub + classements |
| **Diplomeo / Études Tech** | Lead-gen B2B | Vendu aux écoles privées |
| **JobTeaser** | B2B2C | Stages/jobs, intégré aux écoles |
| **HelloWork / Indeed** | Job boards | Métiers, pas études |
| **BigFuture (US)** | EdTech US | Modèle le plus proche, non-FR |
| **Niche.com (US)** | Reviews | Communautaire |

### Votre marché est-il lié à une réglementation spécifique (lois, normes, diplômes …) ?

Oui, à plusieurs niveaux :

- **RGPD** : utilisateurs souvent mineurs (lycéens) → consentement parental, minimisation des données, hébergement UE.
- **Données ONISEP / data.gouv.fr** : licence ouverte (Etalab) — utilisable mais avec mention de source.
- **Loi pour une République numérique** (transparence des algorithmes publics) : AkJol n'est pas un service public, mais l'esprit s'applique au positionnement éthique.
- **Code de l'éducation** : reconnaissance des diplômes (RNCP, Bologne) — référentiels à respecter pour ne pas induire en erreur.
- **Loi anti-cadeau / influence** : pas de partenariat « rémunéré pour recommander » sans mention explicite.

### Quel type de public visez-vous ? Quelle est la particularité de votre clientèle ? Quels sont les besoins et les attentes ?

**Cible primaire (utilisateurs / B2C)** :

| Segment | Âge | Particularité | Besoin |
|---|---|---|---|
| Lycéens 1ère/Term | 16-18 | Décision Parcoursup imminente | « Quelles études → quel métier → quelle vie ? » |
| Étudiants BTS/BUT 2A | 19-21 | Décision poursuite ou non | Cas Léa : « Licence pro vs école d'ingé ? » |
| Étudiants L3/M1 en doute | 20-23 | Reconversion partielle | Routes alternatives, équivalences |
| Adultes en reconversion | 25-40 | Faible info sur l'écosystème actuel | Quelles études remettre à niveau ? |

**Cibles secondaires (prescripteurs / B2B)** :

- **Lycées et CIO** (Centres d'Information et d'Orientation) — POC envisagé.
- **Associations étudiantes** et missions locales.
- **Parents** — co-utilisateurs souvent décideurs financiers.

**Attentes** : honnêteté (pas de pub déguisée), gratuité au moins partielle, gain de temps (« sacrifier des week-ends à chercher »), réassurance par la concrétisation.

### Quelle est votre zone de chalandise ?

- **Phase POC** : 2-3 lycées en Île-de-France (proximité géographique pour les démos en présentiel).
- **Phase MVP** : France métropolitaine, en ligne (chalandise = couverture internet).
- **Phase scale** : francophonie puis internationale (zone de chalandise = qualité du référentiel de données par pays).

### Qui sont sur ce nouveau produit/service vos concurrents directs ?

| Concurrents directs | Description | Points forts | Points faibles |
|---|---|---|---|
| **Onisep** | Service public d'info sur l'orientation | Exhaustivité, gratuité, légitimité, données officielles | Catalogue passif, UX 2010, pas de simulation, pas de recommandation personnalisée |
| **Parcoursup** | Plateforme officielle de candidature | Obligatoire post-bac, données réelles d'admission | Pas un outil d'orientation, juste de candidature ; algorithme opaque |
| **Diplomeo** | Comparateur d'écoles privées | UX moderne, demande de doc rapide | Lead-gen biaisé pro-écoles privées payantes, classements achetés |
| **Studyrama / L'Étudiant** | Médias d'orientation | SEO fort, salons, classements | Modèle pub, pas personnalisé, contenu généraliste |
| **HelloCharly** | Chatbot d'orientation IA | Conversationnel, jeune | Réponses non sourcées, peu de profondeur de données, biais IA générative |
| **JobTeaser** | Plateforme stages/emploi étudiants | Adoption massive en écoles | Centré emploi, pas orientation pré-bac ; B2B uniquement |

### Qui sont sur ce nouveau produit/service vos concurrents indirects ?

| Concurrents indirects | Description | Points forts | Points faibles |
|---|---|---|---|
| **Coachs en orientation privés** | Consultants, ~80-300 €/séance | Personnalisation maximale, accompagnement humain | Coût prohibitif, accès inégalitaire, pas scalable |
| **Salons étudiants** (Studyrama, L'Étudiant) | Événements physiques | Rencontre directe écoles | Ponctuel, biaisé pro-écoles présentes (qui paient le stand) |
| **Communautés Reddit / Discord / TikTok** | Témoignages pairs | Authenticité, gratuité | Anecdotique, non vérifié, biais de survie |
| **Profs principaux et CIO** | Conseillers d'orientation publics | Présents dans les établissements | Surchargés, formation hétérogène, peu d'outils |
| **ChatGPT / IA généralistes** | Conversation libre | Réponses immédiates, accessibilité | Pas de source, hallucinations sur diplômes/débouchés |
| **Réseaux familiaux & amis** | Bouche-à-oreille | Confiance personnelle | Reproduction des inégalités sociales d'orientation |

---

## F. Les moyens

### Avez-vous des fournisseurs ? Qui sont-ils ? Pourquoi avoir choisi ces fournisseurs ?

À ce stade, **fournisseurs = sources de données et briques techniques open-source/freemium**, pas de fournisseurs commerciaux signés.

| Fournisseur | Type | Choisi pour |
|---|---|---|
| **ONISEP / data.gouv.fr** | Données publiques | Licence Etalab, exhaustivité ~60k formations FR, gratuit |
| **Mon Master** | Données publiques (à brancher) | Référentiel officiel masters FR |
| **UCAS / Common App** | Données ouvertes (à brancher) | Internationalisation UK/US |
| **Vercel / Cloudflare Pages** | Hébergement | Free tier, scaling automatique |
| **Neon / Turso / SQLite local** | DB | SQLite local pour MVP, Postgres serverless ensuite |
| **Better-sqlite3 + Drizzle ORM** | Stack data | Open-source, type-safe, zéro vendor-lock |
| **Pino, Zod, Next.js, React** | Briques techniques | Standards open-source, communauté active |

**Critère de choix** : **zéro service externe payant** au MVP (cf. README) → marge brute maximale tant que l'usage reste contenu, pas de risque budgétaire pour valider le besoin.

### Quels sont vos moyens matériels ?

| Date d'achat | Objet | Montant d'achat HT | Durée d'amortissement |
|---|---|---|---|
| Existant | Poste de dev personnel (PC fixe Win 11, 16+ Go RAM) | ~1 200 € | 3 ans |
| Existant | Connexion Internet fibre | ~30 €/mois | n/a (charge courante) |
| À envisager S2 2026 | Domaine `akjol.fr` + `akjol.app` | ~30 €/an | n/a |
| À envisager si POC lycée | Tablet/écran pour démos | ~400 € | 3 ans |

**Coûts récurrents marginaux** : hébergement Vercel/Cloudflare (free tier suffisant en phase POC), PostgreSQL serverless (free tier Neon : ~0,5 Go data, OK pour MVP).

### Quels sont vos moyens humains ?

- **Phase POC (2026)** : 1 personne (porteur du projet) — full-stack dev + produit + business.
- **Phase MVP (2027)** :
  - 1 développeur (porteur, à temps partiel).
  - 1 stagiaire / contributeur data pour scrapper et nettoyer les sources Mon Master / UCAS.
  - 1 conseiller d'orientation expert (réseau, vacation) pour valider la qualité des recommandations.
- **Phase scale (>2027)** : équipe de 3-5 (dev, data, partenariats lycées, content).

### Quel est votre rôle dans la mise en place de ce projet et celle de vos collaborateurs ?

**Mon rôle (porteur unique aujourd'hui)** : architecture technique, développement, pipeline de données, stratégie produit, prise de contact avec lycées partenaires, communication.

**Collaborateurs envisagés** :

- Conseiller d'orientation expert → validation qualité des recommandations.
- Pair développeur (à recruter) → fiabiliser ingest data et alléger la charge solo.
- Contributeur data / stagiaire → scraping et normalisation Mon Master, UCAS, Common App.

---

## G. La stratégie

### Quel segment de clients avez-vous choisi pour diffuser votre offre ? Pourquoi ?

**Segment cible MVP** : **lycéens de Terminale + étudiants BTS/BUT 2A intéressés par la Tech/Informatique, en France**.

**Pourquoi ce segment ?**

1. **Verticale Tech maîtrisée** : je peux personnellement valider la qualité des recommandations (filières, métiers, salaires, débouchés) avec ma propre expertise — risque d'erreur factuelle minimisé.
2. **Cas test Léa déjà implémenté** dans le code → démo immédiate possible.
3. **Population numériquement à l'aise** → adoption plus rapide d'un outil web (pas de barrière digitale).
4. **Décisions à fort impact** : Parcoursup (Terminale) et poursuite post-BTS (2A) sont des fenêtres de décision claires, datées, anxiogènes → forte willingness to use.
5. **Densité géographique** : lycées avec sections SI/NSI/STI2D bien identifiés en Île-de-France pour POC physique.

### Quelle offre devez-vous développer pour atteindre vos clients ?

| Niveau | Offre | Prix |
|---|---|---|
| **Free (toujours)** | Passeport, exploration, comparaison, Plan B, bourses publiques | 0 € |
| **Premium individuel** (V1+) | Mentorat humain via étudiants vérifiés, simulations détaillées multi-pays, alertes deadlines personnalisées | ~5-10 €/mois ou one-shot |
| **B2B Établissement** (V1+) | Tableau de bord anonymisé pour CIO/lycée (où vont nos élèves, taux d'admission, points de friction), licence multi-élèves | ~500-2 000 €/an/établissement |
| **B2B Données agrégées** (V2+) | Statistiques d'orientation anonymisées pour collectivités, observatoires | sur devis |

⚠️ **Ligne rouge éthique** : aucune monétisation par recommandation orientée. Les écoles ne peuvent **jamais** payer pour apparaître plus haut, même partiellement. Les classements affichés viennent de sources publiques uniquement.

### Comment allez-vous communiquer sur votre offre ? (cible, canal, fréquence, support, budget …)

| Cible | Canal | Fréquence | Support | Budget |
|---|---|---|---|---|
| Lycéens 16-18 | TikTok / Instagram Reels | 3-5 posts/sem | Vidéos courtes « cas réels » (Léa, Tom, etc.) | 0-200 €/mois (ads test) |
| Étudiants BTS/L | Discord serveurs étudiants, Reddit r/etudiant | Hebdo | Threads explicatifs, démo gratuite | 0 € (organique) |
| Lycées / CIO | Email + démo en présentiel | Trimestriel | Slide deck + démo live | 0 € (déplacement) |
| Influenceurs orientation | Partenariats | 1-2 collabs/trim. | Vidéo dédiée, code de réf | 0-500 € en dotation |
| Presse spécialisée | Pitch L'Étudiant, Cadremploi | One-shot pour milestones | Communiqué + démo | 0 € |

**Budget total an 1 communication** : ~2 000-5 000 € (essentiellement ads test TikTok + déplacements lycées).

### Quelle est la position du produit/service dans l'esprit du client ?

> *« AkJol, c'est l'outil qui me dit honnêtement où mes choix me mènent — pas un catalogue, pas une pub, pas un chatbot qui invente. »*

Positionnement perçu : **traçable, projectif, neutre**. Anti-positionnement de Diplomeo (commercial) et de l'IA générative (non sourcée).

### Comment différencier votre produit/service par rapport à ceux de vos concurrents ? Quel est le « plus » de votre produit/service ?

Cinq différenciateurs défendables :

1. **Routeur, pas catalogue** — le calcul part du *passeport* de l'utilisateur, pas d'une recherche libre dans un index.
2. **Reverse routes** — depuis un métier ou un pays cible, AkJol remonte aux études compatibles depuis le profil. Aucun concurrent ne fait ça en français.
3. **Honnêteté radicale sur l'incertitude** — chaque probabilité affichée avec intervalle de confiance + taille d'échantillon ; chaque hypothèse non vérifiable est *marquée* comme telle.
4. **Plan B intégré** — le risque d'échec est traité comme un produit à part entière, pas comme un détail.
5. **Neutralité commerciale** — pas de classement vendable. Cet engagement est le capital marque le plus précieux ; il sera audité publiquement.

### Comment calculez-vous votre CA et votre marge commerciale ?

**Modèle hybride freemium + B2B établissements** (cf. section H plus bas).

- **CA = (utilisateurs Premium × ARPU mensuel × 12) + (établissements B2B × prix annuel) + (contrats data agrégée)**
- **Marge commerciale** = CA − coût des sources de données (~0 € grâce à l'open data) − hébergement (~0,5-2 €/utilisateur actif/an à l'échelle) − support.

À ce stade le coût marginal d'un utilisateur supplémentaire est **quasi-nul** (Vercel free tier puis pricing au volume) → marge brute attendue > 80 % à terme.

### Comment distribuez-vous votre produit/service ?

- **Web** (akjol.fr / akjol.app) — accès direct, gratuit, sans installation.
- **PWA** (Progressive Web App) — installation sur mobile sans passer par les stores.
- **Distribution B2B** : démo + onboarding direct auprès des CIO et lycées partenaires.
- **Pas d'app native iOS/Android avant V2** (coût d'opportunité trop élevé).

### Avez-vous prévu de suivre la satisfaction de vos clients ? Par quels moyens ?

Oui, multi-canal :

- **Analytics produit** (Plausible / PostHog auto-hébergé, RGPD-friendly) : taux de complétion passeport, taux de retour, parcours type, drop-off.
- **NPS in-app** trimestriel.
- **Feedback qualitatif** : interviews 30 min de 10-20 utilisateurs / trimestre (lycéens, étudiants, parents, conseillers).
- **Issues GitHub publiques** (open-source partiel envisagé pour la transparence).

### Envisagez-vous de les associer dans le développement de votre nouveau service/produit ?

Oui :

- **Conseil utilisateurs** : panel de 20-30 lycéens/étudiants testeurs en early access.
- **Co-construction lycée** : 2-3 lycées POC contribuent au cahier des charges côté CIO.
- **Roadmap publique** (GitHub Projects / Notion publique) où les utilisateurs votent les features.
- **Témoignages contributeurs** (V1.0+ : mentorat par anciens, cf. doc initial).

### Quels sont les atouts de votre projet ?

- **Avance technique réelle** : monorepo Next.js 16 + Drizzle + ingest ONISEP fonctionnel, 7 modules déjà partiellement codés.
- **Positionnement éthique défendable** : pas de conflit d'intérêts intégré (vs Diplomeo/Studyrama).
- **Différenciation produit** : reverse routes + Plan B + transparence des incertitudes — uniques sur le marché FR.
- **Coût d'infra ~0** au MVP (open-source partout).
- **Histoire personnelle authentique** (cas Léa, expérience vécue) → narratif fort en communication.

### Quels sont les points à améliorer ?

- **Nom et symbolisme** : « AkJol » (kazakh) demande explication culturelle hors KZ — pas un blocker mais frottement marketing.
- **Pas de modèle économique testé** : freemium + B2B est plausible mais non validé.
- **Risque qualité données** : ONISEP est exhaustif mais pas toujours à jour ; nécessite un loop de fraîcheur.
- **Solo founder** : risque d'épuisement, manque de complémentarité (pas de co-fondateur business).
- **Acquisition utilisateur non testée** : aucune campagne TikTok/Insta lancée à ce jour.
- **Cas Léa très centré FR/Tech** : généralisation à d'autres verticales pas encore prouvée.
- **Pas de réponse claire** sur la collecte du consentement parental pour les mineurs (RGPD).

### Pour conclure cette partie sur la stratégie, déterminez les 4P

**Politique de produit**
- Plateforme web fullstack, freemium, mobile-first.
- Cœur : passeport → trajectoires → faisabilité → procédure → Plan B.
- Modules satellites : compare, jobs reverse-routing, bourses, écoles, visas.
- Roadmap V1+ : mentorat pair-à-pair, communauté étudiante, multi-pays.

**Politique de prix**
- Free pour la quasi-totalité des features grand public.
- Premium individuel : 5-10 €/mois (mentorat, alertes, simulations détaillées).
- B2B établissement : 500-2 000 €/an selon taille.
- B2B données agrégées anonymisées : sur devis.
- **Jamais** de prix payé par les écoles pour influencer le ranking.

**Politique de distribution**
- Web direct (akjol.fr/akjol.app) + PWA installable.
- B2B : démo en présentiel + onboarding accompagné (POC lycées Île-de-France).
- Pas de stores natifs avant V2.

**Politique de communication**
- Organique social (TikTok, Instagram, Discord, Reddit) : posts cas concrets.
- Bouche-à-oreille via lycées POC (effet prescripteur).
- Influenceurs orientation (partenariats sobres, dotation > rémunération).
- Presse spécialisée pour milestones.
- Transparence radicale : roadmap publique, sources affichées sur chaque chiffre.

---

## H. Le compte de résultat sur trois ans

> *Hypothèses chiffrées prudentes, à itérer avec la réalité d'usage.*

### Comment calculer votre chiffre d'affaires ?

**CA = (Utilisateurs actifs × Taux conversion Premium × ARPU annuel) + (Nb établissements B2B × Prix annuel moyen) + (Contrats données B2B exceptionnels)**

| Année | Utilisateurs actifs (MAU) | Taux Premium | ARPU annuel | CA Premium B2C | Établissements B2B | Prix moyen B2B | CA B2B | **CA Total** |
|---|---|---|---|---|---|---|---|---|
| An 1 (POC + MVP) | 3 000 | 1 % | 60 € | 1 800 € | 2 (lycées POC pilotes, gratuit) | 0 € | 0 € | **~1 800 €** |
| An 2 (MVP scale FR) | 25 000 | 2 % | 70 € | 35 000 € | 10 | 1 000 € | 10 000 € | **~45 000 €** |
| An 3 (multi-verticales) | 80 000 | 3 % | 80 € | 192 000 € | 40 | 1 500 € | 60 000 € | **~252 000 €** |

> Ces chiffres sont prudents et **à itérer** au fur et à mesure des premiers retours utilisateurs et lycées partenaires.

### Comment calculer votre besoin en fonds de roulement ?

**BFR = (Créances clients + Stocks) − Dettes fournisseurs**

Pour AkJol (service web pur) :

- **Stocks = 0** (logiciel).
- **Créances clients** : factures B2B avec délai de paiement type 30-60j. Estimé à ~15 % du CA B2B annuel.
- **Dettes fournisseurs** : faibles (hébergement payé mensuellement à terme échu, pas de fournisseurs lourds).

| Année | Créances clients (15 % CA B2B) | Dettes fournisseurs | **BFR estimé** |
|---|---|---|---|
| An 1 | ~0 € | ~0 € | **~0 €** |
| An 2 | ~1 500 € | ~500 € | **~1 000 €** |
| An 3 | ~9 000 € | ~2 000 € | **~7 000 €** |

BFR très faible : un des avantages structurels du modèle SaaS B2C/B2B léger.

---

## E. (bis) Le seuil de rentabilité

### Quel est votre seuil de rentabilité ?

**Seuil de rentabilité = Charges fixes / Taux de marge sur coûts variables**

**Charges fixes annuelles estimées (An 2)** :

| Poste | Montant annuel |
|---|---|
| Hébergement (Vercel Pro + Neon) | ~600 € |
| Domaines (akjol.fr, .app, .com) | ~80 € |
| Outils (analytics auto-hébergé, email) | ~300 € |
| Comptabilité / juridique | ~1 500 € |
| Marketing / ads test | ~3 000 € |
| Indemnités / vacations expert orientation | ~3 000 € |
| **Total charges fixes** | **~8 480 €** |

**Coûts variables** : ~1-2 €/utilisateur Premium/an (support + bandwidth marginal) → marge sur coûts variables ~95 %.

**Seuil de rentabilité An 2** ≈ 8 480 € / 0,95 ≈ **~8 930 € de CA** → atteint largement (CA An 2 estimé 45 000 €).

### Quel est votre taux de marge sur coûts variables ?

**Taux MCV ≈ 95 %** — typique d'un modèle SaaS web sans inventaire physique, avec coûts marginaux d'un utilisateur supplémentaire quasi-nuls (hébergement scalable + données open).

### Quelle est votre marge sur coûts variables ?

**MCV (An 2)** = CA An 2 − Coûts variables = 45 000 € − ~2 250 € = **~42 750 €**.

**MCV (An 3)** = 252 000 € − ~12 600 € = **~239 400 €**.

---

## Annexe — Forces, risques et points de vigilance

### Atouts résumés
- Code déjà avancé (avance ~6 mois sur un concurrent partant de zéro).
- Différenciation produit défendable (routeur ≠ catalogue, reverse routes, Plan B, transparence).
- Coût d'infra quasi-nul au MVP.
- Histoire personnelle authentique (cas Léa) → narratif marketing.

### Risques principaux et mitigations
| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Acquisition utilisateur trop lente | Élevée | Critique | POC lycées en présentiel = canal de distribution distinct des ads |
| Données obsolètes | Moyenne | Élevé | Pipeline ingest automatisé + relances trimestrielles |
| Solo founder burnout | Élevée | Critique | Recrutement co-équipier dès An 1 |
| Confusion avec un Parcoursup-bis | Moyenne | Moyen | Communication claire : « pas de candidature, pas d'intermédiation » |
| Pression écoles privées pour pay-to-rank | Élevée à terme | Critique pour la marque | Engagement public écrit + audit annuel ouvert |
| RGPD mineurs | Moyenne | Élevé | Avocat RGPD spécialisé EdTech avant lancement public |

### Idées V1+ (cf. brief initial)
- CV/lettres de motivation personnalisés à partir du parcours.
- Mentorat pair-à-pair (étudiants vérifiés répondent aux questions des plus jeunes).
- Salaire à 0 / +5 ans par métier choisi.
- Orientation sociale (comparaison anonymisée avec amis/fratrie).
- Communauté solidaire d'étudiants.
- Modèle freemium plus avancé (mentor humain payant, simulateur IA détaillé).

---

---

# I. Modèle économique repensé — 8 leviers de revenus

> Le modèle « freemium léger + B2B lycées » de la section H plafonne autour de 250 k€/an à 3 ans : c'est un *projet associatif viable*, pas une *startup défendable*. Pour passer à un ordre de grandeur 1-5 M€ ARR à 3-4 ans **sans renoncer à l'éthique**, il faut empiler plusieurs leviers compatibles avec la promesse de neutralité.

## I.1 Principe directeur : « organique neutre, sponsorisé transparent »

Le modèle de référence n'est pas Diplomeo (lead-gen opaque), c'est **Google Search × Indeed × Booking** : les résultats organiques sont 100 % algorithmiques, et un encart séparé, **clairement labellisé « Sponsorisé »**, accueille les écoles partenaires qui paient.

**Règles non-négociables** (à graver dans les CGU et publier sur une page « Notre éthique ») :

1. Les résultats organiques (la liste principale) ne sont **jamais** réordonnés par paiement.
2. Une école sponsorisée n'apparaît **que si son programme matche réellement le passeport** (filtre de faisabilité identique à l'organique).
3. L'encart sponsorisé est **visuellement distinct** : badge orange « Sponsorisé », bordure spéciale, sous le top 3 organique.
4. Un **rapport de transparence annuel** liste les sponsors, les montants agrégés et le ratio organique/sponsorisé affiché.
5. Aucune donnée personnelle d'utilisateur n'est revendue. Les sponsors voient uniquement des **leads explicitement consentis** (case à cocher : « je veux être recontacté par cette école »).

## I.2 Les 8 leviers

### Levier 1 — Placements sponsorisés (CPC + CPL)

**Mécanique** :
- **CPC** (Cost Per Click) : l'école paie ~1-3 € chaque fois qu'un étudiant clique sur sa fiche dans l'encart sponsorisé.
- **CPL** (Cost Per Lead qualifié) : l'école paie 15-50 € quand l'étudiant remplit explicitement « Je veux être recontacté » (avec consentement RGPD).

**Pourquoi les écoles paient** : elles dépensent déjà ~50-200 € par lead via Diplomeo / Studyrama / Google Ads, sans ciblage profond. AkJol propose un ciblage par **passeport vérifié** (niveau, langues, budget, pays cible) → leads ultra-qualifiés → CPL premium justifiable.

**Cible** : écoles privées (commerce, ingé, design, info) qui ont des budgets acquisition étudiants — typiquement 5-30 % du tarif annuel par inscrit.

**Estimation An 3** (80 000 MAU, 5 % cliquent sur sponsorisé en moyenne 2 fois, CPC moyen 2 €) : **~16 k€/mois × 12 = ~190 k€/an**. En CPL pur : 80 000 MAU × 3 % génèrent un lead × 25 € = **~720 k€/an**. Mix réaliste : **~400 k€/an**.

### Levier 2 — Premium B2C (re-tarifé)

| Plan | Prix | Inclus |
|---|---|---|
| **Free** (toujours) | 0 € | Passeport, exploration, comparaison, Plan B, bourses publiques |
| **Decision Report** | 49 € one-shot | Rapport PDF/web personnalisé pour UNE décision critique (Parcoursup, masters, reconversion) avec simulations détaillées multi-scénarios, projections salaire 0/5/10 ans, Plan B chiffré |
| **AkJol Pro** | 9,99 €/mois ou 79 €/an | Tout Decision Report + alertes deadlines, suivi candidatures, simulations multi-pays, CV builder personnalisé carrière, lettres motivation guidées, accès mentorat (1 session offerte/mois) |
| **AkJol Famille** | 14,99 €/mois | Pro × 4 profils (parents + fratrie) |

**Pourquoi ça marche** : le moment de douleur (Parcoursup) est concentré, ciblé, anxiogène. Un parent paie volontiers 49 € pour une décision à 30-100 k€ de coût d'opportunité. Cf. modèle Mentore, Tageek, Ma Voie Pro.

**Estimation An 3** (80 000 MAU, 4 % conversion Pro à 79 €/an + 8 % achat Decision Report à 49 €) : **~250 k+€ + 313 k€ = ~560 k€/an** (optimiste) ou **~250 k€/an** (prudent).

### Levier 3 — Mentorat marketplace (commission)

**Mécanique** : étudiants/anciens vérifiés (école cible, alternance, expat) deviennent mentors. AkJol prend **20-30 % de commission** sur chaque session.

- Tarif mentor : 25-60 €/heure selon profil.
- Volume cible An 3 : 2 000 sessions/mois × 35 € moyens × 25 % = **~17 500 €/mois = ~210 k€/an**.

**Avantages stratégiques** :
- Effet réseau (plus de mentors → plus d'élèves → plus de mentors).
- Donnée propriétaire : retours de terrain « telle école, telle réalité ».
- Renforce la crédibilité éthique (pairs, pas vendeurs).

### Levier 4 — B2B Établissements (re-tarifé, 5-30× plus haut)

| Cible | Prix annuel | Inclus |
|---|---|---|
| Petit lycée / collège | 990 € | Dashboard CIO, export PDF élèves volontaires, support email |
| Lycée moyen + section CIO | 2 990 € | + analytics cohorte, suivi devenir des élèves, formation CIO 1 jour |
| Réseau privé / académie | 9 990 - 29 990 € | + intégration SIRH/Pronote, API, SLA, customer success dédié |
| Grande école / université | 14 990 - 49 990 € | + module alumni tracking, intégration JobTeaser/Career Center |

**Justification du prix** : JobTeaser, EduSign, ParcourSup-tools facturent déjà 5-50 k€ aux écoles. La valeur perçue dépend du dashboard, pas du seul accès individuel.

**Estimation An 3** : 60 établissements moyens × 3 500 € = **~210 k€/an**.

### Levier 5 — B2B Régions / Collectivités / Branches professionnelles

Les **Régions** et **OPCO** ont l'obligation politique d'orienter les flux étudiants vers les filières en tension (santé, agro, industrie). Elles paient cher pour des **insights agrégés** sur les choix d'orientation et les frictions.

- Pricing : **30 000 - 150 000 € / contrat annuel** (sur appel d'offres ou direct).
- Cible : 13 régions FR + ~10 OPCO majeurs.
- Atterrissage An 3 : **2-4 contrats × 60 k€ = ~150 k€/an**.

**Risque** : cycles de vente publics longs (6-18 mois), nécessitent du commercial dédié.

### Levier 6 — Affiliations / Partenariats commerciaux (transparents)

Commissions sur services *tiers* utiles à l'étudiant, **toujours** affichés comme tels. AkJol ne pousse pas, l'étudiant choisit.

| Partenaire | Commission type | Volume An 3 (estim.) |
|---|---|---|
| Tests linguistiques (TOEFL, IELTS, TCF) | 10-20 €/inscription | ~25 k€/an |
| Logement étudiant (Studapart, Lokaviz) | 30-80 €/contrat | ~30 k€/an |
| Banques (offres étudiant) | CPA 30-80 € | ~25 k€/an |
| Assurance santé / mobilité | CPA 20-50 € | ~15 k€/an |
| Cours en ligne (préparations concours) | 5-15 % du panier | ~30 k€/an |
| Visa/relocation (étudiants internationaux) | Forfait 50-200 € | ~20 k€/an |
| **Total affiliations** | — | **~145 k€/an** |

### Levier 7 — API / White-label (V2)

Licence le moteur **reverse-routes + faisabilité** à des tiers qui ont l'audience mais pas la techno :

- Médias (L'Étudiant, Studyrama) : 30-100 k€/an.
- Grandes écoles avec besoin d'outil de simulation pour leurs candidats : 10-30 k€/an.
- ONG / associations d'orientation : 0-5 k€ (positionnement).

Atterrissage An 3 : **1-2 contrats = ~50 k€/an**.

### Levier 8 — Carrière long-terme (V3)

Une fois la première génération AkJol entrée dans la vie active (3-5 ans après acquisition), AkJol devient une plateforme **carrière + reconversion** :

- Marketplace recruteurs (modèle Welcome to the Jungle / JobTeaser).
- Coaching reconversion 30-40 ans.
- Bilans de compétences en ligne (financement CPF possible : ~1 500 €/bilan).

**Pas avant An 4-5**, mais ça transforme la **LTV utilisateur** de ~80 € (étudiant) à **500-2 000 €** (sur 10 ans de relation).

## I.3 P&L révisé sur 3 ans

| Levier | An 1 | An 2 | An 3 |
|---|---|---|---|
| Sponsorisé (CPC+CPL) | 0 € | 60 k€ | **400 k€** |
| Premium B2C | 2 k€ | 60 k€ | **250 k€** |
| Mentorat (commission) | 0 € | 30 k€ | **210 k€** |
| B2B Établissements | 0 € | 30 k€ | **210 k€** |
| B2B Régions/OPCO | 0 € | 0 € | **150 k€** |
| Affiliations | 1 k€ | 25 k€ | **145 k€** |
| API / White-label | 0 € | 0 € | **50 k€** |
| **Total CA** | **~3 k€** | **~205 k€** | **~1 415 k€** |

> Hypothèses : 3 k MAU An 1, 25 k An 2, 80 k An 3. CA An 3 ≈ **5,7× le modèle initial**, sans renoncer à la neutralité.

## I.4 Garde-fous et risques du modèle élargi

| Risque | Mitigation |
|---|---|
| Glissement éditorial (« on a besoin de cette école sponsorisée, faisons un peu de place dans l'organique ») | Audit annuel public + séparation org/code stricte (le pipeline organique ne lit pas la table sponsors) |
| Confusion utilisateur entre organique et sponsorisé | Tests utilisateurs réguliers, badge sponsorisé visible même en mobile, mention contextuelle au survol |
| Backlash si étudiants/parents pensent qu'on vend les données | Page « Vos données » accessible en 1 clic, exports gratuits, suppression compte instantanée, certification Privacy By Design |
| Dépendance à un seul gros client B2B | Diversifier dès An 2 (pas plus de 30 % du CA / un client) |
| Cycle de vente B2B Régions trop long | Démarrer dès An 1 sur 1-2 régions pilotes, embaucher commercial public dès An 2 |

---

# J. Questions type YC / Station F / French Tech

> Questions classiques d'investisseurs et incubateurs (Y Combinator, Station F, French Tech, Wilco, Schoolab, Numa). Réponses synthétiques pour stress-tester le projet.

## J.1 Founder & équipe

### Pourquoi êtes-vous la bonne personne pour construire ça ?

- J'ai vécu personnellement le problème (orientation chaotique, manque d'outils projectifs).
- J'ai déjà construit la stack technique fullstack (monorepo Next.js 16, Drizzle, ingest ONISEP fonctionnel) — l'avance technique est tangible, pas hypothétique.
- Je maîtrise la verticale Tech/Info (cible MVP) → je peux personnellement valider la qualité des recommandations sans dépendre d'un expert externe.

### Quel est votre « unfair advantage » ?

1. **Avance technique** : 6 mois de code déjà écrit (passeport, faisabilité, reverse routes, Plan B, ingest).
2. **Bilingue (FR/EN/RU/KZ)** : ouverture naturelle vers l'Europe centrale et l'Asie centrale francophone — marchés sous-servis.
3. **Refus du modèle pub** : engagement éthique défendable que les concurrents historiques (Diplomeo, Studyrama) ne peuvent pas répliquer sans casser leur P&L.

### Que se passe-t-il si vous tombez malade 3 mois ?

Aujourd'hui : le projet s'arrête. C'est un risque critique. **Mitigation An 1** : recruter au moins un co-équipier technique senior (CTO ou freelance long-terme) avant tout lancement public.

### Avez-vous déjà géré une équipe / produit en prod ?

Non, première fois en tant que porteur. À pallier par mentorat externe et co-fondateur business.

## J.2 Marché & timing

### Why now ? Pourquoi ce projet n'a-t-il pas déjà été fait ?

- **Onisep** est public, sous-financé, moteur statique → ne peut pas innover en UX.
- **Parcoursup** est par construction une plateforme de candidature, pas d'orientation.
- **Diplomeo & co** ont un modèle économique incompatible avec la neutralité (ils dépendent du lead-gen biaisé).
- **L'IA générative** a démocratisé la production de réponses plausibles mais a créé un **besoin nouveau de traçabilité** que personne n'a encore comblé en français.
- **Génération Z** veut des outils projectifs (TikTok-natif, simulation, gamification) — l'offre n'a pas suivi.

### TAM / SAM / SOM ?

- **TAM** (mondial) : ~250 M étudiants post-secondaire × ~50 €/an de valeur orientation captable = **~12 Md€**.
- **SAM** (France + francophonie + EN, étudiants 15-25 ans engagés sur outils web) : ~15 M utilisateurs × ~30 € = **~450 M€/an**.
- **SOM** réaliste à 5 ans : 1-3 % du SAM = **~5-15 M€ ARR atteignable**.

### Qui sont vos 100 premiers utilisateurs (par nom si possible) ?

- 30 lycéens de 2-3 lycées partenaires Île-de-France (POC en présentiel).
- 30 étudiants BTS SIO / BUT Info via mes contacts personnels et alumni.
- 20 contacts Discord/Reddit r/etudiant via posts sur cas concrets.
- 20 followers TikTok/Insta venus via 5-10 vidéos « cas Léa » virales (objectif).

→ À chiffrer précisément avant de lancer : si je ne peux pas nommer 30 personnes prêtes à tester aujourd'hui, j'ai un problème de validation, pas un problème de produit.

## J.3 Acquisition & croissance

### Quel est votre wedge — l'angle d'attaque le plus pointu ?

**Le cas Léa** (BTS SIO 2A → quoi ensuite ?). Population : ~50 000 étudiants/an en France. Problème : ultra-précis, daté (mars-juin de la 2A), aucun outil dédié. Si on devient *l'outil* du « post-BTS SIO », on a une base virale captive qui se renouvelle chaque année.

### Comment acquérez-vous des utilisateurs à grande échelle ?

| Canal | Économique ? | Scalable ? | Activable quand ? |
|---|---|---|---|
| TikTok / Reels organiques (cas concrets) | Oui (temps) | Moyen | Dès J0 |
| SEO long-tail (« quoi faire après BTS SIO ») | Oui | Très | M+3, après 50 articles fondamentaux |
| Partenariats lycées (POC physique) | Oui | Faible | Dès J0 |
| Influenceurs orientation | Moyen | Moyen | M+6 |
| Ads ciblées (TikTok, Insta, YouTube Shorts) | Cher au début | Très | M+12 quand LTV stabilisée |
| Bouche-à-oreille étudiant | Gratuit | Très | Naturel si NPS > 50 |

### CAC / LTV / payback ?

**Hypothèses prudentes** :
- CAC moyen ciblé An 2 : **~5-15 €/utilisateur actif** (mix organique 60 % / ads 40 %).
- LTV An 3 (mix Free + 4 % Pro à 79 €/an retenus 1,5 an + sponsorisé 5 €/an + affiliations 2 €/an) : **~10-15 €/utilisateur**.
- LTV/CAC visé : **≥ 3** dès An 2, **≥ 5** à terme.
- Payback : **<6 mois** sur les payants, jamais sur les Free (logique).

À mesurer dès le M+3 sur cohortes réelles ; l'estimation ci-dessus est à grain très gros.

## J.4 Produit & moat

### Quelle est votre métrique nord ?

**Taux de complétion du passeport** sur les nouveaux inscrits, à 7 jours.

Pourquoi : sans passeport rempli, AkJol n'a aucune valeur (pas de routes calculées). C'est le seul vrai signal d'engagement et le prédicteur n°1 de la rétention. Cible An 1 : **≥ 30 %**.

Métriques secondaires : NPS, taux de retour à 30 jours, nb de programmes consultés/utilisateur, conversion Free → Pro.

### Quelle est votre insight douloureuse que les concurrents n'ont pas ?

> *« Les étudiants ne veulent pas chercher dans un catalogue, ils veulent qu'on leur dise honnêtement où chaque choix les mène — y compris quand ça ne mène nulle part. »*

C'est l'inverse exact du modèle médias (qui maximise les pages vues) et du modèle lead-gen (qui maximise les clics sortants). C'est inattaquable par les acteurs en place sans cannibalisation interne.

### Quel est votre moat à 3 ans ?

1. **Données propriétaires** : retours de mentors + parcours réels d'utilisateurs (avec consentement) → meilleure calibration des probabilités d'admission que ce qui existe publiquement.
2. **Effet réseau (mentorat)** : plus d'utilisateurs → plus de mentors → meilleure qualité d'accompagnement.
3. **Marque éthique** : difficile à concurrencer pour un acteur déjà compromis (Diplomeo).
4. **Couverture verticale** : par récurrence annuelle de cohortes (Parcoursup chaque année), AkJol accumule un référentiel de cas qu'un nouveau venu mettrait 3-5 ans à reconstituer.
5. **Switching cost B2B** : intégration SIRH lycée + dashboard CIO = dette d'inertie côté établissement.

### Pourquoi Onisep / Google / un grand groupe EdTech ne peut-il pas vous écraser ?

- **Onisep** : structure publique, pas d'incitation à innover en UX, pas de modèle économique de croissance.
- **Google** : pas de focus sur l'orientation française ; arriverait en généraliste, sans la donnée fine.
- **Studyrama / L'Étudiant** : leur P&L dépend du lead-gen biaisé, ils ne peuvent pas pivoter vers la neutralité sans perdre leurs revenus actuels.
- **Acteurs IA** (HelloCharly et co) : font de la conversation, pas de la donnée structurée vérifiable.
- **Les écoles privées elles-mêmes** : conflit d'intérêts évident, impossibles à crédibiliser comme tiers neutre.

### Qu'est-ce qui rend votre produit difficile à copier ?

La **base de données structurée** (programmes × passeports compatibles × probabilités calibrées × routes inversées) prend ~12-18 mois à construire correctement. Un copier-coller du front est facile ; reproduire les 60 k formations + équivalences + matching feasibility, non.

## J.5 Économie & finance

### Combien levez-vous ? Pour faire quoi ?

**Pré-seed visé : 250-400 k€** (12-18 mois de runway).

| Poste | Allocation |
|---|---|
| Salaire fondateur (12 mois) | ~50 k€ |
| Recrutement co-équipier dev senior | ~80 k€ |
| Stagiaire/contributeur data (6 mois) | ~15 k€ |
| Acquisition (ads test, événementiel lycées) | ~50 k€ |
| Juridique / RGPD / mentions légales | ~10 k€ |
| Hébergement / outils | ~10 k€ |
| Buffer / imprévus | ~50 k€ |

### Si on vous donne 1 M€, que faites-vous ?

Au-delà des 400 k€ pré-seed, le delta sert à :
- Recruter 1 sales B2B dédié (Régions/lycées) : ~80 k€.
- Recruter 1 content/SEO dédié (objectif 200 articles long-tail en 12 mois) : ~50 k€.
- Budget acquisition payant (TikTok/Insta) : ~150 k€ pour valider scaling.
- Internationalisation V2 (Canada FR + Belgique) : ~100 k€ data + dev.
- Réserve runway : ~220 k€.

### Quelle est votre runway ?

À ce jour, runway personnel uniquement. Sans levée, le projet reste développé en parallèle d'une autre activité → vélocité 1×. Avec levée, vélocité ~5×.

### À quoi ressemble une trajectoire à 100 M€ ARR ?

Réaliste si on agrège : 2-3 M utilisateurs francophones actifs + ouverture EN + extension carrière long-terme + 200-500 contrats B2B Régions/Branches/Établissements. Horizon : 7-10 ans. Pas la promesse An 1, mais ça tient debout.

## J.6 Risques & worst case

### Quels 3 événements pourraient tuer la boîte ?

1. **Onisep ou Parcoursup lance un produit projectif gratuit subventionné** → notre différenciation s'érode. Mitigation : vélocité produit + marque + verticales internationales hors juridiction française.
2. **Scandale RGPD sur mineurs** → perte de confiance irréversible. Mitigation : avocat spécialisé, Privacy by Design strict, audit annuel.
3. **Échec d'acquisition payante** (CAC > LTV durablement) → on devient un projet associatif. Mitigation : maximiser organique/SEO/POC lycées avant de toucher aux ads.

### Et si le sponsorisé crée une crise de confiance ?

Plan de repli : couper le sponsorisé, basculer 100 % sur Premium B2C + B2B Régions + mentorat. CA estimé sans sponsorisé : ~700-900 k€ An 3 (au lieu de ~1,4 M€). Toujours viable, mais croissance plus lente.

### Pire scénario réaliste à 18 mois ?

3 000 utilisateurs, 0 conversion payante, 0 contrat B2B, fondateur épuisé. Décision à ce stade : open-sourcer le moteur, le donner à Onisep ou un acteur public, transformer le projet en bien commun. Pas un succès financier, mais pas un naufrage moral.

## J.7 Vision

### Vision à 10 ans ?

AkJol devient le **routeur de vie** francophone : orientation (15-25), reconversion (25-50), retraite active (50+). L'utilisateur revient à chaque transition de vie. La marque est synonyme de neutralité et de transparence dans la décision de carrière.

### Si vous réussissez, à quoi ressemble le monde ?

Moins de redoublements, moins de reconversions tardives subies, moins d'inégalités d'orientation par capital social familial. Un lycéen de Roubaix accède à la même qualité d'info qu'un lycéen du 7e arrondissement.

### Si vous échouez, qu'est-ce qui survit ?

Le code est open-sourçable, le pipeline d'ingest est réutilisable, la philosophie « routeur transparent » influence le marché. Le bien commun reste, même si l'entreprise meurt.

---

# K. Checklist « Prêt pour le grand public »

> Avant tout lancement public (au-delà du POC fermé en lycée), valider un par un. Cocher ne signifie pas « parfait » mais « non-bloquant ».

## K.1 Légal & conformité

- [ ] Mentions légales publiées (URL `/mentions-legales`).
- [ ] CGU rédigées par un avocat, mentionnant explicitement le modèle sponsorisé et la non-revente de données.
- [ ] Politique de confidentialité conforme RGPD, lisible par un mineur.
- [ ] **Consentement parental** pour utilisateurs < 15 ans (loi française, Art. 8 RGPD).
- [ ] Registre des traitements (Article 30 RGPD).
- [ ] DPO désigné (peut être le porteur si < 250 personnes).
- [ ] Cookie banner conforme (consentement granulaire, pas de pre-tick).
- [ ] Hébergement en UE confirmé (Vercel EU, Neon EU, ou Scaleway/OVH).
- [ ] Procédure d'export et de suppression des données accessible en 2 clics.
- [ ] CGV pour les payants (Premium, B2B), incluant droit de rétractation 14j.
- [ ] Mentions des sources publiques sur chaque chiffre affiché (ONISEP, data.gouv).

## K.2 Sécurité

- [ ] Audit OWASP Top 10 minimal (XSS, CSRF, injection SQL — Drizzle protège déjà).
- [ ] Hashing des mots de passe (bcrypt/argon2).
- [ ] HTTPS forcé partout, HSTS activé.
- [ ] Rate-limiting sur les endpoints d'auth et de soumission de formulaire.
- [ ] Logs sans PII (password, email en clair) — vérifier la config Pino.
- [ ] Backup BDD quotidien chiffré (et testé en restauration).
- [ ] Plan d'incident sécurité écrit (qui appeler, qui informer en 72h CNIL).

## K.3 Modération & qualité contenu

- [ ] Si UGC (questions étudiants, témoignages mentors) → modération a priori ou a posteriori.
- [ ] Signalement utilisateur : bouton « signaler une donnée incorrecte » sur chaque programme/école.
- [ ] Process de mise à jour des données (cycle trimestriel min).
- [ ] Gestion des litiges écoles (« cette école dit que nos données la concernant sont fausses »).

## K.4 Support

- [ ] Email de support fonctionnel (`support@akjol.fr`).
- [ ] Réponse type sous 48h ouvrées (faisable solo si volume < 20/jour).
- [ ] FAQ couvrant les 20 questions les plus probables.
- [ ] Page « Status » (en cas d'incident technique).

## K.5 Produit & UX

- [ ] Onboarding < 3 minutes pour passeport minimal.
- [ ] Mode mineur (UI adaptée, pas de demande d'email pro, etc.).
- [ ] Accessibilité WCAG AA minimal (lecture par lecteur d'écran, contraste, navigation clavier).
- [ ] i18n FR/EN testée sur tous les écrans critiques.
- [ ] Aucun deadlink, aucun « lorem ipsum » résiduel.
- [ ] Performance Lighthouse > 85 mobile.
- [ ] PWA installable (manifest, service worker) si V1.

## K.6 Business & opérationnel

- [ ] Structure juridique créée (SASU recommandée pour pivoter facilement).
- [ ] Compte bancaire pro ouvert.
- [ ] Outil facturation (Pennylane / Tiime / QuickBooks) configuré.
- [ ] CGU sponsoring rédigées (encadrement strict du levier 1).
- [ ] Pricing testé sur 10-20 utilisateurs en interview.
- [ ] Métriques produit instrumentées (taux complétion passeport, NPS, churn).
- [ ] Page « Notre éthique » publiée, signée par le fondateur.

## K.7 Croissance

- [ ] Compte TikTok / Instagram / Reddit créés et alimentés (≥ 10 posts au lancement).
- [ ] Page presse / kit média basique.
- [ ] 3-5 témoignages utilisateurs early access (cas Léa, etc.) prêts à publier.
- [ ] Programme de parrainage simple (cf. brief initial : « inviter un ami pour débloquer la suite »).
- [ ] Partenariats POC signés avec au moins 2 lycées avant lancement public.

## K.8 Continuité

- [ ] **Bus factor > 1** : au moins une 2e personne capable de déployer et de gérer un incident.
- [ ] Documentation technique à jour (README, architecture, runbook incident).
- [ ] Secrets stockés ailleurs que sur 1 seul poste (1Password partagé / Vault).
- [ ] Procédure de récupération de domaine et accès cloud documentée.

---

*Document vivant — à itérer au fil du développement et des retours utilisateurs. Dernière mise à jour : 2026-05-08.*
