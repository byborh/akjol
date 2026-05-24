# Runbook incident — AkJol

Document opérationnel à compléter au fur et à mesure que l'infra se stabilise.
Dernière mise à jour : 2026-05-24.

> Si tu lis ce document parce qu'il y a un incident en cours : respire,
> commence par §1 (constater) avant de §2 (agir). Pas de précipitation, pas de
> `rm -rf`, pas de force-push sur main.

---

## 0. Accès — qui a quoi

À COMPLÉTER quand bus factor ≥ 2.

| Ressource | Qui a accès | Où sont les secrets |
|---|---|---|
| Domaine `akjol.app` | toi (registrar : À COMPLÉTER) | À COMPLÉTER (1Password partagé recommandé) |
| Compte Vercel | toi | À COMPLÉTER |
| Compte Neon (BD) | toi | À COMPLÉTER (env var `DATABASE_URL` sur Vercel) |
| Compte Google OAuth (console) | toi | client_id / client_secret en Vercel env |
| Compte Plausible (analytics) | toi | À COMPLÉTER si auto-hébergé |
| Email `contact@akjol.app` | À COMPLÉTER (Gandi / Cloudflare email routing / etc.) | À COMPLÉTER |
| MFA des comptes ci-dessus | tes appareils + codes de récupération | **stocker codes de récupération hors de ton poste !** |

---

## 1. Constater — quels signaux

Avant d'agir, savoir précisément quoi s'est passé.

### Outils de constat
- [Vercel dashboard](https://vercel.com) → onglet « Logs » + « Functions » pour les erreurs runtime.
- [Neon dashboard](https://console.neon.tech) → query history + monitoring CPU/connexions.
- Plausible (si activé) → pic de trafic anormal = attaque potentielle ou succès viral.
- Test manuel : `curl https://akjol.app` puis `curl https://akjol.app/api/programs` — réponse ? code HTTP ?

### Signaux qui doivent t'alerter

| Symptôme | Cause probable |
|---|---|
| 500 sur toutes les routes | BD down, env var manquante, déploiement raté |
| 500 sur certaines routes | bug logique récent, dépendance pétée |
| 429 partout | rate-limit qui clamp normalement (= sain) ou attaque DDoS distribuée |
| Pic de signups | spam de bots → bump rate-limit ou ajouter captcha |
| Pic de fail login | brute-force → confirmer rate-limit OK, considérer blocklist IP |
| Latence × 10 sur `/api/feasibility` | DB lente, query non-indexée, pic load CPU |
| Plausible : pic +500 % visites | viralité (TikTok ?), ou bot scraping |

---

## 2. Agir — actions par scénario

### Scénario A — Site totalement down (500 sur `/`)

1. Vérifier Vercel deployments → est-ce qu'un déploiement récent a échoué ou rollback prod ?
2. Si oui : **Promote** le dernier déploiement vert depuis l'onglet Deployments.
3. Vérifier les env vars critiques : `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID/SECRET`.
4. Vérifier Neon : la BD est-elle en pause (Neon Free pause après inactivité) ?
5. Si rien d'évident → ouvrir un ticket Vercel support + Neon support en parallèle.

### Scénario B — Brute-force login détecté

Symptôme : flot de `429` sur `/api/auth/login` dans les logs (≥ 100/min depuis
1 IP ou un range).

1. Le rate-limit in-memory bloque déjà à 5/15min/IP. Vérifier dans les logs
   Vercel que les `429` partent bien.
2. Si l'attaquant tourne sur N IPs (botnet) :
   - Considérer ajout d'un captcha au signup/login (hCaptcha gratuit).
   - Désactiver temporairement les inscriptions password si l'attaque
     persiste : pousser un fix qui retourne 503 sur signup.
3. Logger l'incident, ajouter à ce runbook si nouveau pattern.

### Scénario C — Fuite de données (data breach)

**Délai légal : notifier la CNIL sous 72h.**

1. Stop the bleeding : si la fuite vient d'une route accessible, déployer un
   fix immédiat (rollback ou hotfix).
2. Identifier l'étendue : combien d'utilisateurs touchés ? quelles données ?
3. Rotation des secrets potentiellement compromis :
   - `SESSION_SECRET` → invalide toutes les sessions actives (déconnecte tout
     le monde, c'est OK).
   - `DATABASE_URL` → si l'attaquant a eu accès à la BD, rotation du mot de
     passe Neon.
   - `GOOGLE_CLIENT_SECRET` → rotation depuis Google Cloud Console.
4. Notifier la CNIL :
   [signalement breach CNIL](https://notifications.cnil.fr) (sous 72h).
5. Notifier les utilisateurs touchés via le template
   [data-breach-email-template.md](./data-breach-email-template.md).
6. Post-mortem écrit + ajout d'une section à ce runbook.

### Scénario D — Compte curator compromis

1. Révoquer le rôle immédiatement : `UPDATE users SET role='student' WHERE
   email='…'` depuis Neon SQL editor.
2. Force-logout en rotation `SESSION_SECRET` (déconnecte tout le monde).
3. Identifier ce qui a été modifié pendant la fenêtre compromise. Tant qu'on
   n'a pas d'audit log applicatif, lire le diff du dump SQL avant/après.
4. Restaurer les modifications malveillantes depuis le backup le plus récent
   (cf. §3).
5. Reset password de l'utilisateur légitime + impose nouveau mot de passe + MFA
   quand on l'aura.

### Scénario E — BD down (Neon)

1. Statut Neon : [status.neon.tech](https://status.neon.tech)
2. Le code a déjà un fallback fixtures pour `GET /api/programs|schools|jobs`,
   donc l'app reste consultable en lecture. **Mais** toutes les opérations
   d'écriture (`POST /api/auth/signup`, passport sync, admin) vont retourner
   503. C'est attendu.
3. Communication : poster sur le compte AkJol (Twitter/LinkedIn) un message
   « problème base de données, on remet en route ».
4. Une fois Neon ré-up : reconnecter — Vercel reprend automatiquement.

---

## 3. Backup BD — à mettre en place

À COMPLÉTER. Statut : pas de backup automatique configuré au moment de rédiger
ce document.

Options :
- Neon offre des **point-in-time restore** sur les plans payants (Pro+).
- Sur Hobby : exporter manuellement via `pg_dump` une fois par semaine
  (script cron à écrire). Stocker chiffré (gpg + clé sur ta machine + 1
  copie cloud différent provider).
- Tester la restauration au moins une fois — un backup non testé n'existe
  pas.

---

## 4. Communication — qui prévient quoi

- **Equipe interne** : Slack/Discord (à créer quand bus factor ≥ 2).
- **Utilisateurs touchés** : email via template breach.
- **CNIL** : signalement online sous 72h, [notifications.cnil.fr](https://notifications.cnil.fr).
- **Public (downtime non-breach)** : compte Twitter/LinkedIn AkJol + page
  status (UptimeRobot ou Vercel Status à activer).

---

## 5. Post-incident

Toujours faire un post-mortem écrit, même pour les petits incidents.

Format minimal (à pousser dans `docs/incidents/YYYY-MM-DD-titre.md`) :
- **Symptôme** : ce qu'on a vu en premier
- **Cause** : ce qui s'est passé techniquement
- **Impact** : combien d'users, combien de temps, qu'est-ce qui a été perdu
- **Actions immédiates** : ce qu'on a fait pour stopper
- **Actions de fond** : ce qu'on change pour que ça ne se reproduise pas
- **Détection** : comment on a su, comment on saurait plus vite la prochaine fois

Ajouter le scénario à ce runbook s'il est nouveau.
