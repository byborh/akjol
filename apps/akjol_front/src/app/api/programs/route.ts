import { NextResponse } from "next/server";
import { PROGRAMS } from "../../../data/programs";
import type { ProgramLevel } from "../../../types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country");
  const level = url.searchParams.get("level") as ProgramLevel | null;
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(5, Number(url.searchParams.get("pageSize") ?? "20")));

  const filtered = PROGRAMS.filter((p) => {
    if (country && p.countryRef !== country) return false;
    if (level && p.level !== level) return false;
    if (search) {
      const hay = [p.title, p.school.name, p.school.city, p.description, ...p.outcomesJobs, ...p.domains]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize);

  return NextResponse.json(
    { total, page, pageSize, items },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
