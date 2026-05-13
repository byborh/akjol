#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createDb } from "@akjol/db";
import { runIngestion } from "./upsert.js";
import { createOnisepAdapter } from "./sources/onisep.js";
import { createMonMasterAdapter } from "./sources/mon-master.js";
import { createUcasAdapter } from "./sources/ucas.js";
import { createCommonAppAdapter } from "./sources/common-app.js";
import type { SourceAdapter, RunStats } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// __dirname = packages/ingest/src → repo root = ../../..
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../../../data/akjol.db");

const HELP = `
AkJol ingest CLI

Usage:
  pnpm ingest <source> [--limit N]

Sources:
  onisep        ONISEP — Idéo-Formations FR (CSV public, ~60k formations)
  mon-master    Mon Master — masters universitaires FR (stub)
  ucas          UCAS — top 50 universités UK (stub)
  common-app    Common App — colleges US (stub)
  all           lance les 4 sources séquentiellement

Options:
  --limit N     stop après N programmes (utile pour dev/test)
  --db PATH     SQLite path (défaut: ./data/akjol.db ou env AKJOL_DB)
  --help        affiche cette aide
`;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return;
  }

  const cmd = argv[0];
  const limit = parseFlag(argv, "--limit");
  const dbPath = parseFlag(argv, "--db") ?? DB_PATH;

  const db = createDb(dbPath);

  const adapters: Record<string, () => SourceAdapter> = {
    onisep: () => createOnisepAdapter(limit ? { limit: Number(limit) } : {}),
    "mon-master": () => createMonMasterAdapter(),
    ucas: () => createUcasAdapter(),
    "common-app": () => createCommonAppAdapter(),
  };

  if (cmd === "all") {
    const all: RunStats[] = [];
    for (const key of Object.keys(adapters)) {
      const adapter = adapters[key]();
      console.log(`\n=== ${adapter.label} ===`);
      const stats = await runIngestion(db, adapter);
      printStats(stats);
      all.push(stats);
    }
    const total = all.reduce(
      (acc, s) => ({
        inserted: acc.inserted + s.inserted,
        updated: acc.updated + s.updated,
        unchanged: acc.unchanged + s.unchanged,
        deprecated: acc.deprecated + s.deprecated,
        errors: acc.errors + s.errors,
      }),
      { inserted: 0, updated: 0, unchanged: 0, deprecated: 0, errors: 0 },
    );
    console.log(
      `\n=== TOTAL ===\n` +
        `inserted=${total.inserted} updated=${total.updated} unchanged=${total.unchanged} ` +
        `deprecated=${total.deprecated} errors=${total.errors}`,
    );
    if (total.errors > 0) process.exit(1);
    return;
  }

  const make = adapters[cmd];
  if (!make) {
    console.error(`Source inconnue: ${cmd}\n${HELP}`);
    process.exit(2);
  }
  const adapter = make();
  console.log(`=== ${adapter.label} ===`);
  const stats = await runIngestion(db, adapter);
  printStats(stats);
  if (stats.errors > 0) process.exit(1);
}

function parseFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  return argv[i + 1];
}

function printStats(s: RunStats): void {
  const ms = s.finishedAt.getTime() - s.startedAt.getTime();
  console.log(
    `[${s.source}] inserted=${s.inserted} updated=${s.updated} ` +
      `unchanged=${s.unchanged} deprecated=${s.deprecated} ` +
      `errors=${s.errors} duration=${ms}ms`,
  );
  for (const note of s.notes.slice(0, 5)) console.log(`  • ${note}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
