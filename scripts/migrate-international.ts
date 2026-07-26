/**
 * Migration "international-ready" : ajoute les colonnes isced_level + cost_currency
 * à `programs` (si absentes) et backfille isced_level sur les fiches existantes.
 *
 * - cost_currency : rempli à 'EUR' par le DEFAULT de la colonne (rétrocompat).
 * - isced_level  : dérivé du niveau national + durée (levelToIsced).
 *
 * SQL brut volontairement (le schéma Drizzle déclare déjà les colonnes ; on ne
 * peut donc pas faire de select ORM avant l'ALTER). Idempotent. DRY-RUN par défaut.
 *
 * Usage :
 *   pnpm migrate:international            # aperçu (mapping ISCED, rien écrit)
 *   pnpm migrate:international -- --apply # ALTER + backfill
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { sql } from "drizzle-orm";
import { createDb, levelToIsced } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

type Row = { id: string; level: string; duration_years: number };

async function addColumn(db: ReturnType<typeof createDb>, ddl: string, name: string): Promise<void> {
  try {
    await db.run(sql.raw(ddl));
    console.log(`  + colonne ajoutée : ${name}`);
  } catch (e) {
    if (/duplicate column|already exists/i.test(String(e))) console.log(`  = déjà présente : ${name}`);
    else throw e;
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const db = createDb(DB_PATH);

  const res = await db.all(sql`SELECT id, level, duration_years FROM programs`);
  const rows = res as unknown as Row[];
  console.log(`${rows.length} fiches. mode: ${apply ? "APPLY" : "DRY-RUN"}\n`);

  const dist = new Map<number, number>();
  for (const r of rows) {
    const isced = levelToIsced(r.level, r.duration_years);
    dist.set(isced, (dist.get(isced) ?? 0) + 1);
  }
  console.log("Mapping ISCED prévu (niveau national → ISCED) :");
  for (const [isced, n] of [...dist.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ISCED ${isced} : ${n} fiche(s)`);
  }
  console.log("  (ex. BTS bac+2 → ISCED 5, BUT bac+3 → ISCED 6, diplôme d'ingénieur → ISCED 7)\n");

  if (!apply) {
    console.log("DRY-RUN : rien écrit. Relance avec --apply pour ALTER + backfill.");
    return;
  }

  console.log("Ajout des colonnes…");
  await addColumn(db, "ALTER TABLE programs ADD COLUMN isced_level integer", "isced_level");
  await addColumn(
    db,
    "ALTER TABLE programs ADD COLUMN cost_currency text NOT NULL DEFAULT 'EUR'",
    "cost_currency",
  );

  console.log("\nBackfill isced_level…");
  let n = 0;
  for (const r of rows) {
    const isced = levelToIsced(r.level, r.duration_years);
    await db.run(sql`UPDATE programs SET isced_level = ${isced} WHERE id = ${r.id}`);
    n++;
  }
  console.log(`OK — ${n} fiches backfillées (cost_currency = EUR par défaut).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
