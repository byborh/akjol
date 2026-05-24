# Déploiement AkJol en prod — Runbook

> Guide complet pour mettre AkJol en ligne sur **ton-domaine-de-test.xyz**
> avec déploiement automatique à chaque push sur `main`.
>
> Stack final : **Vercel (Next.js)** + **Turso (libsql)** + **GitHub** + **ton registrar DNS**.
> Coût : **0 €/mois** tant qu'on reste sous les free tier limits.

---

## 📋 État actuel — ce qui est déjà fait

- [x] DB Turso `akjol-prod` créée dans le dashboard web
- [x] URL Turso + token Auth récupérés
- [x] `.env.local` créé à la racine du projet *(à valider si bien chargé)*
- [x] Code adapté : driver dual SQLite/Turso (`packages/db/src/index.ts`)
- [x] `drizzle.config.ts` adapté pour basculer dialect=turso si env vars présentes
- [x] `package.json` : scripts seed/import passent `--env-file=.env.local`
- [x] Repo GitHub existant

## 📋 Ce qu'il reste à faire — par ordre d'exécution

```
1. Fixer .env.local (encodage, format)         5 min   bloquant
2. Push schéma sur Turso                       1 min   bloquant
3. Seed des données prod                       3 min
4. Commit + push GitHub                        2 min   bloquant
5. Setup Vercel + env vars                     10 min  bloquant
6. Custom domain + DNS                         15 min
7. Mise à jour Google OAuth callback           5 min   bloquant si Google Login
8. Promotion compte admin sur Turso prod       2 min
9. Smoke test post-deploy                      10 min
```

---

## 1. Fixer `.env.local` (5 min, bloquant)

### Symptôme actuel

`pnpm db:push` affiche `injected env (0) from .env.local` → ton fichier
n'est pas lu (mauvais encodage ou format).

### Diagnostic — colle ces 3 commandes PowerShell

```powershell
# A. Le fichier existe ?
Test-Path .env.local

# B. Combien de lignes ?
(Get-Content .env.local -ErrorAction SilentlyContinue).Length

# C. Variables présentes ?
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^([A-Z_]+)=(.+)$') {
    if ($matches[1] -eq 'TURSO_AUTH_TOKEN') {
      "{0} = {1}... (len {2})" -f $matches[1], $matches[2].Substring(0,20), $matches[2].Length
    } else {
      "{0} = {1}" -f $matches[1], $matches[2]
    }
  }
}
```

### Format attendu

Fichier `c:\projet\pv\akjol\.env.local`, encodage **UTF-8**, contenu :

```
TURSO_DATABASE_URL=libsql://akjol-prod-tonusername.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE...
```

⚠️ Règles :
- Pas d'espaces autour du `=`
- Pas de quotes (mais OK si tu en as)
- Une variable par ligne
- Encodage UTF-8 (pas UTF-16 / BOM Windows)

### Si le fichier est mal encodé — recréer proprement

```powershell
$content = @"
TURSO_DATABASE_URL=libsql://REMPLACE-MOI.turso.io
TURSO_AUTH_TOKEN=REMPLACE-MOI
"@
Set-Content -Path .env.local -Value $content -Encoding UTF8 -NoNewline
```

---

## 2. Push schéma sur Turso (1 min, bloquant)

Une fois `.env.local` correct :

```powershell
pnpm db:push
```

### Sortie attendue

```
Reading config file 'C:\projet\pv\akjol\drizzle.config.ts'
◇ injected env (2) from .env.local      ← DOIT être ≥ 2, pas 0
[✓] Pulling schema from database...
... liste des tables à créer ...
Yes, I want to execute all statements    ← confirme avec Y
[✓] Changes applied
```

Drizzle va créer **16 tables** dans Turso : programs, schools, jobs,
equivalence_edges, users, user_passports, user_plans, etc.

### Vérification

```powershell
# Affiche les tables créées en Turso (via le client interne)
pnpm tsx --env-file=.env.local -e "
import { createDb } from '@akjol/db';
import { sql } from 'drizzle-orm';
const db = createDb('./data/akjol.db');
const rows = await db.all(sql.raw(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\"));
console.log(rows);
"
```

Tu dois voir 16 noms de table.

---

## 3. Seed des données prod (3 min)

Lance dans cet ordre **exact** (les seeds ont des dépendances logiques) :

```powershell
# A. 5 873 établissements (Annuaire + MESR + IUT)
pnpm import:schools
pnpm seed:iut

# B. 40 jobs Tech (codes ROME)
pnpm seed:jobs-tech

# C. 115 équivalences entre diplômes
pnpm seed:equivalences
```

### État final Turso attendu

| Table | Compte attendu |
|---|---|
| `schools` | 5 873 |
| `jobs` | 40 |
| `equivalence_edges` | 115 |
| `programs` | 0 *(à remplir via /admin/programs en prod)* |
| `users` | 0 |

### Et les 200 fiches programs ?

Deux options :

**Option A — Tu cures directement en prod** *(recommandé)*
- Une fois Vercel déployé, tu te connectes sur `https://ton-domaine.fr/admin/programs`
- Tu cures depuis l'interface
- C'est de la prod "tracée" depuis le début

**Option B — Tu cures en local puis tu dumpes vers Turso**
- Tu continues à curer sur ta DB locale
- Quand tu veux pousser : on écrit un script `pnpm export:programs` qui sérialise les programs `is_curated=1` puis les importe sur Turso
- Plus complexe à coordonner

---

## 4. Commit + push GitHub (2 min, bloquant)

Avant de pouvoir déployer sur Vercel, le code adapté doit être sur GitHub.

```powershell
git status
```

Tu dois voir comme modifiés :
- `.env.example`
- `.npmrc` (nouveau)
- `drizzle.config.ts`
- `package.json`
- `packages/db/package.json`
- `packages/db/src/index.ts`
- `pnpm-lock.yaml`

⚠️ **Vérifie que `.env.local` n'est PAS staged** (`git status` ne doit pas
le mentionner — il devrait être dans `.gitignore`). Si oui, c'est OK ;
sinon, ajoute-le au `.gitignore` immédiatement.

```powershell
git add .env.example .npmrc drizzle.config.ts package.json packages/db/package.json packages/db/src/index.ts pnpm-lock.yaml
git commit -m "feat(db): dual driver Turso (prod) / better-sqlite3 (dev) + deployment config"
git push
```

---

## 5. Setup Vercel (10 min, bloquant)

### A. Importer le projet

1. Va sur **https://vercel.com/new**
2. Si premier login : **Continue with GitHub** → autoriser
3. Sur l'écran "Import Git Repository", clique **Import** à côté de ton repo `akjol`

### B. Configurer le build

Sur l'écran "Configure Project" :

| Champ | Valeur |
|---|---|
| **Project Name** | `akjol` (ou ce que tu veux) |
| **Framework Preset** | Next.js (auto-détecté) |
| **Root Directory** | `apps/akjol_front` ← important ! Clique "Edit" pour le changer |
| **Build Command** | (laisse vide ou par défaut — turbo gère) |
| **Install Command** | `cd ../.. && pnpm install` |
| **Output Directory** | `.next` (par défaut) |
| **Node.js Version** | 20.x ou 22.x |

### C. Ajouter les Environment Variables

Section "Environment Variables", ajoute **avant de cliquer Deploy** :

| Key | Value | Environments |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://akjol-prod-XXX.turso.io` | Production, Preview, Development |
| `TURSO_AUTH_TOKEN` | `eyJ...` (ton token long) | Production, Preview, Development |
| `AKJOL_SESSION_SECRET` | **GÉNÈRE UN NOUVEAU** *(voir ci-dessous)* | Production, Preview, Development |
| `GOOGLE_CLIENT_ID` | depuis Google Cloud Console | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | depuis Google Cloud Console | Production, Preview, Development |
| `NEXT_PUBLIC_BASE_URL` | `https://<projet>.vercel.app` *(temporaire, on changera après domain custom)* | Production, Preview, Development |

#### Générer un nouveau `AKJOL_SESSION_SECRET` (différent du dev !)

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie la sortie (64 caractères hex) dans la variable Vercel. **Ne le réutilise pas en dev** — un secret par environnement.

### D. Deploy

Clique **Deploy**. Le premier build prend ~3-5 min. Tu peux voir les logs en direct.

### E. Si le build échoue

Erreurs typiques et fixes :

| Erreur | Cause | Fix |
|---|---|---|
| `Cannot find module 'better-sqlite3'` | better-sqlite3 build natif fail sur Vercel | Notre code conditionnel `createDb()` ne le charge qu'en absence de TURSO_DATABASE_URL → vérifier que les env vars Turso sont bien définies |
| `EACCES /tmp` lors d'écriture DB | Code essaie d'écrire un fichier SQLite local | Idem, vérifier TURSO_DATABASE_URL set |
| `Module not found '@akjol/db'` | Workspace pnpm pas résolu | Vérifier Install Command = `cd ../.. && pnpm install` |
| Build > 45 min | Cache vide premier déploiement | Acceptable la 1ère fois, les suivants seront <2min |

---

## 6. Custom domain + DNS (15 min)

### A. Récupérer les records DNS dans Vercel

1. Vercel project → **Settings** → **Domains**
2. Tape ton domaine (ex: `akjol-test.fr`) → **Add**
3. Vercel affiche les records à configurer :

#### Si tu utilises l'apex (akjol-test.fr sans www)
```
Type    Name    Value
A       @       76.76.21.21
```

#### Si tu utilises un subdomain (www.akjol-test.fr ou app.akjol-test.fr)
```
Type    Name    Value
CNAME   www     cname.vercel-dns.com
```

### B. Ajouter les records chez ton registrar

Va dans la config DNS de ton registrar (OVH, Gandi, Namecheap, Cloudflare, etc.) :

1. Ouvre l'éditeur de zone DNS du domaine
2. Ajoute le record A ou CNAME selon le choix au-dessus
3. Sauve

### C. Attendre la propagation

- En général : 5-30 min
- Au pire : 24-48h (rare)

Vercel surveille auto. Quand le record est valide :
- Status passe de **"Invalid Configuration"** à **"Valid Configuration"**
- SSL est provisionné automatiquement via Let's Encrypt (gratuit, ~2 min)

### D. Vérifier

```powershell
# Doit retourner 76.76.21.21 (apex) ou un CNAME vers vercel-dns.com
nslookup akjol-test.fr
```

Ouvre `https://akjol-test.fr` dans le navigateur → tu dois voir la landing.

### E. Mettre à jour `NEXT_PUBLIC_BASE_URL` dans Vercel

Une fois le domaine actif :

1. Vercel → Settings → Environment Variables → édite `NEXT_PUBLIC_BASE_URL`
2. Remplace par `https://akjol-test.fr`
3. Redeploy : Vercel → Deployments → 3 dots du dernier deploy → **Redeploy** *(ou pousse un commit sur main)*

---

## 7. Mettre à jour Google OAuth callback (5 min, bloquant si Google Login)

Sans ça, le bouton "Continuer avec Google" en prod retourne `redirect_uri_mismatch`.

1. Va sur **https://console.cloud.google.com/apis/credentials**
2. Sélectionne le project que tu as utilisé pour AkJol
3. Clique sur ton **OAuth 2.0 Client ID** (Web application)
4. Section **Authorized redirect URIs**, **ajoute** (sans supprimer le localhost) :
   ```
   https://akjol-test.fr/api/auth/google/callback
   ```
5. Si tu utilises aussi un subdomain (www), ajoute :
   ```
   https://www.akjol-test.fr/api/auth/google/callback
   ```
6. Sauve

⚠️ Les callbacks Vercel `*.vercel.app` peuvent aussi être ajoutés si tu veux tester sur le subdomain Vercel directement. Sinon, le custom domain suffit.

---

## 8. Promotion du compte admin sur Turso prod (2 min)

Ton compte `byborh@gmail.com` existe sur la DB locale (role=admin). Mais
**la DB Turso est vide côté users** — il faut te logguer une fois sur la
prod pour exister, puis te promote.

### A. Se logguer une fois sur la prod

1. `https://akjol-test.fr/account`
2. **Continue with Google** → byborh@gmail.com
3. Tu es créé en Turso avec `role=student`

### B. Te promote en admin via le script (qui pointe sur Turso)

Sur ton poste local, tant que `.env.local` contient `TURSO_DATABASE_URL` :

```powershell
pnpm promote:curator byborh@gmail.com --role=admin
```

Le script lit `.env.local`, donc il tape sur **Turso prod**, pas local. ✓

### C. Re-se logguer pour rafraîchir le cookie

1. `https://akjol-test.fr/account` → **Se déconnecter**
2. **Continue with Google** à nouveau
3. Cette fois, le cookie embarque `role=admin`
4. Va sur `https://akjol-test.fr/admin` → tu dois voir le dashboard

---

## 9. Smoke test post-deploy (10 min)

Vérifie que tout marche bout-en-bout en prod :

```
[ ] https://akjol-test.fr                  → landing s'affiche
[ ] /catalog                                → vide (0 fiches curées) — normal
[ ] /explore                                → vide ou message — normal
[ ] /account                                → bouton Google Login marche
[ ] Login Google → redirect callback OK     → tu es loggué
[ ] /admin                                   → dashboard si role=admin
[ ] /admin/programs/new                      → formulaire s'ouvre
[ ] Crée 1 fiche test                       → apparaît dans la liste
[ ] /catalog                                → la fiche test apparaît
[ ] /admin/programs                          → la fiche est éditable
[ ] /admin/jobs                              → 40 jobs Tech présents
[ ] /admin/schools                           → 5 873 schools, autocomplete marche
[ ] /admin/graph                             → 115 edges visibles
```

---

## 10. Workflow continu — Auto-deploy à chaque push

Vercel détecte tous les pushes sur le repo. Par défaut :

| Branche poussée | Comportement |
|---|---|
| `main` | Deploy **Production** (ton domaine custom) |
| Autre branche | Deploy **Preview** (URL temporaire `<branche>-akjol-xxx.vercel.app`) |
| Pull Request | Deploy **Preview** + commentaire auto sur la PR |

### Workflow type pour une nouvelle feature

```powershell
# 1. Crée une branche
git checkout -b feature/curation-bts-sio

# 2. Travaille, commits localement
# 3. Push
git push -u origin feature/curation-bts-sio

# 4. Vercel build un Preview deploy (URL unique).
#    Tu peux tester sur cette URL avant de merger.

# 5. Quand tu valides, ouvre une PR + merge dans main
gh pr create --title "Curation 40 BTS SIO" --body "..."
gh pr merge --merge

# 6. Vercel détecte le push sur main et redéploie la prod automatiquement.
```

### Rollback rapide

Si une mise en prod casse quelque chose :

1. Vercel → Deployments → trouve la version précédente fonctionnelle
2. 3 dots → **Promote to Production**
3. Ton domaine pointe instantanément sur l'ancien build

C'est instantané, pas besoin de revert Git tout de suite (tu peux le faire tranquillement après).

---

## 11. Limites du free tier — à surveiller

### Vercel Hobby (gratuit)

| Limite | Valeur | Quand ça devient un problème |
|---|---|---|
| Bandwidth | 100 GB / mois | À ~50k visiteurs/mois |
| Build minutes | 6 000 min / mois | À ~50 deploys/jour |
| Serverless executions | 100 GB-Hours / mois | À ~500k requests/jour |
| **Usage commercial** | ❌ Interdit | Dès la 1ère monétisation → upgrade Pro (20$/mois) |

### Turso (gratuit)

| Limite | Valeur | Quand ça devient un problème |
|---|---|---|
| Databases | 500 | jamais à V1 |
| Stockage | 9 GB | jamais à V1 (~50 MB max avec 200 fiches + 10k users) |
| Row reads | 1 milliard / mois | À ~30k users actifs |
| Row writes | 25 millions / mois | À ~10k inscriptions/jour |

Tu es **largement OK** pour la V1 + soft launch.

---

## 12. Sécurité production — à valider après le déploiement

Bloc lié à `docs/launch-checklist.md` :

```
[ ] HTTPS forcé (Vercel le fait auto, vérifier que http:// redirige bien)
[ ] HSTS header en réponse (curl -I https://akjol-test.fr)
[ ] CSP active (idem)
[ ] Test signup mineur < 15 ans → doit retourner 403
[ ] Test rate-limit login : 6e tentative en moins de 15 min → 429
[ ] Test rate-limit signup : 4e en moins d'1h → 429
[ ] Test que /admin/* sans cookie → redirige vers /account
[ ] Test que /api/admin/* sans cookie → 401
[ ] Logs Vercel propres (aucun warning grave)
```

---

## 🆘 Troubleshooting

### Le déploiement Vercel build échoue avec "Cannot resolve @akjol/db"

→ Le workspace pnpm n'est pas résolu. Vérifie que **Install Command = `cd ../.. && pnpm install`** dans Vercel Settings → Build & Development.

### Erreur 500 sur /api/programs en prod

→ Variables Turso pas accessibles. Vérifie sur Vercel que `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` sont bien dans **Production** environment.

### Login Google : "Error 400: redirect_uri_mismatch"

→ Tu n'as pas ajouté l'URL de prod dans Google Cloud Console. Cf. étape 7.

### Le domaine custom affiche "Invalid Configuration" depuis > 24h

→ Le record DNS n'est pas appliqué. Vérifie avec `nslookup tondomaine.fr` que la valeur est bien `76.76.21.21` (apex) ou le CNAME vercel.

### `pnpm db:push` en local affecte la prod par erreur

→ Tu as `TURSO_DATABASE_URL` dans `.env.local`. Pour repasser en mode local sans Turso :

```powershell
# Commente la ligne dans .env.local
# Ou supprime temporairement le fichier
Rename-Item .env.local .env.local.disabled

# Travaille en local
# Quand tu veux re-pointer Turso :
Rename-Item .env.local.disabled .env.local
```

---

## 📝 Notes additionnelles

### Pourquoi pas Cloudflare Pages

D1 a un meilleur free tier mais friction Next.js (Workers != Node.js). Vercel reste le plus simple pour Next.js full-stack avec auth + API routes.

### Pourquoi pas Supabase

Supabase Auth est sympa mais on a déjà notre auth maison (Google OAuth + password). Pas de raison de migrer.

### Migration future Postgres

Si un jour tu sors du free tier Turso ou tu veux Postgres, Drizzle te
permet de migrer en ~1 jour : tu changes `dialect: "turso"` → `"postgresql"`
et tu re-génères les migrations. Pas urgent du tout.

### Sauvegarde Turso

Turso fait des backups auto sur le Pro tier ($29/mois). Sur Hobby :
- Tu peux faire un dump manuel : `turso db shell akjol-prod ".dump" > backup.sql`
- À programmer dans un cron GitHub Actions hebdo une fois que tu auras du contenu sensible

---

*Dernière mise à jour : 2026-05-24*
*Auteur : pair-programming session*
