# AkJol — your education router

**[👉 Try it live: akjol-bay.vercel.app](https://akjol-bay.vercel.app/)**

Tell AkJol where you stand today — your country, your current diploma, the languages you
speak, your budget. It shows you every study path that is actually open to you, and what
it would take to reach the ones that aren't yet.

---

## The problem

Deciding what to study after high school or after a first diploma means reading dozens of
school websites, guessing whether your diploma is even accepted, and finding out too late
that a program required a language certificate you don't have.

The information exists. It's just scattered, written for insiders, and never answers the
one question that matters: **can *I* do this, and what happens if I do?**

## What AkJol does

**1. You build a passport (2 minutes).** Country, current diploma, languages, budget,
constraints. No account needed — it stays in your browser.

**2. AkJol maps your possibilities.** Every program gets an honest status:

| | |
|---|---|
| 🟢 **Open** | You meet every requirement today |
| 🟡 **Open with a step** | One reachable thing is missing — a TOEFL, a bridge year, a diploma you'll have soon |
| 🔴 **Closed** | A structural requirement is missing, and AkJol tells you which one |
| ⚪ **Not covered** | Not enough data to judge — we say so instead of guessing |

**3. You build a plan.** Save paths, compare schools side by side, chain steps together
("BTS → licence pro → master"), and see the total duration, total cost, and how to apply
on each official platform.

You can also start from the other end: pick a **job** and AkJol works backwards to show
you the routes there from where you are now.

## What it doesn't do

- It does **not** apply for you. Real applications stay on Parcoursup, Mon Master, UCAS
  and the schools' own sites. AkJol tells you *where* and *when*.
- It does **not** promise admission. Probabilities are estimates with their sources and
  confidence shown. Schools decide, not us.
- It is **not** a ranking. No school pays to appear higher.

---

## Honest status: this is an early preview

The product works end to end. **The database is still small.**

What's covered today:

- **10 countries** in scope — France, UK, Germany, USA, Canada, Singapore, Belgium,
  Switzerland, Spain, Malaysia
- **French programs, mostly in IT** — a few dozen real institutions (BTS SIO, BUT
  Informatique, licence pro, engineering schools). Enough to see the engine work on a
  real path; not enough to cover your whole life yet.
- **~25 job profiles** with sourced salary data (INSEE, ONS, BLS)
- **10 international scholarships** (Eiffel, Chevening, Erasmus Mundus…)

If a program you know isn't there, that's expected — not a bug. Adding data is the
current work.

## Try it in 30 seconds

No signup required. Two ready-made profiles on the homepage:

- **Léa** — France, 2nd year of BTS SIO, wondering what comes next
- **Lana** — Malaysia, STPM in progress, wants medicine or engineering abroad

Click one and you're inside the full experience.

---

## Principles

- **Free.** No ads, no freemium wall on the core product, no reselling your data.
- **Your data stays yours.** Your passport lives in your browser by default. Sign in only
  if you want it synced across devices. Export and delete in one click.
- **Every number is sourced.** Hover any figure to see where it comes from. The
  probability formula is published on the `/methodology` page.
- **Open code.** The whole thing is readable, forkable, and challengeable.

## Found an error?

Data errors are the ones that hurt most. Email **contact@akjol.app** with the page URL,
what's wrong, and the official source that says otherwise. Corrections usually ship within
a week.

---

## Run it yourself

Node 20+ and pnpm.

```bash
pnpm install
pnpm db:push        # create the database schema
pnpm seed           # load demo programs, jobs and scholarships
pnpm dev            # http://localhost:3000
```

Defaults to a local SQLite file (`data/akjol.db`). Set `TURSO_DATABASE_URL` and
`TURSO_AUTH_TOKEN` to point at Turso instead — see `.env.example` for the full list.

**Stack** — Next.js 16 (App Router) · React 19 · Tailwind 4 · Drizzle ORM ·
SQLite/Turso · Turborepo + pnpm workspaces. Deployed on Vercel.

```
apps/akjol_front/   Next.js app — pages, feasibility engine, API routes
packages/db/        Drizzle schema and client
packages/ingest/    Data pipelines (ONISEP, Parcoursup, Mon Master, UCAS)
packages/ui/        Shared components
scripts/            Seeds, imports, one-off migrations
docs/               Architecture, methodology, deployment, security
```

Windows users: `better-sqlite3` needs the Visual Studio Build Tools (workload *Desktop
development with C++*). If you hit *"Could not locate the bindings file"*, install them
and run `pnpm rebuild better-sqlite3 --force`.

More detail in [`docs/architecture.md`](docs/architecture.md) and
[`docs/data-architecture.md`](docs/data-architecture.md).
