import { NextResponse } from "next/server";
import { findProgram } from "../../../../data/programs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const program = findProgram(id);
  if (!program) {
    return NextResponse.json({ error: "Program not found", id }, { status: 404 });
  }
  return NextResponse.json(program, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
}
