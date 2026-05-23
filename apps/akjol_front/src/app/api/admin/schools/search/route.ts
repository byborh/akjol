import { NextResponse } from "next/server";
import { schools } from "@akjol/db";
import { sql } from "drizzle-orm";
import { getDb } from "../../../../../lib/db";
import { requireCurator } from "../../../../../lib/admin/auth";

/**
 * GET /api/admin/schools/search?q=xxx
 *
 * Recherche dans la table `schools` (5 843 lignes : Annuaire Éducation + MESR).
 * Match case-insensitive sur name + city. Limite 30 résultats.
 * Sert l'autocomplete du formulaire de curation (critère #3).
 */
export async function GET(req: Request) {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const pattern = `%${q}%`;
  const rows = await db
    .select({
      uai: schools.uai,
      name: schools.name,
      city: schools.city,
      postalCode: schools.postalCode,
      region: schools.region,
      type: schools.type,
      websiteUrl: schools.websiteUrl,
    })
    .from(schools)
    .where(
      sql`LOWER(${schools.name}) LIKE LOWER(${pattern}) OR LOWER(${schools.city}) LIKE LOWER(${pattern})`,
    )
    .limit(30);

  return NextResponse.json({ items: rows });
}
