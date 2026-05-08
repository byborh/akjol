import { createThrottle } from "../util/throttle.js";
import type { NormalizedProgram, SourceAdapter } from "../types.js";

/**
 * Source Common App (commonapp.org/explore) — universités US.
 *
 * STATUT : SQUELETTE. Pas d'API publique. La page "explore" charge la liste
 * des member colleges via XHR JSON. Stratégie cible :
 *   1. Identifier l'endpoint JSON utilisé par /explore (devtools).
 *   2. Throttle ≥ 1s, User-Agent honnête.
 *   3. Pour chaque college : fetch fiche → extraire programs / deadlines.
 *   4. Mapper US degree types → ProgramLevel : "Bachelor's" → bachelor,
 *     "Master's" → master, "PhD" → doctorat. Associate → bachelor (cycle court).
 *
 * À FAIRE :
 *   - Confirmer robots.txt + ToS Common App.
 *   - Implémenter la pagination du listing.
 *   - Extraire deadlines : Early Decision (1 nov), Regular Decision (1 jan typique).
 *   - Capturer les frais (tuition out-of-state pour FR/MY/etc.) — varient
 *     fortement, à mapper par niveau si pas d'info précise.
 */
export function createCommonAppAdapter(): SourceAdapter {
  const throttle = createThrottle(1000);

  return {
    source: "common_app",
    label: "Common App — US member colleges",
    async *iterate(): AsyncGenerator<NormalizedProgram> {
      console.warn(
        "[common-app] adapter non implémenté — stub. " +
          "Voir packages/ingest/src/sources/common-app.ts pour le plan d'attaque.",
      );
      void throttle;
      return;
    },
  };
}
