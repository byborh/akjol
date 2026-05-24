import { NextResponse } from "next/server";
import { deleteJobFromAdmin, getJobById, updateJobFromAdmin } from "@akjol/db";
import { getDb } from "../../../../../lib/db";
import { requireCurator } from "../../../../../lib/admin/auth";
import { JobFormSchema } from "../../../../../lib/admin/job-schema";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const job = await getJobById(db, id);
  if (!job) return NextResponse.json({ error: "Not found", id }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
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
  const updated = await updateJobFromAdmin(db, id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found", id }, { status: 404 });
  return NextResponse.json({ job: updated });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const deleted = await deleteJobFromAdmin(db, id);
  if (!deleted) return NextResponse.json({ error: "Not found", id }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
