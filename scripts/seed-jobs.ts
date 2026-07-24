/**
 * Seed des métiers RÉELS (remplace les jobs de test).
 *
 * Source unique : apps/akjol_front/src/data/jobs.ts (JOBS) — la même donnée que
 * `jobsForProgram()` utilise pour relier formation → métier, et que l'API sert
 * en fond. Ce script la pousse en DB.
 *
 * Sur --apply : SUPPRIME tous les jobs existants (les tests) puis insère les
 * vrais. Sans --apply : DRY-RUN + vérifie que chaque débouché de formation est
 * bien relié à un métier (sinon il faut ajouter un matchKeyword).
 *
 * Usage :
 *   pnpm seed:jobs                 # dry-run + rapport de couverture des liens
 *   pnpm seed:jobs -- --apply      # supprime les tests + insère les vrais métiers
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createDb, jobs } from "@akjol/db";
import { JOBS, jobsForProgram } from "../apps/akjol_front/src/data/jobs.js";
import { IT_FORMATION_REFS } from "./data/it-formation-refs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

// Débouchés utilisés par nos formations : dictionnaire IT + écoles Junia (CSV).
const JUNIA_JOBS = [
  "Ingénieur généraliste", "Chef de projet", "Ingénieur d'affaires", "Ingénieur BTP", "Consultant",
  "Ingénieur systèmes embarqués", "Développeur logiciel", "Ingénieur réseaux", "Ingénieur IA / Data",
  "Ingénieur cybersécurité", "Ingénieur agronome", "Ingénieur agroalimentaire",
  "Chargé de projet environnement", "Ingénieur qualité", "Conseiller agricole",
];

function allOutcomeLabels(): string[] {
  const set = new Set<string>();
  for (const ref of IT_FORMATION_REFS) for (const j of ref.outcomesJobs) set.add(j);
  for (const j of JUNIA_JOBS) set.add(j);
  return [...set].sort();
}

function checkCoverage(): { ok: boolean; unmatched: string[] } {
  const unmatched: string[] = [];
  for (const label of allOutcomeLabels()) {
    if (jobsForProgram([label]).length === 0) unmatched.push(label);
  }
  return { ok: unmatched.length === 0, unmatched };
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const db = createDb(DB_PATH);

  console.log(`${JOBS.length} métiers réels prêts. mode: ${apply ? "APPLY" : "DRY-RUN"}\n`);

  // Rapport de couverture : chaque débouché de formation doit trouver un métier.
  const { ok, unmatched } = checkCoverage();
  const labels = allOutcomeLabels();
  console.log(`Liens formation→métier : ${labels.length - unmatched.length}/${labels.length} débouchés reliés.`);
  if (!ok) {
    console.log("⚠️  Débouchés SANS métier relié (ajoute un matchKeyword dans data/jobs.ts) :");
    for (const u of unmatched) console.log(`   · ${u}`);
  } else {
    console.log("✅ Tous les débouchés de formation sont reliés à un métier.");
  }

  if (!apply) {
    console.log("\nDRY-RUN : rien écrit. Relance avec --apply pour remplacer les jobs.");
    return;
  }

  console.log("\nSuppression des jobs existants (tests)…");
  await db.delete(jobs);

  for (const job of JOBS) {
    await db.insert(jobs).values({
      id: job.id,
      code: job.code,
      label: job.label,
      riskAutomation: Math.round(job.riskAutomation * 100),
      domains: JSON.stringify(job.domains),
      salary: JSON.stringify(job.salary),
      regionsTopHiring: JSON.stringify(job.regionsTopHiring),
      dailyTasks: JSON.stringify(job.dailyTasks),
      requiresDiplomas: JSON.stringify(job.requiresDiplomas),
      matchKeywords: JSON.stringify(job.matchKeywords),
    });
  }
  console.log(`OK — ${JOBS.length} métiers réels insérés.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
