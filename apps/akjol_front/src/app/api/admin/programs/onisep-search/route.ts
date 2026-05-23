import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { programs } from "@akjol/db";
import { getDb } from "../../../../../lib/db";
import { requireCurator } from "../../../../../lib/admin/auth";

/**
 * GET /api/admin/programs/onisep-search?q=xxx
 *
 * Cherche les fiches ONISEP brutes (is_curated=false) dont le titre ou le
 * libellé formation contient la query (case-insensitive). Retourne 30 max.
 * Sert le critère #2 de l'Admin : pré-remplissage rapide d'un nouveau program
 * à partir du référentiel ONISEP déjà ingéré.
 */
export async function GET(req: Request) {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ items: [], note: "query too short" });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const pattern = `%${q}%`;
  const rows = await db
    .select({
      id: programs.id,
      title: programs.title,
      level: programs.level,
      formationCode: programs.formationCode,
      formationLabel: programs.formationLabel,
      sourceUrl: programs.sourceUrl,
      sourceId: programs.sourceId,
      durationYears: programs.durationYears,
      description: programs.description,
    })
    .from(programs)
    .where(
      and(
        eq(programs.source, "onisep"),
        eq(programs.isCurated, false),
        sql`LOWER(${programs.title}) LIKE LOWER(${pattern}) OR LOWER(${programs.formationLabel}) LIKE LOWER(${pattern})`,
      ),
    )
    .limit(30);

  return NextResponse.json({ items: rows });
}
