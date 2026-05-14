# Retours mini-test — corrections à dispatcher par bloc

> **Contexte.** Mini-test utilisateur effectué le 2026-05-13. 10 retours collectés.
> Organisés ci-dessous en **3 blocs cohérents** + **1 chantier différé**, conçus
> pour qu'un agent traite un bloc complet d'un seul coup sans devoir reposer de
> questions.
>
> **Convention de lecture pour l'agent qui exécute.** Lis le bloc en entier
> avant de commencer. Tous les changements d'un bloc doivent être committés
> ensemble. Le critère « Done quand » liste les vérifications de fin de bloc.
> En cas d'ambiguïté, demander à l'humain avant d'inventer.

---

## Bloc 1 — Flow d'entrée : auth réelle, onboarding obligatoire, fusion compte/passeport

**Retours adressés :** #1, #2, #3, #9

### Problème global

L'utilisateur qui arrive sur AkJol pour la première fois doit faire 4-5 clics avant
de voir quelque chose d'utile, sans comprendre ce qu'est un « passeport ». La
connexion est cosmétique (juste email). Le « passeport » et le « compte » sont deux
pages distinctes alors qu'il s'agit d'un seul objet conceptuel pour le user. Les
boutons « Tester comme Léa / Lana » obligent à reconstruire manuellement leur
parcours au lieu d'arriver directement sur l'expérience complète.

### Sous-tâches

#### 1.1 Auth réelle (Google + email/mot de passe)

État actuel : cookie HMAC signé sur juste un email saisi. Pas de validation
d'identité, pas de mot de passe.

À faire :
- Ajouter **Google OAuth** comme méthode primaire (recommandée pour la cible
  15-22 ans qui a tous un compte Google).
- Ajouter **email + mot de passe** comme méthode secondaire (pour les profs,
  conseillers, parents qui peuvent ne pas vouloir lier Google).
- Recommandation lib : `next-auth` (Auth.js) v5 — adapter Drizzle existant pour
  SQLite, providers Google + Credentials.
- Hash mot de passe : `argon2` ou `bcrypt`, jamais en clair.
- Garder le cookie HMAC actuel comme support de session une fois loggué (pas à
  réinventer), juste changer le mécanisme d'**émission** de ce cookie.
- Conserver le mode « anonyme localStorage » pour qui ne veut pas créer de compte
  — la migration silencieuse localStorage → DB existe déjà en Phase 2.

Pièges connus :
- Le middleware actuel `/admin/*` repose sur `decodeSessionEdge` du cookie ; ne
  pas casser ce contrat.
- Les variables d'env Google `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` doivent
  être ajoutées à `.env.example` et documentées dans le README.
- Sur SQLite, NextAuth v5 a un adapter Drizzle officiel — l'utiliser, ne pas
  réécrire les tables `accounts` / `sessions` à la main.

Fichiers probables :
- `apps/akjol_front/src/app/api/auth/[...nextauth]/route.ts` (nouveau)
- `apps/akjol_front/src/lib/session.ts` (à adapter, garder le HMAC pour le cookie
  de session post-login)
- `packages/db/src/schema.ts` (ajouter `accounts`, `sessions`, `verification_tokens`)
- `.env.example` (nouvelles vars)

#### 1.2 Onboarding passeport obligatoire à l'inscription

État actuel : un user crée son compte puis arrive sur la home — il ne sait pas
ce qu'est le « passeport », il faut qu'il navigue vers `/onboarding`.

À faire :
- Après création de compte (Google ou email), **rediriger automatiquement vers
  `/onboarding`** si `passport.origin === null` (passeport vide).
- Le mot « passeport » doit être **explicité dès la 1re étape** par une phrase
  simple : « Le passeport, c'est ton point de départ : d'où tu viens, où tu en
  es, ce que tu veux. AkJol te montre les chemins possibles à partir de là. »
- Bouton « Passer pour l'instant » discret (les users curieux veulent explorer
  d'abord), mais le redirect par défaut est `/onboarding`.
- À la fin de l'onboarding, redirect direct vers `/explore` (pas vers la home).

Fichiers probables :
- `apps/akjol_front/src/app/api/auth/login/route.ts` (modifier le redirect
  post-login)
- `apps/akjol_front/src/app/onboarding/page.tsx` (ajouter l'explication
  pédagogique en intro)
- `apps/akjol_front/src/app/account/page.tsx` (post-login redirect si passeport
  vide)

#### 1.3 Fusion « Mon compte » + « Mon passeport »

État actuel : `/account` et `/passport` sont deux pages distinctes.

À faire :
- Sur `/account`, structurer en sections verticales :
  1. **Mon passeport** (origin, diplômes en cours, contraintes, langues) — le
     plus haut, c'est ce que l'user vient voir.
  2. **Mon plan** (résumé des programmes adoptés + lien vers `/passport` ancien
     onglet plan)
  3. **Mes documents** (résumé checklist + lien)
  4. **Mes parcours sauvegardés**
  5. **Informations de compte** (email, nom, date d'inscription, méthode d'auth)
     — en bas, c'est l'info administrative.
  6. **Confidentialité** (export JSON, suppression compte, opt-out analytics).
- Garder `/passport` comme alias permanent qui redirige vers `/account#passport`
  pour ne pas casser les bookmarks.
- L'URL `/passport` est conservée pour l'onboarding et la modification
  granulaire ; `/account` devient le hub.

Fichiers probables :
- `apps/akjol_front/src/app/account/page.tsx` (refonte structurelle)
- `apps/akjol_front/src/app/passport/page.tsx` (devient redirect ou se simplifie
  en éditeur granulaire)
- `apps/akjol_front/src/components/AppNav.tsx` (le lien « Passeport » de la nav
  peut pointer vers `/account#passport`)

#### 1.4 « Tester comme Léa / Lana » en un seul clic

État actuel : cliquer ces boutons demande à l'user de re-saisir le parcours
manuellement.

À faire :
- Les profils Léa et Lana doivent être **pré-construits en dur** dans
  `src/data/personas.ts` avec passport complet (origin, currentLevel, currentDiploma,
  targetCountries, targetJobs, constraints, languages).
- Clic sur « Tester comme Léa » → `usePassportStore.setState({ passport: LEA_PERSONA })`
  → `router.push("/explore")`.
- Pas de page intermédiaire. Pas de questions. L'user arrive directement sur
  l'expérience peuplée.
- Pour ne PAS écraser le passeport d'un user déjà loggué : si `auth.user` existe,
  afficher un modal de confirmation « Cela va écraser ton passeport actuel.
  Continuer ? » avec option « Ouvrir dans un onglet privé ».

Fichiers probables :
- `apps/akjol_front/src/data/personas.ts` (nouveau — extraire les passports
  hardcodés actuels)
- `apps/akjol_front/src/app/page.tsx` (les boutons Léa/Lana doivent appeler le
  setter + router.push direct)

### Done quand

- [ ] Création compte Google fonctionne en local (variables d'env documentées)
- [ ] Création compte email+password fonctionne en local
- [ ] Un compte fraîchement créé sans passeport est redirect vers `/onboarding`
- [ ] `/account` affiche le passeport en haut, info compte en bas
- [ ] `/passport` reste accessible et fonctionnel
- [ ] Clic « Tester comme Léa » → 1 seul clic → `/explore` peuplée
- [ ] `pnpm typecheck` vert 6/6
- [ ] Test manuel : un nouveau visiteur peut faire compte → passeport → explore
  en moins de 60 secondes sans aide

### Risques

- Migration NextAuth peut casser le mécanisme actuel de cookie. **Backuper la
  table `users`** avant `db:push`.
- Si Google OAuth nécessite un domaine vérifié, prévoir un fallback local
  (callback `http://localhost:3000`).

---

## Bloc 2 — Identité de marque + page d'accueil enrichie

**Retours adressés :** #4, #6, #10

### Problème global

AkJol n'a pas de logo digne de ce nom, pas de slogan mémorisable. La page
d'accueil ne contient que 3 blocs et un texte cryptique « Preview — France · UK ·
Allemagne · Malaisie · États-Unis » dont personne ne comprend l'utilité. Un
visiteur qui arrive ne comprend pas ce qu'AkJol fait, ne ressent pas la
proposition de valeur, et n'a aucune raison d'aller plus loin.

### Sous-tâches

#### 2.1 Identité visuelle (logo + slogan + palette)

État actuel : logo SVG basique créé pendant le sprint PWA (cercle + lignes
pointillées), slogan implicite « Routeur d'études ».

À faire :
- **Logo** : retravailler le SVG `apps/akjol_front/public/icon.svg`. Idée
  directrice : un point de départ et plusieurs trajectoires qui partent en
  éventail (illustration du concept « routeur »). Garder la palette actuelle
  (corail #ee7768, vert #3a6f2c, fond #FAFAF7).
- **Logotype** : créer une version horizontale `logo.svg` (icône + mot-marque
  « AkJol » en sans-serif géométrique) pour la nav.
- **Favicon** : générer `favicon.ico` 32×32 + `apple-touch-icon.png` 180×180 à
  partir de l'icône.
- **Slogan** : proposer 3 options à l'humain avant de coder. Critères : <8 mots,
  pas générique, capte la promesse « d'où tu viens → toutes tes options ».
  Suggestions :
  - « Dis-moi où tu en es, je te montre où tu peux aller. »
  - « Le routeur d'études — toutes tes options, vraiment. »
  - « De ton diplôme à tes possibles, partout. »
- **Mettre à jour `<metadata.title>` et `<metadata.description>`** dans
  `layout.tsx` avec le slogan retenu.
- **Mettre à jour le manifest PWA** (`name`, `short_name`, `description`).

#### 2.2 Refonte de la page `/`

État actuel : 3 blocs minimalistes + texte « Preview — France · UK · Allemagne
· Malaisie · États-Unis » incompréhensible.

À faire :
- **Supprimer** le texte « Preview — France · UK · Allemagne · Malaisie ·
  États-Unis » (retour #10) **OU** le transformer en quelque chose d'utile : une
  vraie section « Pays couverts aujourd'hui » avec drapeaux cliquables qui
  amènent à `/explore/[country]`. Choix recommandé : **le transformer**, c'est
  un signal de couverture pertinent.
- **Structurer la home en sections verticales** :
  1. **Hero** : logo + slogan + sous-titre + 2 CTA primaires (« Créer mon
     passeport » + « Tester comme Léa »).
  2. **Comment ça marche** (3 étapes) : « Tu décris ton point de départ → AkJol
     calcule tes possibilités → Tu construis ton plan d'action. » Chaque étape
     avec icône + 1 phrase + 1 capture d'écran ou animation.
  3. **Pays couverts** (ex-Preview) : grille drapeaux cliquables.
  4. **Personas de test** : 2 cards (Léa, Lana) avec mini-description et bouton
     « Tester ce profil ». **Un seul clic** mène à `/explore` peuplée (cf. bloc
     1.4).
  5. **Chiffres clés** : « 5 800+ formations · 5 pays · gratuit » avec liens
     vers les sources (utiliser `<SourcedNumber>` créé récemment).
  6. **Pourquoi nous faire confiance** : encarts courts « Open-source »,
     « Méthodologie publique », « Pas de publicité », « RGPD-first » avec liens.
  7. **Footer** (déjà fait).
- **Tonalité** : factuelle, pas marketing. Pas de superlatifs.
- **Performance** : pas d'image lourde sans lazy-loading, pas de vidéo
  autoplay. Lighthouse perf cible ≥ 85 mobile.

Fichiers probables :
- `apps/akjol_front/src/app/page.tsx` (refonte complète)
- `apps/akjol_front/src/components/HomeHero.tsx` (nouveau, optionnel)
- `apps/akjol_front/src/components/HowItWorks.tsx` (nouveau)
- `apps/akjol_front/src/components/CoveredCountries.tsx` (nouveau)
- `apps/akjol_front/src/public/` (assets logo si retravaillé)

### Done quand

- [ ] Nouveau logo SVG en place (icône + logotype horizontal)
- [ ] Favicon + apple-touch-icon générés
- [ ] Slogan choisi (avec l'humain) et appliqué dans metadata + hero
- [ ] Page d'accueil restructurée en 6-7 sections claires
- [ ] Texte « Preview — France · UK… » remplacé par une section « Pays couverts »
  fonctionnelle OU supprimé
- [ ] Boutons « Tester comme Léa / Lana » fonctionnent en 1 clic (dépendance
  bloc 1.4)
- [ ] Lighthouse perf mobile ≥ 85 sur `/`
- [ ] `pnpm typecheck` vert 6/6
- [ ] Test visuel sur iPhone SE (320px) : aucun overflow, hero lisible

### Risques

- Refondre la home sans avoir branché bloc 1.4 (Léa/Lana en 1 clic) crée un
  CTA qui mène vers du vide. **Faire bloc 1 avant ou en parallèle.**
- Le slogan est une décision produit, pas technique. **Ne pas trancher sans
  l'humain.**

---

## Bloc 3 — i18n complète + enrichissement données /school

**Retours adressés :** #5, #8

### Problème global

La traduction FR→EN ne fonctionne que sur les éléments de nav et le footer. Tout
le contenu des pages reste en français pur, ce qui rend la version anglaise
inutilisable pour Lana et la cible internationale. Par ailleurs, la page
`/school/[id]` ne contient pas l'adresse postale de l'établissement, ce qui force
l'utilisateur à quitter AkJol pour aller chercher sur Google — perte de
rétention.

### Sous-tâches

#### 3.1 i18n exhaustive sur toutes les pages

État actuel : `nav`, `footer`, `common`, `explore`, `country`, `locale` traduits.
Tout le reste hardcodé en français dans le JSX.

À faire :
- **Auditer** toutes les pages et composants pour lister les chaînes hardcodées.
  Cible : 100% du texte visible utilisateur passe par `useTranslations()`.
- **Structurer** `fr.json` et `en.json` par namespace de page :
  - `home.*` (page d'accueil)
  - `onboarding.*`
  - `passport.*`
  - `account.*`
  - `catalog.*`
  - `program.*` (fiche programme)
  - `school.*` (fiche école)
  - `jobs.*`, `job.*`
  - `compare.*`
  - `parcours.*`
  - `bourses.*`
  - `methodologie.*` (long texte — accepter de le faire en 2e passe si trop)
  - `privacy.*`, `terms.*`, `data.*` (long texte RGPD — idem)
  - `admin.*` (graph editor)
  - `errors.*` (toutes les erreurs API rendues à l'écran)
- **Dates et nombres** : passer tous les `toLocaleDateString` et formats monnaie
  via `useFormatter()` de next-intl, qui respecte la locale active.
- **Devises** : Lana voit `£`, Léa voit `€`. Conversion à la volée avec un taux
  fixé dans `src/data/fxRates.ts` (acceptable pour MVP, branchement API ECB en
  V2).
- **Pages méthodologie / privacy / terms** : long texte. Si la traduction
  intégrale prend trop de temps, créer `methodologie/en/page.tsx` etc. avec une
  version anglaise rédigée séparément (souvent plus rapide que d'extraire toutes
  les chaînes d'un long texte en JSON).
- **QA** : switcher FR↔EN sur chaque page, vérifier zéro chaîne française
  résiduelle en EN et vice-versa.

Fichiers probables :
- `apps/akjol_front/src/messages/fr.json` (gros refactor / explosion en
  namespaces)
- `apps/akjol_front/src/messages/en.json` (idem + traduction)
- Tous les `apps/akjol_front/src/app/**/page.tsx` (remplacement chaînes)
- Tous les `apps/akjol_front/src/components/*.tsx` qui ont du texte

#### 3.2 Adresse + coordonnées de l'établissement sur `/school/[id]`

État actuel : la page `/school/[id]` existe mais ne montre pas l'adresse, ni
téléphone, ni site web, ni carte.

À faire :
- **Court terme (avant la refonte data du doc data-architecture.md)** :
  enrichir les fixtures `src/data/schools.ts` avec les champs `address`, `phone`,
  `email`, `websiteUrl`, `lat`, `lng` pour les écoles déjà connues. Pour les
  écoles issues d'ONISEP, fallback « Adresse non renseignée — consulter le site
  ONISEP » avec lien direct vers la fiche source.
- **Composant `<SchoolAddress>`** : carte minimaliste (Leaflet ou MapLibre, déjà
  utilisé via `SchoolMap.tsx`) + adresse postale + lien Google Maps + téléphone
  cliquable (`tel:`) + email cliquable (`mailto:`) + site web.
- **Encart « Vivre à [ville] »** déjà mentionné §19 ui-idea-2 : raccrocher au
  composant existant `BudgetSummary` ou à `costOfLiving.ts` pour le loyer
  étudiant moyen.
- **Lien « Voir sur Google Maps »** pour les users qui veulent vraiment
  l'itinéraire — assumer qu'on les perd à ce moment, c'est OK une fois qu'ils
  ont décidé de candidater.
- **Sources** : afficher `<SourcedNumber>` sur les chiffres ville (loyer, coût
  vie) avec source « Numbeo 2025 » ou équivalent.

Note d'architecture : cette tâche est un **palliatif** en attendant la refonte
data du doc [data-architecture.md](data-architecture.md) qui apportera le champ
`schools.address` proprement via l'Annuaire de l'éducation. **Ne pas
sur-investir** dans le seed manuel — 10-15 écoles emblématiques suffisent pour
la démo.

Fichiers probables :
- `apps/akjol_front/src/data/schools.ts` (enrichir 10-15 entrées)
- `apps/akjol_front/src/app/school/[id]/page.tsx` (afficher les champs)
- `apps/akjol_front/src/components/SchoolAddress.tsx` (nouveau, optionnel si
  intégré direct dans la page)
- `apps/akjol_front/src/components/SchoolMap.tsx` (peut déjà exister, à vérifier)

### Done quand

- [ ] Switch FR/EN sur 5 pages au hasard (`/`, `/explore`, `/program/[id]`,
  `/catalog`, `/jobs`) : zéro chaîne dans la mauvaise langue
- [ ] Dates et montants affichés au format de la locale active
- [ ] `/school/[id]` affiche au minimum : adresse postale, téléphone (si dispo),
  site web (lien), carte ou lien Google Maps
- [ ] 10-15 écoles emblématiques (Sorbonne, ENS, Centrale, UTT, Sciences Po,
  HEC, Manchester, Imperial College, TUM, NUS) ont leur adresse complète
- [ ] `pnpm typecheck` vert 6/6
- [ ] Test visuel : la fiche Centrale Paris en FR est traduisible en EN sans
  rien casser, l'adresse 8-10 rue Joliot-Curie 91190 Gif-sur-Yvette est
  affichée avec lien Maps

### Risques

- L'extraction de chaînes peut casser le typecheck si les clés de traduction
  n'existent pas dans le JSON. **Toujours ajouter la clé au JSON avant de
  l'utiliser dans le composant.**
- Les longues pages texte (methodologie, privacy, terms) peuvent doubler la
  taille du sprint i18n. **Accepter de les faire en 2e passe** plutôt que de
  bloquer le reste.

---

## Chantier différé — Admin CRUD complet

**Retour adressé :** #7

### À ne PAS faire maintenant

L'utilisateur a explicitement mentionné que ce chantier ne doit pas être
attaqué tant que la base de données n'est pas stabilisée. C'est correct :
construire un CRUD sur un schéma qui va changer dans 2 semaines = double
travail.

### Pré-requis avant d'attaquer

1. Refonte data terminée (cf. [data-architecture.md](data-architecture.md))
2. Tables `schools`, `formation_types`, `programs` (jointure) en place
3. Index FTS5 actif pour la recherche admin

### Périmètre cible (à scoper finement le moment venu)

- `/admin/schools` — liste paginée + filtres + édition inline
- `/admin/formations` — idem pour les types de formation
- `/admin/programs` — éditeur de jointures avec autocomplete UAI + FOR.xxxxx
- `/admin/ingest` — déclencher / monitorer les runs d'ingestion depuis l'UI
- `/admin/users` — promote/demote rôles (le script CLI `promote-curator.ts`
  devient un fallback)
- Toujours role-gated par le middleware existant.

### Quand y revenir

Après le soft launch + refonte data. Sprint dédié 2-3 jours.

---

## Ordre d'exécution recommandé

Si un seul agent enchaîne les 3 blocs :

```
Bloc 1 (auth + onboarding + 1-click personas + fusion compte/passeport)
   ↓  débloqué pour le CTA de la home
Bloc 2 (branding + refonte home)
   ↓  produit polish suffisant pour les screens marketing
Bloc 3 (i18n exhaustive + enrichissement school)
   ↓  débloque la cible internationale
[soft launch 10-20 testeurs]
   ↓  collecte feedback réel
[refonte data — doc data-architecture.md]
   ↓
[chantier admin différé]
```

Effort estimé total : 4-7 jours selon expérience de l'agent (NextAuth peut
prendre ½ journée à un dev qui ne connaît pas, OAuth Google idem).

## Méta — comment l'agent doit travailler

1. **Lire ce doc en entier avant de toucher au code.**
2. **Lire le bloc complet** avant de commencer ses sous-tâches.
3. **Commit par bloc**, pas par sous-tâche — un bloc forme une unité cohérente
   testable.
4. **Toujours `pnpm typecheck`** avant chaque commit. Cible : 6/6 vert.
5. **Demander à l'humain** sur les décisions produit (slogan, choix de logo,
   options de traduction qui changent le ton).
6. **Ne pas inventer de feature** non listée — si quelque chose semble utile
   mais hors scope du bloc, l'écrire dans un TODO en bas de ce doc, pas le
   coder.
7. **Tester en runtime** (`pnpm dev`) après chaque bloc, pas seulement le
   typecheck. Le typecheck dit que les types collent, pas que les pages
   ouvrent.
