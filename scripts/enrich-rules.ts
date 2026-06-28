/**
 * Enrichissement par règles (Pipeline B, version GRATUITE — sans LLM).
 *
 * Applique le dictionnaire scripts/data/it-formation-refs.ts aux fiches brutes
 * informatique : chaque fiche est rattachée à son *type* de diplôme (BUT Info,
 * BTS SIO, MMI…) et hérite des débouchés / diplômes acceptés / domaines /
 * poursuites / durée définis une seule fois pour ce type.
 *
 * Pourquoi c'est suffisant : ces champs dépendent du diplôme, pas de l'école.
 * Déterministe, instantané, cohérent, 0 €.
 *
 * Ne remplit que les champs VIDES (n'écrase pas une donnée déjà présente, ex.
 * débouchés venus de Parcoursup). Corrige la durée (BTS = 2 ans).
 *
 * Sécurité : DRY-RUN par défaut. --apply pour écrire, --curate pour passer
 * isCurated=true en plus.
 *
 * Usage :
 *   pnpm enrich:rules                       # dry-run : montre les correspondances
 *   pnpm enrich:rules -- --apply            # remplit les champs vides (reste à curer)
 *   pnpm enrich:rules -- --apply --curate   # remplit + cure
 *   pnpm enrich:rules -- --limit 20         # se limiter à N fiches
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { createDb, programs } from "@akjol/db";
import { matchRef } from "./data/it-formation-refs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

const IT_KEYWORDS = [
  "informatique",
  "numérique",
  "réseaux",
  "cybersécurité",
  "données",
  "data",
  "développement",
  "logiciel",
  "multimédia",
  "sio",
  "snir",
  "ciel",
  "mmi",
];
const IT_LEVELS = new Set(["bachelor", "licence", "licence_pro"]);

function parseFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

function isEmptyJson(s: string | null | undefined): boolean {
  return !s || s.trim() === "" || s.trim() === "[]";
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const curate = argv.includes("--curate");
  const limitArg = parseFlag(argv, "--limit");
  const limit = limitArg ? Number(limitArg) : Infinity;

  const db = createDb(DB_PATH);

  const candidates = (
    await db.select().from(programs).where(eq(programs.isCurated, false))
  ).filter((p) => {
    if (!IT_LEVELS.has(p.level)) return false;
    const hay = `${p.title} ${p.formationLabel}`.toLowerCase();
    return IT_KEYWORDS.some((k) => hay.includes(k));
  });

  console.log(
    `${candidates.length} fiche(s) info Bac+2/3 brutes. mode: ${
      apply ? (curate ? "APPLY+CURATE" : "APPLY") : "DRY-RUN"
    }\n`,
  );

  let matched = 0;
  let unmatched = 0;
  let written = 0;
  let untouched = 0;
  const unmatchedSamples: string[] = [];
  const byType: Record<string, number> = {};

  let processed = 0;
  for (const p of candidates) {
    if (processed >= limit) break;
    processed++;

    const ref = matchRef(p.formationLabel);
    if (!ref) {
      unmatched++;
      if (unmatchedSamples.length < 15) unmatchedSamples.push(p.formationLabel);
      continue;
    }
    matched++;
    byType[ref.key] = (byType[ref.key] ?? 0) + 1;

    // Ne remplir que les champs vides ; corriger la durée (plus fiable par type).
    const set: Record<string, unknown> = {};
    if (isEmptyJson(p.domains)) set.domains = JSON.stringify(ref.domains);
    if (isEmptyJson(p.outcomesJobs)) set.outcomesJobs = JSON.stringify(ref.outcomesJobs);
    if (isEmptyJson(p.acceptedDiplomas))
      set.acceptedDiplomas = JSON.stringify(ref.acceptedDiplomas);
    if (isEmptyJson(p.outcomesNextLevels))
      set.outcomesNextLevels = JSON.stringify(ref.outcomesNextLevels);
    if ((p.description ?? "").length < 120) set.description = ref.description;
    if (p.recommendsInternshipWeeks == null)
      set.recommendsInternshipWeeks = ref.recommendsInternshipWeeks;
    if (p.durationYears !== ref.durationYears) set.durationYears = ref.durationYears;
    if (curate) set.isCurated = true;

    if (Object.keys(set).length === 0) {
      untouched++;
      continue;
    }

    if (apply) {
      await db.update(programs).set(set).where(eq(programs.id, p.id));
      written++;
    } else {
      console.log(`  • [${ref.key}] ${p.title}`);
    }
  }

  console.log(
    `\nRésumé : reconnues=${matched} non-reconnues=${unmatched}` +
      (apply ? ` écrites=${written} déjà-pleines=${untouched}` : ""),
  );
  if (Object.keys(byType).length) {
    console.log("Par type : " + Object.entries(byType).map(([k, n]) => `${k}=${n}`).join("  "));
  }
  if (unmatchedSamples.length) {
    console.log("\nLibellés non reconnus (ajoute une entrée dans it-formation-refs.ts si récurrent) :");
    for (const s of unmatchedSamples) console.log(`  · ${s}`);
  }
  if (!apply && matched > 0) console.log("\nDRY-RUN : rien écrit. Relance avec --apply pour persister.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
