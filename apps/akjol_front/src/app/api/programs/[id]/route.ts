import { NextResponse } from "next/server";
import { getProgramById } from "@akjol/db";
import { getDb } from "../../../../lib/db";
import { findProgram } from "../../../../data/programs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = getDb();

  if (db) {
    try {
      const dto = await getProgramById(db, id);
      if (dto) {
        return NextResponse.json(dto, {
          headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
        });
      }
    } catch (err) {
      console.warn(`[/api/programs/${id}] DB read failed, using fixtures`, err);
    }
  }

  const program = findProgram(id);
  if (!program) {
    return NextResponse.json({ error: "Program not found", id }, { status: 404 });
  }
  return NextResponse.json(program, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
}
