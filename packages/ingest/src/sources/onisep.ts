import { createReadStream, existsSync, openSync, readSync, closeSync, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import type { NormalizedProgram, SourceAdapter } from "../types.js";
import { normalizeOnisepRow, type OnisepRow } from "../normalizers/onisep.js";

/**
 * Source ONISEP — dataset "Idéo - Formations initiales France entière".
 * Publié sur data.gouv.fr en CSV, ~60 000 lignes. Licence Ouverte / Etalab.
 *
 * Stratégie :
 *  1. Télécharger le CSV dans un cache local (data/cache/onisep.csv) si absent
 *     ou plus vieux que `cacheTtlHours`.
 *  2. Streamer le CSV ligne par ligne avec csv-parse (pas de fullLoad).
 *  3. Normaliser chaque ligne via normalizeOnisepRow et yield si valide.
 *
 * Le slug peut bouger ; on lit ONISEP_DATASET_URL depuis l'env pour forcer une
 * URL explicite (à pointer sur la "ressource principale" la plus récente du
 * dataset Idéo-Formations sur data.gouv.fr).
 */
const DEFAULT_DATASET_URL =
  process.env.ONISEP_DATASET_URL ??
  "https://www.data.gouv.fr/fr/datasets/r/9ce66cd1-8afe-4c7d-a1b6-5b3a3e7e3f5a";

export type OnisepAdapterOptions = {
  /** Chemin local du fichier CSV à parser. Si absent, on télécharge depuis `datasetUrl`. */
  cachePath?: string;
  datasetUrl?: string;
  cacheTtlHours?: number;
  /** Limite optionnelle pour les tests/dev (stop après N lignes). */
  limit?: number;
};

export function createOnisepAdapter(opts: OnisepAdapterOptions = {}): SourceAdapter {
  const cachePath = opts.cachePath ?? "./data/cache/onisep.csv";
  const datasetUrl = opts.datasetUrl ?? DEFAULT_DATASET_URL;
  const cacheTtlHours = opts.cacheTtlHours ?? 24;

  return {
    source: "onisep",
    label: "ONISEP — Idéo-Formations initiales",
    async *iterate(): AsyncGenerator<NormalizedProgram> {
      await ensureCache(cachePath, datasetUrl, cacheTtlHours);

      const parser = createReadStream(cachePath).pipe(
        parse({
          columns: (header: string[]) => header.map((h) => h.toLowerCase().trim()),
          delimiter: detectDelimiter(cachePath),
          relax_quotes: true,
          relax_column_count: true,
          skip_empty_lines: true,
          trim: true,
        }),
      );

      let count = 0;
      for await (const row of parser as AsyncIterable<OnisepRow>) {
        const program = normalizeOnisepRow(row);
        if (!program) continue;
        yield program;
        count++;
        if (opts.limit && count >= opts.limit) break;
      }
    },
  };
}

async function ensureCache(
  cachePath: string,
  datasetUrl: string,
  ttlHours: number,
): Promise<void> {
  if (await isCacheFresh(cachePath, ttlHours)) return;

  await mkdir(dirname(cachePath), { recursive: true });
  console.log(`[onisep] downloading ${datasetUrl} → ${cachePath}`);
  const res = await fetch(datasetUrl, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`ONISEP download failed: HTTP ${res.status}`);
  }
  // Convertit le ReadableStream Web en Node.Readable pour piper sur disk.
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(cachePath));
}

async function isCacheFresh(path: string, ttlHours: number): Promise<boolean> {
  if (!existsSync(path)) return false;
  const s = await stat(path);
  const ageMs = Date.now() - s.mtimeMs;
  return ageMs < ttlHours * 3_600_000;
}

function detectDelimiter(path: string): string {
  // ONISEP livre tantôt en CSV virgule, tantôt en CSV point-virgule. csv-parse
  // ne devine pas tout seul : on lit le 1er kilo et compte les séparateurs.
  const fd = openSync(path, "r");
  const buf = Buffer.alloc(1024);
  readSync(fd, buf, 0, 1024, 0);
  closeSync(fd);
  const sample = buf.toString("utf8");
  const semis = (sample.match(/;/g) ?? []).length;
  const commas = (sample.match(/,/g) ?? []).length;
  return semis > commas ? ";" : ",";
}
