# Sécurité — Notes opérationnelles AkJol

Document vivant. Date dernière revue : 2026-05-24.

Voir aussi : [launch-checklist.md](./launch-checklist.md) §2 pour le statut
opérationnel.

---

## 1. Threat model rapide (OWASP A04 Insecure Design)

### Acteurs

| Acteur | Capacités |
|---|---|
| **Visiteur anonyme** | Lit /, /catalog, /explore, /jobs, /bourses ; appelle `GET /api/programs|schools|jobs` ; appelle `POST /api/feasibility` (calcul faisabilité) ; signup. |
| **Utilisateur authentifié (student)** | Tout ce qui précède + édite son passeport (`/api/passport`), gère ses parcours (localStorage), comparateur. |
| **Curator** | + Toutes les routes `/admin/*` + `/api/admin/*` : création/édition/suppression de programs, schools, jobs, equivalences. |
| **Admin** | Idem curator. Pas de distinction de droits en BD pour l'instant (un seul flag), mais le rôle existe pour le futur. |
| **Attaquant externe** | Pas de session, peut tenter brute-force login, scraping, abuse des endpoints publics. |

### Surface d'attaque et mitigations

| Surface | Vecteur | Mitigation |
|---|---|---|
| `/api/auth/login` | brute-force credentials | Rate-limit 5/15min/IP + bcrypt cost 12 + erreur générique (pas de leak email-existe-ou-pas) |
| `/api/auth/signup` | création comptes en masse / inscription mineurs | Rate-limit 3/h/IP + gate âge ≥ 15 ans + consentement CGU obligatoire |
| `/api/feasibility` | abus CPU (calcul lourd × N programs) | Rate-limit 60/min/IP + limite implicite 100 programs/req via pagination |
| `/api/programs|schools|jobs` (GET) | scraping de la base curée | Rate-limit 300/min/IP via middleware Edge |
| `/api/admin/*` (write) | compte curator compromis → vandalisme BD | Rate-limit 60/min/userId + audit log à activer (futur) |
| Session cookie | vol via XSS | HttpOnly + Secure (prod) + SameSite=Lax + HMAC signé |
| Headers HTTP | clickjacking, MIME-sniff, mixed-content | X-Frame-Options=DENY, X-Content-Type-Options=nosniff, HSTS prod, CSP |
| Données mineurs | inscription < 15 ans sans consentement parental | Bloqué côté serveur (`MIN_AGE_YEARS = 15`), pas de stockage de l'année (refus = preuve) |

### Parcours d'escalation à surveiller

1. **Visiteur → student** : passe par signup + accept CGU + âge ≥ 15. Sentinelle :
   pic anormal d'inscriptions sur 1h = alerte (à instrumenter quand on aura
   un dashboard).
2. **Student → curator/admin** : pas de chemin produit. Promotion = `UPDATE
   users SET role='curator'` en BD manuel, depuis machine de confiance.
3. **Curator → admin** : pas de chemin produit (cf. ci-dessus, même mécanisme).
4. **Anonyme → curator** : interdit par défaut. Le middleware Edge gate les
   routes `/admin/*` et `requireCurator` gate les API `/api/admin/*`. Le double
   gate est volontaire (defense in depth) : si le middleware est buggué, l'API
   protège encore. La revue annuelle des middlewares est à mettre dans la CI.

### Risques résiduels acceptés

- **MFA absent** : pour curator/admin. Acceptable tant que la base curators reste
  ≤ 5 personnes et que les comptes sont créés depuis machine de confiance.
  Implémenter MFA TOTP avant d'ouvrir le rôle curator à des bénévoles externes.
- **Rate-limit in-memory** : process-local. Sur Vercel autoscaling, chaque
  worker compte séparément → un attaquant qui touche N workers peut faire
  N × limite. Migrer vers `@upstash/ratelimit` quand on passera sur Pro.
- **Pas d'audit log applicatif** : les writes admin ne sont pas tracés en BD.
  À ajouter avant ouverture curator externe (qui a écrit quoi, quand).

---

## 2. CSRF — Audit (OWASP A08)

**Statut : pas de tokens CSRF custom, et c'est OK.**

### Pourquoi pas exposé

Le cookie de session est configuré avec :

```ts
// src/lib/session.ts
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
}
```

`SameSite=Lax` empêche le navigateur d'envoyer le cookie sur les requêtes
cross-site sauf navigation top-level GET. Concrètement :

- Un site malveillant ne peut pas POSTer vers `/api/admin/programs` depuis
  un formulaire — le cookie ne suivra pas.
- Un site malveillant ne peut pas lire la réponse d'un `fetch()` cross-origin
  vers nos endpoints — CORS n'est pas ouvert.
- `<img src="…/api/admin/programs/X" />` ne peut envoyer qu'un GET (pas un
  DELETE), et nos routes destructives sont toutes en POST/PATCH/DELETE.

### Cas où il faudrait ajouter un token CSRF

- Si on autorisait des POST cross-origin (CORS ouvert sur un partenaire),
  il faudrait soit `SameSite=None` + token CSRF, soit garder Lax et gérer
  l'embed côté partenaire.
- Si on ajoutait un système de paiement avec retour de webhook, les
  callbacks externes signeraient leurs requêtes (Stripe sig, etc.), donc
  pas un CSRF classique.

### Action si on ouvre CORS un jour

Implémenter le pattern **double-submit cookie** :
1. À l'init du serveur, générer un token aléatoire par session, exposé dans
   un cookie non-HttpOnly `csrf_token`.
2. Côté front, lire ce cookie et l'envoyer en header `X-CSRF-Token` sur
   chaque POST/PATCH/DELETE.
3. Côté serveur, comparer header vs cookie. Match = OK.

Aujourd'hui non requis.

---

## 3. Headers HTTP — état

Configuré dans [next.config.ts](../apps/akjol_front/next.config.ts) sur toutes
les routes :

| Header | Valeur | Rôle |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; …` | XSS + injection de scripts tiers |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` (prod uniquement) | force HTTPS |
| `X-Frame-Options` | `DENY` | clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | leak referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | API navigateur sensibles |
| `X-DNS-Prefetch-Control` | `on` | perf, pas un risque sécu |

**Limite connue** : la CSP autorise `'unsafe-inline'` sur script et style, le
temps de migrer vers une CSP nonce-based via middleware. À faire avant un audit
externe complet.

---

## 4. Procédure incident (résumé — détail dans runbook.md)

1. Détecter (alerting + monitoring — à instrumenter).
2. Contenir (révoquer sessions, rotation secrets, bloquer IPs).
3. Notifier CNIL sous 72h si breach de données personnelles (loi RGPD).
4. Notifier utilisateurs touchés sous délai raisonnable (template :
   [data-breach-email-template.md](./data-breach-email-template.md)).
5. Post-mortem écrit + ajout à ce document.
