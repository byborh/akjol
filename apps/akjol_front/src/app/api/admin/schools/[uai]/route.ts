import { NextResponse } from "next/server";
import { deleteSchoolFromAdmin, getSchoolByUai, updateSchoolFromAdmin } from "@akjol/db";
import { getDb } from "../../../../../lib/db";
import { requireCurator } from "../../../../../lib/admin/auth";
import { SchoolFormSchema } from "../../../../../lib/admin/school-schema";

export async function GET(_req: Request, ctx: { params: Promise<{ uai: string }> }) {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const { uai } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const school = await getSchoolByUai(db, uai);
  if (!school) return NextResponse.json({ error: "Not found", uai }, { status: 404 });
  return NextResponse.json(school);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ uai: string }> }) {
  const auth = await requireCurator(req);
  if (!auth.ok) return auth.response;
  const { uai } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = SchoolFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const updated = await updateSchoolFromAdmin(db, uai, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found", uai }, { status: 404 });
  return NextResponse.json({ school: updated });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ uai: string }> }) {
  const auth = await requireCurator(req);
  if (!auth.ok) return auth.response;
  const { uai } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const deleted = await deleteSchoolFromAdmin(db, uai);
  if (!deleted) return NextResponse.json({ error: "Not found", uai }, { status: 404 });
  return NextResponse.json({ ok: true, uai });
}
