import type { Passport, FeasibilityStatus, Program } from "../types";
import { computeFeasibility } from "./feasibility";

export type CountryStats = {
  best: FeasibilityStatus | "uncovered";
  open: number;
  amber: number;
  closed: number;
  total: number;
};

const RANK: Record<FeasibilityStatus, number> = {
  open: 0,
  open_with_step: 1,
  closed: 2,
  uncovered: 3,
};

export function statsByCountry(
  passport: Passport,
  programs: Program[],
): Map<string, CountryStats> {
  const out = new Map<string, CountryStats>();
  for (const p of programs) {
    const cur = out.get(p.countryRef) ?? {
      best: "uncovered" as FeasibilityStatus | "uncovered",
      open: 0,
      amber: 0,
      closed: 0,
      total: 0,
    };
    const f = computeFeasibility(passport, p);
    cur.total++;
    if (f.status === "open") cur.open++;
    else if (f.status === "open_with_step") cur.amber++;
    else if (f.status === "closed") cur.closed++;
    if (cur.best === "uncovered" || RANK[f.status] < RANK[cur.best as FeasibilityStatus]) {
      cur.best = f.status;
    }
    out.set(p.countryRef, cur);
  }
  return out;
}

export function colorForStatus(status: FeasibilityStatus | "uncovered"): string {
  switch (status) {
    case "open":
      return "#a3cf91";
    case "open_with_step":
      return "#e6c068";
    case "closed":
      return "#c98a8a";
    default:
      return "#d8d6cf";
  }
}
