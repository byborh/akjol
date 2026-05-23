/**
 * Import "Annuaire de l'Éducation" (lycées, 2nd degré) + dataset MESR
 * "Principaux établissements d'enseignement supérieur" (universités, écoles
 * d'ingé, IUT) → table `schools`.
 *
 * Pourquoi 2 sources : l'Annuaire ÉN n'inclut que le scolaire (1er+2nd degré
 * + sections post-bac en lycée). Les universités, IUT, écoles d'ingé sont
 * gérés par le ministère de l'Enseignement Supérieur (MESR). Sans cette 2e
 * source, on n'a aucun moyen de matcher les BUT, L, M, Ingé sur une école.
 *
 * Les deux datasets sont sous licence Etalab et utilisent le code UAI comme
 * clé. L'upsert sur `uai` rend l'import idempotent et rejouable.
 *
 * Usage :
 *   pnpm import:schools                       # les 2 sources
 *   pnpm import:schools --source=annuaire     # uniquement lycées (ÉN)
 *   pnpm import:schools --source=mesr         # uniquement supérieur (MESR)
 *   pnpm import:schools --dry-run             # n'écrit rien
 *   pnpm import:schools --limit=100           # smoke test (par source)
 *   pnpm import:schools --inspect             # dump colonnes + 1 ligne sample
 */
import { createReadStream, existsSync, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import { sql } from "drizzle-orm";
import { createDb, schools, type Db } from "@akjol/db";

type Row = Record<string, string>;
type SchoolInsert = typeof schools.$inferInsert;

const CACHE_DIR = "./data/cache";
const CACHE_TTL_HOURS = 7 * 24;
const BATCH_SIZE = 500;

type SourceConfig = {
  name: string;
  cachePath: string;
  url: string;
  /** Décide si une ligne doit aller dans la table. */
  shouldKeep: (row: Row) => boolean;
  /** Mappe une ligne CSV vers un SchoolInsert. Retourne null si data manquante critique. */
  mapRow: (row: Row) => SchoolInsert | null;
};

// ---------- Helpers ----------

function pick(row: Row, ...candidates: string[]): string | undefined {
  for (const c of candidates) {
    const v = row[c];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return undefined;
}

function parseLatLng(raw: string | undefined): { lat?: number; lng?: number } {
  if (!raw) return {};
  const [a, b] = raw.split(/[,;]/).map((s) => s.trim());
  const lat = parseFloat(a ?? "");
  const lng = parseFloat(b ?? "");
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  return {};
}

function coordToInt(v: number | undefined): number | null {
  return v !== undefined ? Math.round(v * 1e6) : null;
}

// ---------- Source 1 : Annuaire de l'Éducation (lycées) ----------

const ANNUAIRE: SourceConfig = {
  name: "annuaire",
  cachePath: `${CACHE_DIR}/annuaire-education.csv`,
  url:
    process.env.ANNUAIRE_DATASET_URL ??
    "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/exports/csv?lang=fr&use_labels=true&delimiter=%3B",
  shouldKeep(row) {
    if (pick(row, "etat") && pick(row, "etat") !== "OUVERT") return false;
    if (pick(row, "post_bac") === "1") return true;
    const t = pick(row, "type_etablissement");
    return t === "Lycée" || t === "Lycee";
  },
  mapRow(row) {
    const uai = pick(row, "identifiant_de_l_etablissement");
    const name = pick(row, "nom_etablissement");
    const city = pick(row, "nom_commune");
    if (!uai || !name || !city) return null;
    const { lat, lng } = (() => {
      const pos = pick(row, "position");
      if (pos) return parseLatLng(pos);
      const la = pick(row, "latitude");
      const lo = pick(row, "longitude");
      if (la && lo) return parseLatLng(`${la},${lo}`);
      return {};
    })();
    const nature = (pick(row, "libelle_nature") ?? "").toLowerCase();
    const type = nature.includes("lyc") ? "lycée" : "autre";
    return {
      uai,
      name,
      city,
      postalCode: pick(row, "code_postal") ?? null,
      region: pick(row, "libelle_region") ?? null,
      lat: coordToInt(lat),
      lng: coordToInt(lng),
      type,
      websiteUrl: pick(row, "web") ?? null,
    };
  },
};

// ---------- Source 2 : MESR — Principaux établissements supérieurs ----------

const MESR: SourceConfig = {
  name: "mesr",
  cachePath: `${CACHE_DIR}/mesr-sup.csv`,
  url:
    process.env.MESR_DATASET_URL ??
    "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-principaux-etablissements-enseignement-superieur/exports/csv?lang=fr&use_labels=true&delimiter=%3B",
  shouldKeep() {
    // Ce dataset contient déjà uniquement le supérieur — on garde tout.
    return true;
  },
  mapRow(row) {
    // Les en-têtes du MESR sont accentués → après normalisation ils perdent les
    // accents : "uai - identifiant" → "uai___identifiant", "libellé" → "libell".
    const uai = pick(row, "uai___identifiant", "uai", "uai_identifiant");
    const name = pick(row, "libell", "libelle", "uo_lib_officiel", "nom");
    const city = pick(row, "commune", "localit");
    if (!uai || !name || !city) return null;
    const { lat, lng } = parseLatLng(pick(row, "golocalisation", "geolocalisation"));
    const typeRaw = (pick(row, "type_dtablissement", "type_d_etablissement") ?? "").toLowerCase();
    const type = (() => {
      if (typeRaw.includes("université") || typeRaw.includes("universite")) return "université";
      if (typeRaw.includes("ingénieur") || typeRaw.includes("ingenieur")) return "école_ingé";
      if (typeRaw.includes("iut") || typeRaw.includes("technologie")) return "iut";
      if (typeRaw.includes("commerce")) return "école_commerce";
      if (typeRaw.includes("école") || typeRaw.includes("ecole")) return "école_sup";
      if (typeRaw.includes("grand")) return "grand_étab";
      return "sup_autre";
    })();
    return {
      uai,
      name,
      city,
      postalCode: pick(row, "code_postal") ?? null,
      region: pick(row, "rgion", "region") ?? null,
      lat: coordToInt(lat),
      lng: coordToInt(lng),
      type,
      websiteUrl: pick(row, "site_internet") ?? null,
    };
  },
};

// ---------- Cache CSV ----------

async function ensureCache(source: SourceConfig): Promise<void> {
  if (existsSync(source.cachePath)) {
    const s = await stat(source.cachePath);
    const ageH = (Date.now() - s.mtimeMs) / 3_600_000;
    if (ageH < CACHE_TTL_HOURS) {
      console.log(`[${source.name}] using cache (${ageH.toFixed(1)}h old): ${source.cachePath}`);
      return;
    }
  }
  await mkdir(dirname(source.cachePath), { recursive: true });
  console.log(`[${source.name}] downloading ${source.url}`);
  console.log(`[${source.name}]   → ${source.cachePath}`);
  const res = await fetch(source.url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`[${source.name}] download failed: HTTP ${res.status}`);
  }
  await pipeline(
    Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(source.cachePath),
  );
  const s = await stat(source.cachePath);
  console.log(`[${source.name}] downloaded ${(s.size / 1_048_576).toFixed(1)} MB`);
}

// ---------- Import logic ----------

async function importSource(
  source: SourceConfig,
  db: Db | null,
  opts: { limit: number; inspect: boolean },
): Promise<{ total: number; kept: number; skipped: number; errors: number }> {
  await ensureCache(source);
  const parser = createReadStream(source.cachePath).pipe(
    parse({
      columns: (h: string[]) =>
        h.map((s) =>
          s
            .toLowerCase()
            .trim()
            .replace(/[\s-]/g, "_")
            .replace(/[^\w]/g, ""),
        ),
      delimiter: ";",
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }),
  );

  let total = 0;
  let kept = 0;
  let skipped = 0;
  let errors = 0;
  let batch: SchoolInsert[] = [];

  async function flush() {
    if (!db || batch.length === 0) return;
    await db
      .insert(schools)
      .values(batch)
      .onConflictDoUpdate({
        target: schools.uai,
        set: {
          name: sql`excluded.name`,
          city: sql`excluded.city`,
          postalCode: sql`excluded.postal_code`,
          region: sql`excluded.region`,
          lat: sql`excluded.lat_x1e6`,
          lng: sql`excluded.lng_x1e6`,
          type: sql`excluded.type`,
          websiteUrl: sql`excluded.website_url`,
          updatedAt: sql`(unixepoch())`,
        },
      });
    batch = [];
  }

  for await (const row of parser as AsyncIterable<Row>) {
    total++;
    if (opts.inspect && total === 1) {
      console.log(`\n=== INSPECT [${source.name}] ===`);
      console.log("Columns:", Object.keys(row).join(", "));
      console.log("\nSample values:");
      for (const [k, v] of Object.entries(row)) {
        console.log(`  ${k.padEnd(45)} ${String(v).slice(0, 60)}`);
      }
      return { total, kept, skipped, errors };
    }
    try {
      if (!source.shouldKeep(row)) {
        skipped++;
        continue;
      }
      const mapped = source.mapRow(row);
      if (!mapped) {
        skipped++;
        continue;
      }
      batch.push(mapped);
      kept++;
      if (batch.length >= BATCH_SIZE) await flush();
      if (kept >= opts.limit) break;
    } catch (e) {
      errors++;
      if (errors < 5) console.error(`[${source.name}] error:`, (e as Error).message);
    }
  }
  await flush();
  return { total, kept, skipped, errors };
}

// ---------- Entry point ----------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const inspect = args.includes("--inspect");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const sourceArg = args.find((a) => a.startsWith("--source="))?.split("=")[1] ?? "all";

  const sources: SourceConfig[] = [];
  if (sourceArg === "all" || sourceArg === "annuaire") sources.push(ANNUAIRE);
  if (sourceArg === "all" || sourceArg === "mesr") sources.push(MESR);
  if (sources.length === 0) {
    console.error(`Unknown source: ${sourceArg} (use annuaire | mesr | all)`);
    process.exit(1);
  }

  const db = dryRun || inspect ? null : createDb("./data/akjol.db");

  for (const src of sources) {
    console.log(`\n──────── ${src.name.toUpperCase()} ────────`);
    const stats = await importSource(src, db, { limit, inspect });
    if (inspect) continue;
    console.log(
      `[${src.name}] total=${stats.total.toLocaleString()} kept=${stats.kept.toLocaleString()} ` +
        `skipped=${stats.skipped.toLocaleString()} errors=${stats.errors}`,
    );
  }

  if (db) {
    const counts = (db as unknown as { all: (q: string) => Array<{ type: string; n: number }> })
      .all?.bind(db) ?? null;
    // Fallback raw SQL via Drizzle's prepare (simpler):
    type CountRow = { type: string; n: number };
    const distribution = (await db.all(sql`SELECT type, COUNT(*) as n FROM schools GROUP BY type ORDER BY n DESC`)) as CountRow[];
    console.log("\n=== Schools table — distribution by type ===");
    for (const r of distribution) {
      console.log(`  ${String(r.type ?? "(null)").padEnd(15)} ${r.n}`);
    }
    void counts;
  } else if (dryRun) {
    console.log("\n(dry-run, nothing written to DB)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
