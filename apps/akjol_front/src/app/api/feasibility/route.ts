import { NextResponse } from "next/server";
import { z } from "zod";
import { PROGRAMS, findProgram } from "../../../data/programs";
import { computeFeasibility } from "../../../engine/feasibility";
import type { Passport } from "../../../types";

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

export async function POST(req: Request) {
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
  const targets =
    programIds && programIds.length > 0
      ? programIds.map(findProgram).filter((p): p is NonNullable<ReturnType<typeof findProgram>> => Boolean(p))
      : PROGRAMS;

  const items = targets.map((p) => ({
    programId: p.id,
    feasibility: computeFeasibility(passport as Passport, p),
  }));

  return NextResponse.json({ count: items.length, items });
}
