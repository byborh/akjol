import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { equivalenceEdges, equivalenceRevisions } from "@akjol/db";
import { getDb } from "../../../../../lib/db";
import {
  getCuratorSession,
  logRevision,
  rowToEdge,
} from "../../../../../lib/equivalences-db";
import type { EquivalenceEdge, EquivalenceKind } from "../../../../../data/equivalences";

/**
 * POST /api/equivalences/revert/[revisionId] (curator)
 *
 * Restaure l'état d'une arête à partir d'un snapshot. Les snapshots sont
 * pris AVANT l'action :
 *   - create : snapshot null → revert = supprimer l'arête (rollback de l'ajout)
 *   - update : snapshot = ancien state → revert = upsert avec cet ancien state
 *   - delete : snapshot = état au moment du delete → revert = recréer l'arête
 *
 * Chaque revert log à son tour une nouvelle révision (action = "update" ou
 * "create"/"delete" selon le cas) pour que l'historique reste cohérent.
 */

type RouteContext = { params: Promise<{ revisionId: string }> };

export async function POST(_req: Request, ctx: RouteContext) {
  const auth = await getCuratorSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { revisionId } = await ctx.params;
  const revId = Number(revisionId);
  if (!Number.isFinite(revId)) {
    return NextResponse.json({ error: "Invalid revisionId" }, { status: 400 });
  }

  try {
    const rev = await db
      .select()
      .from(equivalenceRevisions)
      .where(eq(equivalenceRevisions.id, revId))
      .limit(1);
    if (!rev[0]) return NextResponse.json({ error: "Revision not found" }, { status: 404 });

    const r = rev[0];
    const snapshot: EquivalenceEdge | null = r.snapshotJson
      ? (JSON.parse(r.snapshotJson) as EquivalenceEdge)
      : null;
    const now = new Date();
    const by = auth.session.userId;

    if (r.action === "create") {
      // L'arête a été créée → revert = la supprimer si elle existe encore
      const current = await db
        .select()
        .from(equivalenceEdges)
        .where(eq(equivalenceEdges.id, r.edgeId))
        .limit(1);
      if (current[0]) {
        const before = rowToEdge(current[0]);
        await db.delete(equivalenceEdges).where(eq(equivalenceEdges.id, r.edgeId));
        await logRevision(db, r.edgeId, "delete", before, by);
      }
      return NextResponse.json({ ok: true, restored: null });
    }

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot missing" }, { status: 422 });
    }

    // update ou delete → on restaure le snapshot via upsert
    const current = await db
      .select()
      .from(equivalenceEdges)
      .where(eq(equivalenceEdges.id, r.edgeId))
      .limit(1);

    await db
      .insert(equivalenceEdges)
      .values({
        id: snapshot.id,
        from: snapshot.from,
        to: snapshot.to,
        kind: snapshot.kind as EquivalenceKind,
        weight: Math.round(snapshot.weight * 100),
        note: snapshot.note ?? null,
        updatedAt: now,
        updatedBy: by,
      })
      .onConflictDoUpdate({
        target: equivalenceEdges.id,
        set: {
          from: snapshot.from,
          to: snapshot.to,
          kind: snapshot.kind,
          weight: Math.round(snapshot.weight * 100),
          note: snapshot.note ?? null,
          updatedAt: now,
          updatedBy: by,
        },
      });

    const before = current[0] ? rowToEdge(current[0]) : null;
    await logRevision(
      db,
      snapshot.id,
      current[0] ? "update" : "create",
      before,
      by,
    );
    return NextResponse.json({ ok: true, restored: snapshot });
  } catch (err) {
    console.error("[/api/equivalences/revert/[revisionId]] POST failed", err);
    return NextResponse.json({ error: "Revert failed" }, { status: 500 });
  }
}
