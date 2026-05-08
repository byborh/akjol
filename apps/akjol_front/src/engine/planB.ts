import type { Passport, Program, ProgramLevel } from "../types";
import { PROGRAMS } from "../data/programs";
import { computeFeasibility } from "./feasibility";
import type { EquivalenceEdge } from "../data/equivalences";

export type FailureBranch = {
  trigger: string;
  alternatives: Alternative[];
};

export type Alternative = {
  programId: string;
  title: string;
  schoolName: string;
  city: string;
  countryRef: string;
  durationYears: number;
  costPerYear: number;
  probability: number;
  rationale: string;
};

const SAME_LEVEL: Record<ProgramLevel, ProgramLevel[]> = {
  lycee: ["lycee", "certif"],
  bachelor: ["bachelor", "licence", "licence_pro"],
  licence: ["licence", "bachelor", "licence_pro"],
  licence_pro: ["licence_pro", "bachelor", "licence"],
  master: ["master", "ecole_inge"],
  ecole_inge: ["ecole_inge", "master"],
  doctorat: ["doctorat"],
  certif: ["certif"],
};

function similarPrograms(
  target: Program,
  passport: Passport,
  max = 3,
  edges?: EquivalenceEdge[],
): Alternative[] {
  const wantedLevels = SAME_LEVEL[target.level] ?? [target.level];
  const candidates = PROGRAMS.filter(
    (p) =>
      p.id !== target.id &&
      wantedLevels.includes(p.level) &&
      p.domains.some((d) => target.domains.includes(d)),
  );

  const scored = candidates
    .map((p) => {
      const f = computeFeasibility(passport, p, edges);
      return { p, f };
    })
    .filter((x) => x.f.status !== "closed")
    .sort((a, b) => b.f.probability.value - a.f.probability.value)
    .slice(0, max);

  return scored.map(({ p, f }) => ({
    programId: p.id,
    title: p.title,
    schoolName: p.school.name,
    city: p.school.city,
    countryRef: p.countryRef,
    durationYears: p.durationYears,
    costPerYear: p.costPerYear,
    probability: f.probability.value,
    rationale: rationale(target, p),
  }));
}

function rationale(target: Program, alt: Program): string {
  if (alt.school.name !== target.school.name) {
    return `Même domaine, école alternative à ${alt.school.city}.`;
  }
  if (alt.workStudy && !target.workStudy) {
    return "Voie alternance — souvent plus accessible côté admission.";
  }
  if (alt.costPerYear < target.costPerYear) {
    return "Programme moins cher dans le même domaine.";
  }
  return "Domaine équivalent, candidature parallèle possible.";
}

export function planBFor(
  program: Program,
  passport: Passport,
  edges?: EquivalenceEdge[],
): FailureBranch[] {
  const branches: FailureBranch[] = [];

  if (program.minGrade) {
    branches.push({
      trigger: `Si tu n'atteins pas ${program.minGrade.value}/${program.minGrade.scaleMax} de moyenne`,
      alternatives: similarPrograms(program, passport, 3, edges),
    });
  }

  if (program.recommendsCertificate) {
    branches.push({
      trigger: `Si tu n'obtiens pas ${program.recommendsCertificate.code} ≥ ${program.recommendsCertificate.minScore}`,
      alternatives: similarPrograms(program, passport, 2, edges).filter((a) => {
        const p = PROGRAMS.find((pp) => pp.id === a.programId);
        return !p?.recommendsCertificate;
      }),
    });
  }

  if (program.optionalSteps && program.optionalSteps.length > 0) {
    branches.push({
      trigger: `Si tu n'es pas convoqué·e à : ${program.optionalSteps.join(", ").toLowerCase()}`,
      alternatives: similarPrograms(program, passport, 2, edges),
    });
  }

  branches.push({
    trigger: "Si tu n'es pas admis·e dans ce programme",
    alternatives: similarPrograms(program, passport, 3, edges),
  });

  return branches.filter((b) => b.alternatives.length > 0);
}
