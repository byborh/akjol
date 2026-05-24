import { NextResponse } from "next/server";
import { createProgramFromAdmin, getAllProgramsForAdmin } from "@akjol/db";
import { getDb } from "../../../../lib/db";
import { requireCurator } from "../../../../lib/admin/auth";
import { ProgramFormSchema } from "../../../../lib/admin/program-schema";

/**
 * GET  /api/admin/programs        — liste tous les programs (curated + raw)
 * POST /api/admin/programs        — crée une nouvelle fiche (curated par défaut)
 */

export async function GET() {
  const auth = await requireCurator();
  if (!auth.ok) return auth.response;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const items = await getAllProgramsForAdmin(db);
  return NextResponse.json({ total: items.length, items });
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

  const parsed = ProgramFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const created = await createProgramFromAdmin(db, parsed.data);
    return NextResponse.json({ program: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE constraint")) {
      return NextResponse.json(
        { error: "Un program avec cet id (ou source+sourceId) existe déjà." },
        { status: 409 },
      );
    }
    console.error("[POST /api/admin/programs]", err);
    return NextResponse.json({ error: "Internal error", message: msg }, { status: 500 });
  }
}
