import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { equivalenceRevisions } from "@akjol/db";
import { getDb } from "../../../../lib/db";
import { getCuratorSession } from "../../../../lib/equivalences-db";

/**
 * GET (curator) → liste les N dernières révisions, plus récentes en premier.
 * Utilisé par /admin/graph pour peupler le panel History et permettre revert.
 */
export async function GET(req: Request) {
  const auth = await getCuratorSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = getDb();
  if (!db) return NextResponse.json({ items: [], source: "db-unavailable" });

  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));

  try {
    const rows = await db
      .select()
      .from(equivalenceRevisions)
      .orderBy(desc(equivalenceRevisions.id))
      .limit(limit);
    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        edgeId: r.edgeId,
        action: r.action,
        snapshot: r.snapshotJson ? JSON.parse(r.snapshotJson) : null,
        at: r.at.toISOString(),
        by: r.by,
      })),
    });
  } catch (err) {
    console.error("[/api/equivalences/revisions] GET failed", err);
    return NextResponse.json({ error: "Read failed" }, { status: 500 });
  }
}
