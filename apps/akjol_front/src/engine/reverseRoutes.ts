import type { Passport, Program } from "../types";
import { PROGRAMS } from "../data/programs";
import { JOBS, type Job } from "../data/jobs";
import { computeFeasibility } from "./feasibility";

export type RouteStep = {
  programId: string;
  title: string;
  schoolName: string;
  city: string;
  countryRef: string;
  durationYears: number;
  costPerYear: number;
  feasibilityProbability: number;
  resultingDiplomaCode: string;
};

export type Trajectory = {
  jobId: string;
  jobLabel: string;
  steps: RouteStep[];
  totalYears: number;
  totalCost: number;
  joinedProbability: number;
  countries: string[];
  rationale: string;
};

const MAX_DEPTH = 5;
const MAX_RESULTS = 5;

function programLeadsToJob(program: Program, job: Job): boolean {
  const programJobs = program.outcomesJobs.map((s) => s.toLowerCase());
  const jobLabel = job.label.toLowerCase();
  if (programJobs.some((j) => j.includes(jobLabel) || jobLabel.includes(j))) return true;
  return programJobs.some((j) =>
    job.matchKeywords.some((k) => j.includes(k.toLowerCase())),
  );
}

function programsAcceptingDiploma(diplomaCode: string): Program[] {
  return PROGRAMS.filter((p) => p.acceptedDiplomas.includes(diplomaCode));
}

function virtualPassportAt(passport: Passport, lastDiplomaCode: string, lastCountry: string): Passport {
  return {
    ...passport,
    currentDiploma: passport.currentDiploma
      ? { ...passport.currentDiploma, code: lastDiplomaCode, countryRef: lastCountry }
      : null,
  };
}

export function reverseRoutes(passport: Passport, jobId: string): Trajectory[] {
  const target = JOBS.find((j) => j.id === jobId);
  if (!target) return [];
  const startCode = passport.currentDiploma?.code;
  if (!startCode) return [];
  const startCountry = passport.currentDiploma?.countryRef ?? passport.origin.country ?? "FR";

  const found: Trajectory[] = [];

  function visit(
    fromCode: string,
    fromCountry: string,
    chain: RouteStep[],
    seen: Set<string>,
  ) {
    if (chain.length >= MAX_DEPTH) return;
    const next = programsAcceptingDiploma(fromCode);
    for (const p of next) {
      if (seen.has(p.id)) continue;
      const virtPassport = chain.length === 0
        ? passport
        : virtualPassportAt(passport, fromCode, fromCountry);
      const f = computeFeasibility(virtPassport, p);
      if (f.status === "closed") continue;
      const step: RouteStep = {
        programId: p.id,
        title: p.title,
        schoolName: p.school.name,
        city: p.school.city,
        countryRef: p.countryRef,
        durationYears: p.durationYears,
        costPerYear: p.costPerYear,
        feasibilityProbability: f.probability.value,
        resultingDiplomaCode: p.resultingDiplomaCode,
      };
      const newChain = [...chain, step];
      if (programLeadsToJob(p, target as Job)) {
        const totalYears = newChain.reduce((s, x) => s + x.durationYears, 0);
        const totalCost = newChain.reduce((s, x) => s + x.costPerYear * x.durationYears, 0);
        const joinedProbability = newChain.reduce((s, x) => s * (x.feasibilityProbability / 100), 1);
        const countries = Array.from(new Set(newChain.map((x) => x.countryRef)));
        const t = target as Job;
        found.push({
          jobId: t.id,
          jobLabel: t.label,
          steps: newChain,
          totalYears,
          totalCost,
          joinedProbability,
          countries,
          rationale: rationaleFor(newChain, t),
        });
      } else {
        const nextSeen = new Set(seen);
        nextSeen.add(p.id);
        visit(p.resultingDiplomaCode, p.countryRef, newChain, nextSeen);
      }
    }
  }

  visit(startCode, startCountry, [], new Set());

  found.sort((a, b) => {
    if (a.steps.length !== b.steps.length) return a.steps.length - b.steps.length;
    return b.joinedProbability - a.joinedProbability;
  });

  const seenSig = new Set<string>();
  const dedup: Trajectory[] = [];
  for (const t of found) {
    const sig = t.steps.map((s) => s.programId).join("→");
    if (seenSig.has(sig)) continue;
    seenSig.add(sig);
    dedup.push(t);
    if (dedup.length >= MAX_RESULTS) break;
  }
  return dedup;
}

function rationaleFor(chain: RouteStep[], job: Job): string {
  const countries = Array.from(new Set(chain.map((s) => s.countryRef)));
  if (chain.length === 1) {
    return `Direct vers ${job.label} via ${chain[0].title}.`;
  }
  if (countries.length === 1) {
    return `Parcours en ${chain.length} étapes en ${countries[0]} jusqu'à ${job.label}.`;
  }
  return `Parcours international (${countries.join(", ")}) en ${chain.length} étapes vers ${job.label}.`;
}
