import { NextResponse } from "next/server";
import { getAllJobs } from "@akjol/db";
import { getDb } from "../../../../lib/db";
import { requireCurator } from "../../../../lib/admin/auth";

/** GET /api/admin/jobs — liste de tous les jobs pour l'autocomplete. */
export async function GET() {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const items = await getAllJobs(db);
  return NextResponse.json({ items });
}
