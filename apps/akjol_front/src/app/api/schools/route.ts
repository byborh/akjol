import { NextResponse } from "next/server";
import { getAllSchools } from "../../../data/schools";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const country = url.searchParams.get("country");
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(5, Number(url.searchParams.get("pageSize") ?? "20")));

  const all = getAllSchools();
  const filtered = all.filter((s) => {
    if (city && s.city.toLowerCase() !== city.toLowerCase()) return false;
    if (country && s.countryRef !== country) return false;
    if (search) {
      const hay = [s.name, s.city, s.description ?? ""].join(" ").toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize).map((s) => ({
    ...s,
    programIds: s.programs.map((p) => p.id),
    programs: undefined,
  }));

  return NextResponse.json(
    { total, page, pageSize, items },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
  );
}
