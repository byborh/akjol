import type { EquivalenceEdge, EquivalenceKind } from "../data/equivalences";

/**
 * Calcule, depuis un code de diplôme, l'ensemble des autres codes atteignables
 * dans le graphe d'équivalences — et avec quelle "qualité" (best edge type).
 *
 * Utilisé par le moteur de feasibility pour considérer qu'un BTS_SIO_SISR peut
 * postuler à un programme dont les acceptedDiplomas contiennent DUT_INFO via
 * une arête `acceptedAs` (au lieu d'un includes() strict qui échouerait).
 *
 * Règles :
 *  - On part de `fromCode` avec qualité "self" (poids 1, le diplôme lui-même).
 *  - Pour chaque arête sortante depuis le nœud courant, on propage à `to` :
 *      equivalent       → qualité "equivalent" (poids 1)
 *      acceptedAs       → qualité "acceptedAs" (poids edge.weight)
 *      requiresBridge   → qualité "requiresBridge" (poids edge.weight)
 *      notRecognized    → bloque ce target (et bloque sa note)
 *  - Une qualité supérieure écrase une qualité inférieure si on retrouve le
 *    même target via un meilleur chemin (self > equivalent > acceptedAs >
 *    requiresBridge).
 *  - BFS borné en profondeur (default 3) pour éviter une propagation sauvage.
 *
 * À noter : on ne traite pour l'instant que les arêtes orientées (from→to).
 * Si un curator veut une vraie équivalence symétrique, il doit créer les
 * deux arêtes — c'est explicite dans /admin/graph.
 */

export type ReachQuality = "self" | "equivalent" | "acceptedAs" | "requiresBridge";

const QUALITY_RANK: Record<ReachQuality, number> = {
  self: 0,
  equivalent: 1,
  acceptedAs: 2,
  requiresBridge: 3,
};

export type DiplomaReachability = {
  code: string;
  quality: ReachQuality;
  weight: number;
  /** Codes traversés depuis fromCode (inclus). */
  path: string[];
  /** Note(s) éventuelles des arêtes du chemin, agrégées. */
  notes: string[];
};

export function reachableFrom(
  fromCode: string,
  edges: EquivalenceEdge[],
  maxDepth = 3,
): Map<string, DiplomaReachability> {
  const reach = new Map<string, DiplomaReachability>();
  reach.set(fromCode, { code: fromCode, quality: "self", weight: 1, path: [fromCode], notes: [] });

  // Index out-edges par source pour éviter le rebalayage.
  const out = new Map<string, EquivalenceEdge[]>();
  for (const e of edges) {
    if (!out.has(e.from)) out.set(e.from, []);
    out.get(e.from)!.push(e);
  }

  // Notes "blocking" cumulées par target via notRecognized.
  // On les garde séparées : un target peut être atteignable via une autre
  // arête positive ; mais si la SEULE manière d'y arriver est notRecognized,
  // on l'exclut.
  const blockingNotes = new Map<string, string[]>();

  type Q = { code: string; quality: ReachQuality; weight: number; path: string[]; notes: string[]; depth: number };
  const queue: Q[] = [{ code: fromCode, quality: "self", weight: 1, path: [fromCode], notes: [], depth: 0 }];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.depth >= maxDepth) continue;
    const next = out.get(cur.code) ?? [];
    for (const e of next) {
      if (cur.path.includes(e.to)) continue; // évite cycles

      if (e.kind === "notRecognized") {
        const notes = blockingNotes.get(e.to) ?? [];
        if (e.note) notes.push(e.note);
        else notes.push(`${e.from} non reconnu pour ${e.to}`);
        blockingNotes.set(e.to, notes);
        continue;
      }

      const propagatedQuality: ReachQuality =
        e.kind === "equivalent"
          ? // Si on est déjà via un acceptedAs/bridge en amont, on ne peut pas
            // "remonter" la qualité. On prend max(cur.quality, equivalent).
            QUALITY_RANK[cur.quality] >= QUALITY_RANK.equivalent
              ? cur.quality
              : "equivalent"
          : e.kind === "acceptedAs"
            ? QUALITY_RANK[cur.quality] >= QUALITY_RANK.acceptedAs
              ? cur.quality
              : "acceptedAs"
            : "requiresBridge"; // requiresBridge "absorbe" tout chemin l'incluant

      const propagatedWeight = Math.min(cur.weight, e.weight);
      const newPath = [...cur.path, e.to];
      const newNotes = e.note ? [...cur.notes, e.note] : cur.notes;

      const existing = reach.get(e.to);
      if (
        !existing ||
        QUALITY_RANK[propagatedQuality] < QUALITY_RANK[existing.quality] ||
        (QUALITY_RANK[propagatedQuality] === QUALITY_RANK[existing.quality] &&
          propagatedWeight > existing.weight)
      ) {
        reach.set(e.to, {
          code: e.to,
          quality: propagatedQuality,
          weight: propagatedWeight,
          path: newPath,
          notes: newNotes,
        });
        queue.push({
          code: e.to,
          quality: propagatedQuality,
          weight: propagatedWeight,
          path: newPath,
          notes: newNotes,
          depth: cur.depth + 1,
        });
      }
    }
  }

  return reach;
}

/**
 * Cherche, parmi `acceptedDiplomas` du programme, le meilleur match
 * (qualité la plus haute, poids le plus élevé) atteignable depuis `fromCode`
 * dans le graphe d'équivalences.
 */
export function bestMatchAmong(
  fromCode: string,
  acceptedDiplomas: string[],
  edges: EquivalenceEdge[],
): DiplomaReachability | null {
  const reach = reachableFrom(fromCode, edges);
  let best: DiplomaReachability | null = null;
  for (const code of acceptedDiplomas) {
    const r = reach.get(code);
    if (!r) continue;
    if (!best) {
      best = r;
      continue;
    }
    if (
      QUALITY_RANK[r.quality] < QUALITY_RANK[best.quality] ||
      (QUALITY_RANK[r.quality] === QUALITY_RANK[best.quality] && r.weight > best.weight)
    ) {
      best = r;
    }
  }
  return best;
}

export function describeReach(r: DiplomaReachability): string {
  switch (r.quality) {
    case "self":
      return "Diplôme directement listé";
    case "equivalent":
      return `Équivalent reconnu (via ${r.path.slice(0, -1).join(" → ")})`;
    case "acceptedAs":
      return `Accepté comme ${r.path[r.path.length - 1]} (équivalence pondérée ${r.weight.toFixed(2)})`;
    case "requiresBridge":
      return `Possible mais via passerelle : ${r.path.join(" → ")}`;
  }
}

export type { EquivalenceEdge, EquivalenceKind };
