import { NextResponse } from "next/server";
import { getAllPrograms } from "@akjol/db";
import { getAllSchools, getSchoolsFrom, type SchoolEntry } from "../../../data/schools";
import { getDb } from "../../../lib/db";
import type { Program } from "../../../types";

/**
 * `/api/schools` — liste les écoles dérivées des programs curés.
 *
 * Stratégie : on lit les programs depuis la DB (filtre is_curated=true via le
 * repo) et on agrège par `slugify(name, city)` pour obtenir les écoles + leur
 * liste de programs dispensés. Fallback fixtures si DB indispo.
 */
async function loadSchools(): Promise<SchoolEntry[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = (await getAllPrograms(db)) as unknown as Program[];
      if (rows.length > 0) return getSchoolsFrom(rows);
    } catch (err) {
      console.warn("[/api/schools] DB read failed, falling back to fixtures", err);
    }
  }
  return getAllSchools();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const country = url.searchParams.get("country");
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(5, Number(url.searchParams.get("pageSize") ?? "20")));

  const all = await loadSchools();
  const filtered = all.filter((s) => {
    if (city && s.city.toLowerCase() !== city.toLowerCase()) return false;
    if (country && s.countryRef !== country) return false;
    if (search) {
      const hay = [s.name, s.city, s.description ?? ""].join(" ").toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize).map((s) => ({
    ...s,
    programIds: s.programs.map((p) => p.id),
    programs: undefined,
  }));

  return NextResponse.json(
    { total, page, pageSize, items },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
  );
}
