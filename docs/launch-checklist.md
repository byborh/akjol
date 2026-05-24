# Checklist — Avant lancement public d'AkJol

> Tâches à valider avant tout passage du **POC fermé** (10 testeurs invités)
> au **soft launch public** (TikTok, démo lycée publique, presse).
>
> Tant que ces blocs ne sont pas tous verts, on reste sur des cohortes
> invitées contrôlées — c'est ce qui te protège des risques juridiques
> (RGPD mineurs surtout) et préserve la réputation de neutralité du projet.
>
> Référence dossier entrepreneuriat : [§K Checklist « Prêt pour le grand public »](dossier_entrepreneuriat.md#k-checklist--prêt-pour-le-grand-public)

---

## 🟥 1. Légal & RGPD (~2 semaines, **bloquant**)

Le seul vrai bloqueur juridique. Sans ces 4 documents, tu prends un risque
personnel (amendes CNIL jusqu'à 4 % CA, plaintes parents pour mineurs).

### 1.1 Conditions Générales d'Utilisation (CGU)

- [ ] Trouver un avocat EdTech (recommandation : Lexing, AGN Avocats, Mathias Avocats — budget ~1 500-3 000 €)
- [ ] Brief : modèle freemium + 8 leviers de revenus (cf. dossier §I) + mineurs
- [ ] Sections clés à exiger :
  - [ ] Définition du service (routeur orientation, pas Parcoursup-bis)
  - [ ] Conditions d'utilisation gratuite
  - [ ] Conditions des plans payants (Decision Report, AkJol Pro, Famille)
  - [ ] **Mention explicite du modèle sponsorisé** (cf. §I.1, séparation organique/sponso)
  - [ ] **Non-revente des données personnelles**
  - [ ] Droit de rétractation 14 jours sur achats
  - [ ] Limitation de responsabilité (on n'est pas un conseiller d'orientation agréé)
  - [ ] Conditions de résiliation et suppression du compte
- [ ] Publication URL `/terms` (la page existe déjà : `apps/akjol_front/src/app/terms`)
- [ ] Lien CGU au pied de page + à l'inscription (checkbox de consentement)

### 1.2 Politique de confidentialité

- [ ] Rédiger avec l'avocat (ou template CNIL adapté)
- [ ] Sections obligatoires (RGPD Art. 13/14) :
  - [ ] Identité du responsable de traitement (toi / SASU)
  - [ ] Finalités de chaque traitement (compte, passeport, analytics, support)
  - [ ] Base légale (consentement, intérêt légitime, contrat)
  - [ ] Durée de conservation
  - [ ] Destinataires (Vercel, Neon, Google OAuth, futurs sponsors)
  - [ ] **Lisible par un mineur** (langage clair, exemples concrets)
  - [ ] Droits utilisateur (accès, rectification, effacement, portabilité, opposition)
  - [ ] Procédure d'exercice des droits + email contact DPO
- [ ] Publier URL `/privacy` (page existe déjà)
- [ ] Banner cookies conforme (granulaire, pas de pre-tick) — outil : Axeptio gratuit, Tarteaucitron self-hosted

### 1.3 Consentement parental pour utilisateurs < 15 ans

**⚠️ Le plus sensible techniquement. La majorité de ta cible (lycéens 16-18) est OK, mais les visiteurs 11-14 ans (parcours d'orientation précoce) déclenchent l'Art. 8 RGPD.**

- [ ] Décider : soit on bloque les < 15 ans, soit on implémente le double consentement
- [ ] **Option A (bloquer)** : champ "Âge" obligatoire à l'inscription, refus si < 15
- [ ] **Option B (double consentement)** :
  - [ ] À l'inscription, déclaration d'âge
  - [ ] Si < 15 : demande de l'email du parent
  - [ ] Email automatique au parent avec lien d'autorisation
  - [ ] Compte verrouillé tant que le parent n'a pas cliqué
  - [ ] Stockage de la preuve du consentement (horodatage, IP, lien cliqué)
  - [ ] Procédure d'audit CNIL prête (qui a consenti, quand, comment)
- [ ] Procédure de **retrait du consentement** par le parent
- [ ] Suppression de compte mineur sur demande parentale (idempotent)

### 1.4 Mentions légales

- [ ] Page `/mentions-legales` (à créer)
- [ ] Identité de l'éditeur : nom, statut juridique, RCS, SIREN, capital social, siège
- [ ] Directeur de publication (toi)
- [ ] Hébergeur : nom + adresse + téléphone (Vercel : 440 N Wolfe Road, Sunnyvale, CA)
- [ ] Contact (email obligatoire : `contact@akjol.fr`)
- [ ] Numéro CNIL si nécessaire (déclaration ou DPO désigné)
- [ ] Lien depuis le footer site

### 1.5 Structure juridique préalable

- [ ] Créer la SASU (recommandé : pivot facile, déductible IS, capital symbolique)
  - [ ] Statuts (générés gratuit via LegalStart ou avocat)
  - [ ] Dépôt capital (compte pro nécessaire — Qonto, Shine)
  - [ ] Publication annonce légale (~150 €)
  - [ ] Greffe (~50 €)
- [ ] Compte bancaire pro
- [ ] Comptabilité (Pennylane, Tiime ou Indy à 30-80 €/mois)
- [ ] Numéro de TVA intracommunautaire (auto si > seuil)

---

## 🟧 2. Sécurité (~3-5 jours)

### 2.1 Audit OWASP Top 10 minimal

- [ ] **A01 Broken Access Control** : revue des routes `/admin/*` et `/api/admin/*` — middleware `requireCurator` partout (déjà fait, à valider) · vérifier qu'aucune route API ne contourne le check
- [x] **A02 Cryptographic Failures** : password hash `argon2` ou `bcrypt` (déjà bcrypt ?) — vérifier coût ≥ 12 — *bcrypt cost bumped 10 → 12 dans `src/lib/password.ts`*
- [x] **A03 Injection** : Drizzle protège déjà du SQL injection · vérifier que les inputs sortie HTML sont escapés (React le fait, mais `dangerouslySetInnerHTML` ?) — *grep : 0 occurrence de `dangerouslySetInnerHTML` dans `src/`. React échappe le reste*
- [ ] **A04 Insecure Design** : threat modeling rapide → quels parcours utilisateur escaladent les privilèges ?
- [x] **A05 Security Misconfiguration** : headers HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) — *configurés dans `next.config.ts`, HSTS activé en prod uniquement*
- [x] **A06 Vulnerable Components** : `pnpm audit` régulier · process pour patcher les CVE critiques < 7 jours — *audit fait : Next 16.2.4 → 16.2.6 (8 high patchés). Reste 2 CVE non-exploitables ici (drizzle-orm 0.36 demande `sql.identifier` user-input qu'on n'utilise pas ; postcss bundled traite uniquement Tailwind statique). Migration drizzle 0.36 → 0.45 à planifier séparément.*
- [x] **A07 Identification & Auth Failures** : MFA optionnel pour curator/admin · limite tentatives login (rate limit) — *rate-limit login fait ; MFA encore à faire*
- [ ] **A08 Data Integrity Failures** : signatures CSRF si on accepte des POST hors fetch local
- [x] **A09 Logging Failures** : logs Pino sans PII (vérifier que email/password n'apparaissent pas dans les logs) · pas de stack traces en prod — *grep manuel : aucun `console.*(password|email|hash)` dans `src/`*
- [ ] **A10 SSRF** : pas pertinent ici (pas de fetch d'URL utilisateur côté serveur)

### 2.2 Rate-limiting

- [x] Choisir : `@upstash/ratelimit` (Redis) ou middleware Next custom avec mémoire (process-local) — *retenu : in-memory process-local (`src/lib/rate-limit.ts`). À migrer sur Upstash quand on passera sur Vercel Pro multi-instance.*
- [x] Endpoints à protéger :
  - [x] `POST /api/auth/login` : 5 tentatives / 15 min / IP
  - [x] `POST /api/auth/register` : 3 / heure / IP — *appliqué sur `/api/auth/signup` (= signup, pas register)*
  - [x] `POST /api/admin/*` : 60 / minute / userId — *centralisé dans `requireCurator(req)` ; tous les POST/PATCH/DELETE admin couverts*
  - [x] `GET /api/*` (lecture) : 300 / minute / IP — *appliqué dans `src/middleware.ts` (Edge) ; testé : 297 req OK puis 429*
  - [x] `POST /api/feasibility` : 60 / minute / userId — *clé sur IP pour l'instant (endpoint utilisable sans auth)*
- [x] Tester avec un script (genre `curl` en boucle) que le 429 sort bien — *vérifié : 6e appel login → 429 avec header `Retry-After`*

### 2.3 Hardening général

- [ ] HTTPS forcé partout (Vercel le fait par défaut)
- [x] HSTS activé avec `max-age=31536000; includeSubDomains; preload` — *en prod uniquement, via `next.config.ts`*
- [x] CSP stricte (au moins `default-src 'self'`) — *en place dans `next.config.ts` ; `unsafe-inline` toléré sur script/style le temps de passer à une CSP nonce-based*
- [ ] Backup quotidien chiffré de la BD (testé en restauration)
- [ ] Plan d'incident sécurité écrit (qui appeler, qui informer la CNIL en 72h, qui prévient les utilisateurs)

---

## 🟨 3. Performance — Lighthouse mobile > 85 (~3-5 jours)

### 3.1 Audit initial

- [ ] Lancer Lighthouse en mode mobile sur les 5 pages critiques :
  - [ ] `/` (landing)
  - [ ] `/passport` (le plus lourd potentiellement)
  - [ ] `/catalog`
  - [ ] `/explore`
  - [ ] `/parcours`
- [ ] Noter les scores actuels par catégorie : Performance, Accessibility, Best Practices, SEO

### 3.2 Optimisations courantes

- [ ] **Images** : tout en `next/image` avec `placeholder="blur"` · WebP/AVIF · taille adaptée au viewport
- [ ] **JS bundle** : analyser via `@next/bundle-analyzer` · découper en lazy via `next/dynamic` les composants lourds (globe 3D, graph React Flow, etc.)
- [ ] **Fonts** : `next/font` avec preload · subset français + caractères latins
- [ ] **CSS** : Tailwind purge automatique · vérifier qu'aucun import CSS lourd ne traîne
- [ ] **TTFB** : Vercel Edge si possible · sinon vérifier que pas de fetch sériel inutile en SSR
- [ ] **Cache HTTP** : `Cache-Control` agressif sur `/api/programs`, `/api/schools`, `/api/jobs` (déjà fait sur certaines, à compléter)
- [ ] **Third-party scripts** : audit · charger en `defer` ou via `next/script` avec `strategy="lazyOnload"`
- [ ] **Animations** : `transform` et `opacity` uniquement · pas de `width/height/top/left` qui déclenche layout

### 3.3 Mesure continue

- [ ] CI GitHub Action qui lance Lighthouse sur chaque PR · échec si score < 85
- [ ] Real User Monitoring (Vercel Analytics gratuit) pour Core Web Vitals en prod

---

## 🟦 4. Accessibilité — WCAG AA (~5-7 jours)

### 4.1 Audit initial

- [ ] Outils : axe DevTools (Chrome) + Lighthouse a11y + tests manuels lecteur d'écran
- [ ] Tester avec **NVDA** (Windows, gratuit) sur les 5 pages critiques
- [ ] Tester navigation 100 % clavier (Tab / Shift+Tab / Enter / Escape)

### 4.2 Critères WCAG AA prioritaires

- [ ] **Contraste** : tout texte > 4.5:1 (3:1 pour large text 18pt+). Tester via axe.
- [x] **Focus visible** : déjà géré (cf. globals.css `:focus-visible`) — vérifier sur dropdowns et autocompletes Admin — *globals.css `:focus-visible` global ; reste à valider visuellement sur OnisepPrefill/SchoolAutocomplete*
- [x] **Alt texts** : toutes les `<img>` ont un `alt` (sinon `alt=""` explicite si décoratif) — *grep : 0 occurrence de `<img>` ni `<Image>` dans `src/`*
- [x] **Labels** : tous les inputs ont un `<label>` associé ou `aria-label` — *login + signup corrigés (htmlFor/id) ; admin et autres pages à auditer en suivant*
- [x] **Heading hierarchy** : un seul `<h1>` par page, pas de saut h1→h3 — *fix onboarding (sr-only h1 ajouté), explore (empty state h2 → h1) ; landing/catalog/jobs/account OK*
- [x] **Skip link** : "Aller au contenu" en premier dans le DOM (déjà en globals.css `.skip-link`) — *vérifié dans layout.tsx*
- [x] **Landmarks ARIA** : `<main>`, `<nav>`, `<aside>`, `<footer>` (au lieu de divs) — *layout.tsx OK ; nav primary + footer ont maintenant `aria-label` distinct*
- [ ] **Formulaires** :
  - [x] Erreurs annoncées via `aria-describedby` + `role="alert"` — *appliqué sur login + signup*
  - [ ] Required indiqué textuellement (pas juste *)
  - [x] `autocomplete` HTML5 sur les champs standards — *vérifié login + signup (email, current-password, new-password, given-name)*
- [ ] **Composants custom** :
  - [ ] Dropdowns (OnisepPrefill, SchoolAutocomplete) : pattern ARIA combobox
  - [ ] Tableaux : `<th scope="col">`, `<caption>` si pertinent
  - [ ] Modales : `role="dialog"` + focus trap + Escape pour fermer
- [x] **Mouvement** : `prefers-reduced-motion` respecté sur toutes les animations — *globals.css ligne 58 : `*` matché avec `animation-duration: 0.01ms`*
- [x] **Texte alternatif des icônes** : `<Lucide* aria-label="..." />` ou texte caché à côté — *AppNav + login + signup + explore corrigés (aria-hidden sur icônes décoratives, aria-label sur liens icon-only)*

### 4.3 Internationalisation

- [x] `<html lang="fr">` (et `lang="en"` quand i18n bascule) — *layout.tsx ligne 46 : `<html lang={locale}>` dynamique selon cookie i18n*
- [ ] Tester les 5 pages critiques en EN + FR · pas de texte hardcodé

---

## 🟩 5. Annexes (souvent oubliés)

### 5.1 Support utilisateur

- [ ] Email `support@akjol.fr` fonctionnel (alias vers ta boîte perso)
- [ ] Réponse type sous 48h ouvrées (réaliste solo si < 20 tickets/jour)
- [ ] FAQ couvrant les 20 questions les plus probables
- [ ] Page Status (UptimeRobot gratuit ou Vercel Status auto)

### 5.2 Communication crise

- [ ] Procédure incident sécurité (qui prévient quoi en 72h)
- [ ] Modèle d'email "data breach" prêt à envoyer aux utilisateurs touchés
- [ ] Compte Twitter / LinkedIn pour communiquer si downtime ou incident

### 5.3 Continuité (bus factor)

- [ ] **Au moins 1 autre personne** capable de déployer et fixer un incident
- [ ] Secrets stockés ailleurs que sur ton seul poste (1Password partagé, Vault)
- [ ] Procédure de récupération de domaine + accès cloud documentée (où sont les MFA, qui a la clé Vercel, etc.)
- [ ] Runbook incident écrit (commandes à lancer, qui appeler)

---

## 📅 Planning suggéré

Si tu commences cette checklist **après** avoir curé tes 200 fiches Tech FR
(donc autour de mois 3-4 du plan global) :

| Semaine | Bloc |
|---|---|
| 1-2 | Bloc 1 (Légal) — créer SASU + briefer avocat en parallèle |
| 3 | Bloc 2 (Sécurité) — audit + rate-limit + hardening |
| 4 | Bloc 3 (Performance) — Lighthouse > 85 |
| 5-6 | Bloc 4 (Accessibilité) — WCAG AA |
| 7 | Bloc 5 (Annexes) + tests utilisateurs avec parcours mineurs |
| 8 | **Soft launch** 🚀 |

---

## ✅ Definition of Done globale

Tu peux passer au public quand :

- [ ] Les 4 documents légaux sont publiés et liés depuis le footer
- [ ] Le consentement parental est implémenté ou les < 15 ans sont explicitement bloqués
- [ ] L'audit OWASP est repassé propre (zéro critique / haute)
- [ ] Rate-limit en place sur tous les endpoints d'écriture
- [ ] Lighthouse mobile > 85 sur les 5 pages critiques (mesuré en prod)
- [ ] Axe DevTools : 0 erreur, 0 warning sérieux sur les 5 pages critiques
- [ ] Test navigation 100 % clavier validé sur les flows principaux
- [ ] Test lecteur d'écran (NVDA) validé sur passeport + catalog
- [ ] Bus factor ≥ 2 sur les accès critiques
- [ ] Plan d'incident sécurité écrit

---

*Document vivant — à itérer au fur et à mesure que tu coches.*
*Dernière mise à jour : 2026-05-24*
