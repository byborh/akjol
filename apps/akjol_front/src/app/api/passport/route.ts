import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { userPassports, userPlans, userParcours, userDocuments } from "@akjol/db";
import { decodeSession, SESSION_COOKIE } from "../../../lib/session";
import { getDb } from "../../../lib/db";

/**
 * GET → renvoie tous les blobs du user connecté + leurs updatedAt
 * PUT → upsert les blobs envoyés (partiel : seuls les blobs présents sont écrits)
 *
 * Stratégie : on stocke 4 blobs JSON séparés (passport, plan, parcours,
 * documents) plutôt qu'un méga-blob unique. Comme ça la sync débouncée du front
 * peut ne pousser que ce qui a changé.
 *
 * Auth obligatoire (401 sinon). Si DB indispo → 503.
 */

async function getSession() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE.name)?.value;
  return decodeSession(token);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    const [pp, pl, pa, do_] = await Promise.all([
      db.select().from(userPassports).where(eq(userPassports.userId, session.userId)).limit(1),
      db.select().from(userPlans).where(eq(userPlans.userId, session.userId)).limit(1),
      db.select().from(userParcours).where(eq(userParcours.userId, session.userId)).limit(1),
      db.select().from(userDocuments).where(eq(userDocuments.userId, session.userId)).limit(1),
    ]);

    return NextResponse.json({
      passport: pp[0]
        ? { data: JSON.parse(pp[0].passportJson), updatedAt: pp[0].updatedAt.toISOString() }
        : null,
      plan: pl[0]
        ? { data: JSON.parse(pl[0].planJson), updatedAt: pl[0].updatedAt.toISOString() }
        : null,
      parcours: pa[0]
        ? { data: JSON.parse(pa[0].parcoursJson), updatedAt: pa[0].updatedAt.toISOString() }
        : null,
      documents: do_[0]
        ? { data: JSON.parse(do_[0].documentsJson), updatedAt: do_[0].updatedAt.toISOString() }
        : null,
    });
  } catch (err) {
    console.error("[/api/passport] GET failed", err);
    return NextResponse.json({ error: "Read failed" }, { status: 500 });
  }
}

const Body = z.object({
  passport: z.unknown().optional(),
  plan: z.unknown().optional(),
  parcours: z.unknown().optional(),
  documents: z.unknown().optional(),
});

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const now = new Date();
  try {
    if (payload.passport !== undefined) {
      await db
        .insert(userPassports)
        .values({
          userId: session.userId,
          passportJson: JSON.stringify(payload.passport),
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userPassports.userId,
          set: { passportJson: JSON.stringify(payload.passport), updatedAt: now },
        });
    }
    if (payload.plan !== undefined) {
      await db
        .insert(userPlans)
        .values({
          userId: session.userId,
          planJson: JSON.stringify(payload.plan),
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userPlans.userId,
          set: { planJson: JSON.stringify(payload.plan), updatedAt: now },
        });
    }
    if (payload.parcours !== undefined) {
      await db
        .insert(userParcours)
        .values({
          userId: session.userId,
          parcoursJson: JSON.stringify(payload.parcours),
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userParcours.userId,
          set: { parcoursJson: JSON.stringify(payload.parcours), updatedAt: now },
        });
    }
    if (payload.documents !== undefined) {
      await db
        .insert(userDocuments)
        .values({
          userId: session.userId,
          documentsJson: JSON.stringify(payload.documents),
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userDocuments.userId,
          set: { documentsJson: JSON.stringify(payload.documents), updatedAt: now },
        });
    }
    return NextResponse.json({ ok: true, updatedAt: now.toISOString() });
  } catch (err) {
    console.error("[/api/passport] PUT failed", err);
    return NextResponse.json({ error: "Write failed" }, { status: 500 });
  }
}
