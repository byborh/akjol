import { NextResponse } from "next/server";
import { createJobFromAdmin, getAllJobs } from "@akjol/db";
import { getDb } from "../../../../lib/db";
import { requireCurator } from "../../../../lib/admin/auth";
import { JobFormSchema } from "../../../../lib/admin/job-schema";

export async function GET() {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const items = await getAllJobs(db);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = await requireCurator(req);
  if (!auth.ok) return auth.response;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = JobFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const created = await createJobFromAdmin(db, parsed.data);
    return NextResponse.json({ job: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "Un job avec cet id existe déjà." }, { status: 409 });
    }
    console.error("[POST /api/admin/jobs]", err);
    return NextResponse.json({ error: "Internal error", message: msg }, { status: 500 });
  }
}
