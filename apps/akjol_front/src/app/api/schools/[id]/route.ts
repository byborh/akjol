import { NextResponse } from "next/server";
import { getAllSchools } from "../../../../data/schools";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const school = getAllSchools().find((s) => s.id === id);
  if (!school) {
    return NextResponse.json({ error: "School not found", id }, { status: 404 });
  }
  return NextResponse.json(school, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
}
