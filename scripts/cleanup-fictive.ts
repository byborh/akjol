/**
 * Nettoyage des données fictives / placeholder.
 *
 * Supprime :
 *  - les écoles à UAI provisoire "999…" (IUT seedés en placeholder par seed-iut.ts,
 *    désormais obsolètes : les vrais IUT arrivent via Parcoursup avec un UAI réel) ;
 *  - (option --reset-parcoursup) toutes les fiches programs source="parcoursup",
 *    pour pouvoir les ré-importer proprement avec un sourceId idempotent.
 *
 * NE TOUCHE PAS : les vraies écoles (Annuaire), les métiers (jobs), les
 * équivalences, ni les autres sources.
 *
 * DRY-RUN par défaut. Ajoute --apply pour supprimer réellement.
 *
 * Usage :
 *   pnpm cleanup:fictive                          # aperçu (ne supprime rien)
 *   pnpm cleanup:fictive -- --apply               # supprime les écoles 999*
 *   pnpm cleanup:fictive -- --apply --reset-parcoursup   # + vide les programs parcoursup
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { sql, eq } from "drizzle-orm";
import { createDb, programs, schools } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

async function count(db: ReturnType<typeof createDb>, table: typeof schools | typeof programs, where?: unknown): Promise<number> {
  const q = db.select({ c: sql<number>`count(*)` }).from(table as never);
  const r = await (where ? q.where(where as never) : q);
  return Number((r[0] as { c: number })?.c ?? 0);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const resetParcoursup = argv.includes("--reset-parcoursup");

  const db = createDb(DB_PATH);

  const fakeSchools = await count(db, schools, sql`uai LIKE '999%'`);
  const psup = resetParcoursup ? await count(db, programs, eq(programs.source, "parcoursup")) : 0;

  console.log(`mode: ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`Écoles fictives (UAI 999*) à supprimer : ${fakeSchools}`);
  if (resetParcoursup) console.log(`Programs parcoursup à vider (re-seed) : ${psup}`);

  if (!apply) {
    console.log("\nDRY-RUN : rien supprimé. Relance avec --apply.");
    return;
  }

  await db.delete(schools).where(sql`uai LIKE '999%'`);
  if (resetParcoursup) await db.delete(programs).where(eq(programs.source, "parcoursup"));

  console.log("\nSupprimé.");
  console.log(`Restant : schools=${await count(db, schools)} (fictives=${await count(db, schools, sql`uai LIKE '999%'`)})`);
  console.log(`Restant : programs=${await count(db, programs)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
