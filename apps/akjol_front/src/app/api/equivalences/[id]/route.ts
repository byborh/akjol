import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { equivalenceEdges } from "@akjol/db";
import { getDb } from "../../../../lib/db";
import {
  getCuratorSession,
  logRevision,
  rowToEdge,
} from "../../../../lib/equivalences-db";

const KindEnum = z.enum(["equivalent", "acceptedAs", "requiresBridge", "notRecognized"]);

const PatchBody = z.object({
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  kind: KindEnum.optional(),
  weight: z.number().min(0).max(1).optional(),
  note: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: RouteContext) {
  const auth = await getCuratorSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { id } = await ctx.params;
  let patch: z.infer<typeof PatchBody>;
  try {
    patch = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const existing = await db
      .select()
      .from(equivalenceEdges)
      .where(eq(equivalenceEdges.id, id))
      .limit(1);
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const before = rowToEdge(existing[0]);
    const now = new Date();
    const updates: Partial<typeof equivalenceEdges.$inferInsert> = { updatedAt: now, updatedBy: auth.session.userId };
    if (patch.from !== undefined) updates.from = patch.from;
    if (patch.to !== undefined) updates.to = patch.to;
    if (patch.kind !== undefined) updates.kind = patch.kind;
    if (patch.weight !== undefined) updates.weight = Math.round(patch.weight * 100);
    if (patch.note !== undefined) updates.note = patch.note || null;

    await db.update(equivalenceEdges).set(updates).where(eq(equivalenceEdges.id, id));
    await logRevision(db, id, "update", before, auth.session.userId);

    const after = await db
      .select()
      .from(equivalenceEdges)
      .where(eq(equivalenceEdges.id, id))
      .limit(1);
    return NextResponse.json({ edge: rowToEdge(after[0]!) });
  } catch (err) {
    console.error("[/api/equivalences/[id]] PUT failed", err);
    return NextResponse.json({ error: "Write failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await getCuratorSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { id } = await ctx.params;
  try {
    const existing = await db
      .select()
      .from(equivalenceEdges)
      .where(eq(equivalenceEdges.id, id))
      .limit(1);
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const before = rowToEdge(existing[0]);
    await db.delete(equivalenceEdges).where(eq(equivalenceEdges.id, id));
    await logRevision(db, id, "delete", before, auth.session.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/equivalences/[id]] DELETE failed", err);
    return NextResponse.json({ error: "Write failed" }, { status: 500 });
  }
}
