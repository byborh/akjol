import { createThrottle } from "../util/throttle.js";
import type { NormalizedProgram, SourceAdapter } from "../types.js";

/**
 * Source UCAS (Universities and Colleges Admissions Service, UK).
 *
 * STATUT : SQUELETTE. Pas d'API publique. Stratégie cible : scrape ciblé sur
 * les top-50 universités UK (liste curatée — Russell Group + spécialisées).
 *   1. Liste blanche d'universités à parcourir (TARGET_UNIS).
 *   2. Pour chaque uni, récupérer le sitemap UCAS et lister les programmes.
 *   3. Throttle ≥ 2s entre requêtes (UCAS a un WAF agressif).
 *   4. Parser les fiches HTML (cheerio) → NormalizedProgram.
 *
 * À FAIRE :
 *   - Confirmer robots.txt + ToS UCAS (potentiellement nécessite partenariat).
 *   - Choisir un parser HTML (cheerio recommandé — léger, sync).
 *   - Extraire : title, level, durationYears, language, costPerYear, IELTS req,
 *     application deadlines (UCAS a des deadlines fixes : 15 oct Oxbridge/médecine,
 *     25 jan main round).
 *   - Mapper UCAS levels → ProgramLevel (Bachelor → bachelor, Master → master,
 *     Foundation → bachelor + flag "foundation").
 */
export const TARGET_UNIS_UK: ReadonlyArray<{ name: string; sitemapUrl: string }> = [
  // À étoffer.
  { name: "University of Oxford", sitemapUrl: "https://www.ox.ac.uk/sitemap.xml" },
  { name: "University of Cambridge", sitemapUrl: "https://www.cam.ac.uk/sitemap.xml" },
  { name: "Imperial College London", sitemapUrl: "https://www.imperial.ac.uk/sitemap.xml" },
];

export function createUcasAdapter(): SourceAdapter {
  const throttle = createThrottle(2000);

  return {
    source: "ucas",
    label: "UCAS — Top 50 UK universities",
    async *iterate(): AsyncGenerator<NormalizedProgram> {
      console.warn(
        "[ucas] adapter non implémenté — stub. " +
          "Voir packages/ingest/src/sources/ucas.ts pour le plan d'attaque.",
      );
      void throttle;
      void TARGET_UNIS_UK;
      return;
    },
  };
}
