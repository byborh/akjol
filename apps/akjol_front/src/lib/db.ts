import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createDb, type Db } from "@akjol/db";

/**
 * Singleton SQLite côté serveur Next. Survit au HMR via globalThis pour ne
 * pas ouvrir une nouvelle connexion à chaque hot reload (qui finirait par
 * saturer les FDs).
 *
 * Robustesse : si better-sqlite3 n'a pas son binding natif compilé (cas
 * Windows fréquent), on logue et on retourne null. Les routes API qui
 * consomment ça doivent traiter null comme "DB indisponible" et fallback
 * sur les fixtures hardcodées (zéro régression démo).
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
// __dirname = apps/akjol_front/src/lib → repo root = ../../../..
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../../../../data/akjol.db");

type Cache = { db: Db | null; tried: boolean };
const globalForDb = globalThis as unknown as { __akjolDb?: Cache };

export function getDb(): Db | null {
  if (!globalForDb.__akjolDb) {
    globalForDb.__akjolDb = { db: null, tried: false };
  }
  const cache = globalForDb.__akjolDb;
  if (cache.tried) return cache.db;
  cache.tried = true;
  try {
    cache.db = createDb(DB_PATH);
  } catch (err) {
    console.warn(
      `[akjol] SQLite unavailable (${err instanceof Error ? err.message : String(err)}). ` +
        `API routes will fall back to bundled fixtures.`,
    );
    cache.db = null;
  }
  return cache.db;
}
