import { NextResponse } from "next/server";
import {
  deleteProgramFromAdmin,
  getProgramForAdminById,
  updateProgramFromAdmin,
} from "@akjol/db";
import { getDb } from "../../../../../lib/db";
import { requireCurator } from "../../../../../lib/admin/auth";
import { ProgramFormSchema } from "../../../../../lib/admin/program-schema";

/**
 * GET    /api/admin/programs/[id]   — fiche complète (curated ou raw) pour l'edit
 * PATCH  /api/admin/programs/[id]   — met à jour (valide Zod)
 * DELETE /api/admin/programs/[id]   — supprime (curated uniquement)
 */

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const program = await getProgramForAdminById(db, id);
  if (!program) return NextResponse.json({ error: "Not found", id }, { status: 404 });
  return NextResponse.json(program);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireCurator(req);
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
  const parsed = ProgramFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const updated = await updateProgramFromAdmin(db, id, parsed.data);
    if (!updated) return NextResponse.json({ error: "Not found", id }, { status: 404 });
    return NextResponse.json({ program: updated });
  } catch (err) {
    console.error(`[PATCH /api/admin/programs/${id}]`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal error", message: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireCurator(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const deleted = await deleteProgramFromAdmin(db, id);
  if (!deleted) return NextResponse.json({ error: "Not found", id }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
