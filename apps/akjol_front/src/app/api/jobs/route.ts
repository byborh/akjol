import { NextResponse } from "next/server";
import { getAllJobs, type JobDto } from "@akjol/db";
import { getDb } from "../../../lib/db";
import { JOBS, searchJobs } from "../../../data/jobs";

const CACHE_HEADERS = { "Cache-Control": "public, max-age=300, s-maxage=600" };

async function loadJobs(): Promise<JobDto[]> {
  const db = getDb();
  if (!db) return JOBS as unknown as JobDto[];
  try {
    const rows = await getAllJobs(db);
    if (rows.length > 0) return rows;
  } catch (err) {
    console.warn("[/api/jobs] DB read failed, using fixtures", err);
  }
  return JOBS as unknown as JobDto[];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";

  const all = await loadJobs();
  if (!search) {
    return NextResponse.json({ total: all.length, items: all }, { headers: CACHE_HEADERS });
  }

  // searchJobs (data/jobs.ts) opère sur le type front. Avec le fallback ça
  // marche tel quel. Avec la DB, on duplique la logique simple ici.
  if (all === (JOBS as unknown as JobDto[])) {
    const items = searchJobs(search);
    return NextResponse.json({ total: items.length, items }, { headers: CACHE_HEADERS });
  }

  const q = search.toLowerCase();
  const items = all.filter((j) => {
    const hay = [j.label, j.code, ...(j.matchKeywords ?? []), ...(j.domains ?? [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
  return NextResponse.json({ total: items.length, items }, { headers: CACHE_HEADERS });
}
