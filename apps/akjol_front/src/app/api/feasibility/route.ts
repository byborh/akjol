import { NextResponse } from "next/server";
import { z } from "zod";
import { getAllPrograms } from "@akjol/db";
import { PROGRAMS, findProgram } from "../../../data/programs";
import { computeFeasibility } from "../../../engine/feasibility";
import { getDb } from "../../../lib/db";
import { clientIp, rateLimitResponse } from "../../../lib/rate-limit";
import type { Passport, Program } from "../../../types";

const cefr = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const PassportSchema = z.object({
  origin: z.object({
    country: z.string(),
    languages: z.array(z.object({ code: z.string(), level: cefr })),
  }),
  currentDiploma: z
    .object({
      countryRef: z.string(),
      code: z.string(),
      label: z.string(),
      status: z.enum(["in_progress", "obtained"]),
      yearObtained: z.number().optional(),
      yearExpected: z.number().optional(),
      grade: z.object({ value: z.number(), scaleMax: z.number() }).optional(),
    })
    .nullable(),
  certificates: z.array(z.object({ code: z.string(), score: z.number() })),
  constraints: z.object({
    maxBudgetPerYear: z.number().optional(),
    maxDurationYears: z.number().optional(),
    needsScholarship: z.boolean().optional(),
    workStudyPreferred: z.boolean().optional(),
  }),
  aspiration: z.object({
    domains: z.array(z.string()),
    jobs: z.array(z.string()),
    openToSurprise: z.boolean(),
  }),
});

const Body = z.object({
  passport: PassportSchema,
  programIds: z.array(z.string()).optional(),
});

/**
 * Charge les programs depuis la DB (filtre is_curated=true automatique via le
 * repo). Fallback sur les fixtures bundle si la DB est indisponible ou vide —
 * garantit que la démo tourne même sans `pnpm db:push` et que les 24 fixtures
 * historiques restent un filet de sécurité tant qu'on n'a pas curé assez.
 */
async function loadPrograms(): Promise<Program[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await getAllPrograms(db);
      if (rows.length > 0) return rows as unknown as Program[];
    } catch (err) {
      console.warn("[/api/feasibility] DB read failed, falling back to fixtures", err);
    }
  }
  return PROGRAMS;
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(`feasibility:${clientIp(req)}`, 60, 60_000);
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { passport, programIds } = parsed.data;

  const all = await loadPrograms();
  let targets: Program[];
  if (programIds && programIds.length > 0) {
    const byId = new Map(all.map((p) => [p.id, p]));
    targets = programIds
      .map((id) => byId.get(id) ?? findProgram(id))
      .filter((p): p is Program => Boolean(p));
  } else {
    targets = all;
  }

  const items = targets.map((p) => ({
    programId: p.id,
    feasibility: computeFeasibility(passport as Passport, p),
  }));

  return NextResponse.json({ count: items.length, items });
}
