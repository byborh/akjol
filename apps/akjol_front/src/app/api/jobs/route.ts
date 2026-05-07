import { NextResponse } from "next/server";
import { JOBS, searchJobs } from "../../../data/jobs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const items = search ? searchJobs(search) : JOBS;
  return NextResponse.json(
    { total: items.length, items },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } },
  );
}
