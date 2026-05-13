import { equivalenceEdges, equivalenceRevisions, type EquivalenceEdgeRow } from "@akjol/db";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import type { Db } from "@akjol/db";
import { SEED_EQUIVALENCES, type EquivalenceEdge, type EquivalenceKind } from "../data/equivalences";
import { decodeSession, SESSION_COOKIE, type Session } from "./session";

/**
 * Conversion DB ↔ front : on stocke le poids en x100 (entier 0..100) côté
 * SQLite et on l'expose en float 0..1 côté front, par cohérence avec le
 * pattern riskAutomation des jobs.
 */
export function rowToEdge(r: EquivalenceEdgeRow): EquivalenceEdge {
  return {
    id: r.id,
    from: r.from,
    to: r.to,
    kind: r.kind as EquivalenceKind,
    weight: r.weight / 100,
    note: r.note ?? undefined,
  };
}

/**
 * Lazy seed : si la table est vide au premier GET, on y pousse les 10 arêtes
 * de SEED_EQUIVALENCES. Idempotent grâce au check de count. Évite d'ajouter
 * un script seed-equivalences dédié.
 */
let seedAttempted = false;
export async function ensureSeeded(db: Db): Promise<void> {
  if (seedAttempted) return;
  seedAttempted = true;
  try {
    const [{ c }] = await db
      .select({ c: sql<number>`count(*)` })
      .from(equivalenceEdges);
    if (c > 0) return;
    const now = new Date();
    await db.insert(equivalenceEdges).values(
      SEED_EQUIVALENCES.map((e) => ({
        id: e.id,
        from: e.from,
        to: e.to,
        kind: e.kind,
        weight: Math.round(e.weight * 100),
        note: e.note ?? null,
        updatedAt: now,
        updatedBy: null,
      })),
    );
    console.log(`[equivalences] seeded ${SEED_EQUIVALENCES.length} edges from SEED_EQUIVALENCES`);
  } catch (err) {
    console.warn("[equivalences] seed failed (table may not exist yet)", err);
    seedAttempted = false; // re-tenter au prochain GET
  }
}

export async function getCuratorSession(): Promise<
  | { ok: true; session: Session }
  | { ok: false; status: 401 | 403; error: string }
> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE.name)?.value;
  const session = decodeSession(token);
  if (!session) return { ok: false, status: 401, error: "Unauthorized" };
  if (session.role !== "curator" && session.role !== "admin") {
    return { ok: false, status: 403, error: "Forbidden: curator role required" };
  }
  return { ok: true, session };
}

export async function logRevision(
  db: Db,
  edgeId: string,
  action: "create" | "update" | "delete",
  snapshot: EquivalenceEdge | null,
  by: string | null,
): Promise<void> {
  await db.insert(equivalenceRevisions).values({
    edgeId,
    action,
    snapshotJson: snapshot ? JSON.stringify(snapshot) : null,
    at: new Date(),
    by,
  });
}
