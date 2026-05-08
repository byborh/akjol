import { NextResponse } from "next/server";
import { getJobById } from "@akjol/db";
import { getDb } from "../../../../lib/db";
import { findJob } from "../../../../data/jobs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = getDb();

  if (db) {
    try {
      const dto = await getJobById(db, id);
      if (dto) {
        return NextResponse.json(dto, {
          headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
        });
      }
    } catch (err) {
      console.warn(`[/api/jobs/${id}] DB read failed, using fixtures`, err);
    }
  }

  const job = findJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found", id }, { status: 404 });
  }
  return NextResponse.json(job, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
