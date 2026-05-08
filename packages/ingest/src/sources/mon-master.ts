import { createThrottle } from "../util/throttle.js";
import type { NormalizedProgram, SourceAdapter } from "../types.js";

/**
 * Source Mon Master (mon-master.gouv.fr) — masters universitaires FR.
 *
 * STATUT : SQUELETTE. Pas d'API officielle publiée. Mon Master expose un
 * moteur de recherche JSON interne (XHR vers /ws/...) qui change sans
 * versionning. Stratégie cible :
 *   1. Vérifier robots.txt à chaque run, abort si Disallow nous concerne.
 *   2. Throttle 1 req/sec (createThrottle 1000ms) — User-Agent identifiant.
 *   3. Itérer la pagination du moteur de recherche (filtre par mention).
 *   4. Pour chaque mention, fetch les fiches, mapper vers NormalizedProgram.
 *
 * À FAIRE quand on attaque vraiment cette source :
 *   - Identifier l'endpoint XHR stable (DevTools, panneau Network).
 *   - Définir le quota raisonnable (≤ 1 req/sec, off-peak).
 *   - Confirmer la conformité robots.txt + ToS.
 *   - Écrire les sélecteurs / parsing JSON.
 *   - Mapper champs : `mentionLibelle`, `etablissement`, `ville`, `parcours[]`.
 */
export function createMonMasterAdapter(): SourceAdapter {
  const throttle = createThrottle(1000);

  return {
    source: "mon_master",
    label: "Mon Master (mon-master.gouv.fr)",
    async *iterate(): AsyncGenerator<NormalizedProgram> {
      console.warn(
        "[mon-master] adapter non implémenté — stub. " +
          "Voir packages/ingest/src/sources/mon-master.ts pour le plan d'attaque.",
      );
      // Exemple de pattern futur :
      //   for await (const page of paginate("/ws/recherche", throttle)) {
      //     for (const fiche of page.formations) {
      //       yield normalizeMonMaster(fiche);
      //     }
      //   }
      void throttle;
      return;
    },
  };
}
