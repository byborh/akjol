import { NextResponse } from "next/server";
import { findJob } from "../../../../data/jobs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const job = findJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found", id }, { status: 404 });
  }
  return NextResponse.json(job, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
