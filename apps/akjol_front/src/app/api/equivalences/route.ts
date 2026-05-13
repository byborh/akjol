import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { equivalenceEdges } from "@akjol/db";
import { getDb } from "../../../lib/db";
import { SEED_EQUIVALENCES } from "../../../data/equivalences";
import {
  ensureSeeded,
  getCuratorSession,
  logRevision,
  rowToEdge,
} from "../../../lib/equivalences-db";

/**
 * GET (public) → liste tous les edges. Fallback SEED_EQUIVALENCES si DB
 * indispo (même pattern que /api/programs). Au premier appel avec DB OK et
 * table vide, on seed paresseusement avec SEED_EQUIVALENCES.
 *
 * POST (curator) → crée un nouvel edge + log dans equivalence_revisions.
 */

const KindEnum = z.enum(["equivalent", "acceptedAs", "requiresBridge", "notRecognized"]);

const CreateBody = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  kind: KindEnum,
  weight: z.number().min(0).max(1),
  note: z.string().optional(),
});

export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ items: SEED_EQUIVALENCES, source: "fixtures" });
  }
  try {
    await ensureSeeded(db);
    const rows = await db.select().from(equivalenceEdges);
    return NextResponse.json({ items: rows.map(rowToEdge), source: "db" });
  } catch (err) {
    console.warn("[/api/equivalences] DB read failed, using fixtures", err);
    return NextResponse.json({ items: SEED_EQUIVALENCES, source: "fixtures" });
  }
}

export async function POST(req: Request) {
  const auth = await getCuratorSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  let payload: z.infer<typeof CreateBody>;
  try {
    payload = CreateBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const id = nanoid(8);
  const now = new Date();
  try {
    await db.insert(equivalenceEdges).values({
      id,
      from: payload.from,
      to: payload.to,
      kind: payload.kind,
      weight: Math.round(payload.weight * 100),
      note: payload.note ?? null,
      updatedAt: now,
      updatedBy: auth.session.userId,
    });
    const edge = {
      id,
      from: payload.from,
      to: payload.to,
      kind: payload.kind,
      weight: payload.weight,
      note: payload.note,
    };
    await logRevision(db, id, "create", null, auth.session.userId);
    return NextResponse.json({ edge });
  } catch (err) {
    console.error("[/api/equivalences] POST failed", err);
    return NextResponse.json({ error: "Write failed" }, { status: 500 });
  }
}
