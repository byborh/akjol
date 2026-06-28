import { createReadStream, existsSync, openSync, readSync, closeSync, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import type { NormalizedProgram, SourceAdapter } from "../types.js";
import { normalizeParcoursupRow, type ParcoursupRow } from "../normalizers/parcoursup.js";

/**
 * Source Parcoursup — dataset "fr-esr-parcoursup" publié en open data par le
 * MESR (data.enseignementsup-recherche.gouv.fr). Fiches *par établissement* :
 * nom réel, ville, code UAI, capacité, taux d'accès, lien fiche Parcoursup.
 *
 * Stratégie identique à ONISEP :
 *  1. Télécharger le CSV (export Opendatasoft v2.1) dans data/cache si absent/périmé.
 *  2. Streamer ligne par ligne (le dataset fait plusieurs dizaines de milliers de lignes).
 *  3. Normaliser via normalizeParcoursupRow ; filtrer sur l'informatique si itOnly.
 *
 * URL surchargeable via PARCOURSUP_DATASET_URL (le slug/endpoint peut bouger).
 */
const DEFAULT_DATASET_URL =
  process.env.PARCOURSUP_DATASET_URL ??
  "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/exports/csv?delimiter=%3B";

export type ParcoursupAdapterOptions = {
  cachePath?: string;
  datasetUrl?: string;
  cacheTtlHours?: number;
  limit?: number;
  /** Ne ramener que les formations du domaine informatique (premier lot). */
  itOnly?: boolean;
};

export function createParcoursupAdapter(opts: ParcoursupAdapterOptions = {}): SourceAdapter {
  const cachePath = opts.cachePath ?? "./data/cache/parcoursup.csv";
  const datasetUrl = opts.datasetUrl ?? DEFAULT_DATASET_URL;
  const cacheTtlHours = opts.cacheTtlHours ?? 24;

  return {
    source: "parcoursup",
    label: opts.itOnly
      ? "Parcoursup — formations informatique (Bac+2/3)"
      : "Parcoursup — toutes formations",
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
      for await (const row of parser as AsyncIterable<ParcoursupRow>) {
        const program = normalizeParcoursupRow(row, { itOnly: opts.itOnly });
        if (!program) continue;
        yield program;
        count++;
        if (opts.limit && count >= opts.limit) break;
      }
    },
  };
}

async function ensureCache(cachePath: string, datasetUrl: string, ttlHours: number): Promise<void> {
  if (await isCacheFresh(cachePath, ttlHours)) return;

  await mkdir(dirname(cachePath), { recursive: true });
  console.log(`[parcoursup] downloading ${datasetUrl} → ${cachePath}`);
  const res = await fetch(datasetUrl, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Parcoursup download failed: HTTP ${res.status}`);
  }
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(cachePath));
}

async function isCacheFresh(path: string, ttlHours: number): Promise<boolean> {
  if (!existsSync(path)) return false;
  const s = await stat(path);
  const ageMs = Date.now() - s.mtimeMs;
  return ageMs < ttlHours * 3_600_000;
}

function detectDelimiter(path: string): string {
  const fd = openSync(path, "r");
  const buf = Buffer.alloc(1024);
  readSync(fd, buf, 0, 1024, 0);
  closeSync(fd);
  const sample = buf.toString("utf8");
  const semis = (sample.match(/;/g) ?? []).length;
  const commas = (sample.match(/,/g) ?? []).length;
  return semis > commas ? ";" : ",";
}
