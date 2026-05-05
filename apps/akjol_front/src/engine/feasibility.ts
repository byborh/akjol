import type {
  CEFR,
  Condition,
  FeasibilityResult,
  Passport,
  Program,
} from "../types";

const CEFR_RANK: Record<CEFR, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

function languageMet(passport: Passport, program: Program): {
  met: boolean;
  detail: string;
  needed: CEFR;
  current?: CEFR;
} {
  const skill = passport.origin.languages.find(
    (l) => l.code === program.language.code,
  );
  const needed = program.language.minLevel;
  if (!skill) {
    return { met: false, detail: `Aucune compétence déclarée en ${program.language.code.toUpperCase()}`, needed };
  }
  const ok = CEFR_RANK[skill.level] >= CEFR_RANK[needed];
  return {
    met: ok,
    detail: ok
      ? `${program.language.code.toUpperCase()} ${skill.level} ≥ ${needed} requis`
      : `${program.language.code.toUpperCase()} ${skill.level} (${needed} requis)`,
    needed,
    current: skill.level,
  };
}

function diplomaMet(passport: Passport, program: Program) {
  const cur = passport.currentDiploma;
  if (!cur) return { met: false, detail: "Aucun diplôme renseigné" };
  const ok = program.acceptedDiplomas.includes(cur.code);
  return {
    met: ok,
    detail: ok
      ? `${cur.label} reconnu pour ce programme`
      : `${cur.label} non listé dans les diplômes acceptés`,
  };
}

function gradeMet(passport: Passport, program: Program) {
  if (!program.minGrade) return { applies: false as const };
  const cur = passport.currentDiploma;
  if (!cur || !cur.grade) {
    return {
      applies: true as const,
      met: false,
      assumed: true,
      detail: `Moyenne ≥ ${program.minGrade.value}/${program.minGrade.scaleMax} requise (non déclarée)`,
    };
  }
  const normalizedHave = (cur.grade.value / cur.grade.scaleMax) * program.minGrade.scaleMax;
  const ok = normalizedHave >= program.minGrade.value;
  return {
    applies: true as const,
    met: ok,
    assumed: false,
    detail: ok
      ? `Moyenne ${cur.grade.value}/${cur.grade.scaleMax} ≥ ${program.minGrade.value}/${program.minGrade.scaleMax}`
      : `Moyenne ${cur.grade.value}/${cur.grade.scaleMax} < ${program.minGrade.value}/${program.minGrade.scaleMax} requis`,
  };
}

function budgetMet(passport: Passport, program: Program) {
  const cap = passport.constraints.maxBudgetPerYear;
  if (cap == null) return { applies: false as const };
  const ok = program.costPerYear <= cap;
  return {
    applies: true as const,
    met: ok,
    detail: ok
      ? `${program.costPerYear} €/an ≤ ${cap} €/an déclarés`
      : `${program.costPerYear} €/an > ${cap} €/an déclarés`,
  };
}

function durationMet(passport: Passport, program: Program) {
  const cap = passport.constraints.maxDurationYears;
  if (cap == null) return { applies: false as const };
  const ok = program.durationYears <= cap;
  return {
    applies: true as const,
    met: ok,
    detail: ok
      ? `${program.durationYears} an(s) ≤ ${cap} an(s) max`
      : `${program.durationYears} an(s) > ${cap} an(s) max déclarés`,
  };
}

function workStudyMet(passport: Passport, program: Program) {
  if (!passport.constraints.workStudyPreferred) return { applies: false as const };
  return {
    applies: true as const,
    met: program.workStudy,
    detail: program.workStudy ? "Alternance proposée" : "Pas d'alternance",
  };
}

export function computeFeasibility(passport: Passport, program: Program): FeasibilityResult {
  const conditionsMet: Condition[] = [];
  const conditionsUnmet: Condition[] = [];

  const dip = diplomaMet(passport, program);
  (dip.met ? conditionsMet : conditionsUnmet).push({
    label: dip.met ? "Diplôme reconnu" : "Diplôme non reconnu",
    met: dip.met,
    detail: dip.detail,
  });

  const lang = languageMet(passport, program);
  (lang.met ? conditionsMet : conditionsUnmet).push({
    label: lang.met ? "Niveau de langue" : `${program.language.code.toUpperCase()} ${lang.needed} requis`,
    met: lang.met,
    detail: lang.detail,
  });

  const budget = budgetMet(passport, program);
  if (budget.applies) {
    (budget.met ? conditionsMet : conditionsUnmet).push({
      label: budget.met ? "Budget compatible" : "Budget dépassé",
      met: budget.met,
      detail: budget.detail,
    });
  }

  const duration = durationMet(passport, program);
  if (duration.applies) {
    (duration.met ? conditionsMet : conditionsUnmet).push({
      label: duration.met ? "Durée compatible" : "Durée dépassée",
      met: duration.met,
      detail: duration.detail,
    });
  }

  const ws = workStudyMet(passport, program);
  if (ws.applies && ws.met) {
    conditionsMet.push({ label: "Alternance disponible", met: true, detail: ws.detail });
  }

  const grade = gradeMet(passport, program);
  const assumptions: { label: string }[] = [];
  if (grade.applies) {
    if (grade.assumed) {
      assumptions.push({
        label: `AkJol suppose que tu atteindras ≥ ${program.minGrade?.value}/${program.minGrade?.scaleMax} de moyenne (non déclaré)`,
      });
    } else if (grade.met) {
      conditionsMet.push({ label: "Moyenne suffisante", met: true, detail: grade.detail });
    } else {
      conditionsUnmet.push({
        label: "Moyenne insuffisante",
        met: false,
        detail: grade.detail,
      });
    }
  }

  if (passport.currentDiploma?.status === "in_progress") {
    assumptions.push({
      label: `AkJol suppose que ton ${passport.currentDiploma.label} sera validé en ${passport.currentDiploma.yearExpected ?? "fin d'année"}`,
    });
  }

  if (program.optionalSteps && program.optionalSteps.length) {
    assumptions.push({
      label: `Suppose un avis favorable sur : ${program.optionalSteps.join(", ").toLowerCase()}`,
    });
  }

  assumptions.push({
    label: "AkJol suppose que la sélection 2026-2027 ressemble aux promotions 2024-2025",
  });

  const toMaximize: { label: string; gainPct?: number; detail?: string }[] = [];
  if (program.recommendsCertificate) {
    toMaximize.push({
      label: `Passe le ${program.recommendsCertificate.code} ≥ ${program.recommendsCertificate.minScore}`,
      gainPct: program.recommendsCertificate.gainPct,
      detail: "≈ 3 mois de prépa ciblée",
    });
  }
  if (program.recommendsInternshipWeeks) {
    toMaximize.push({
      label: `Stage ${program.recommendsInternshipWeeks} semaines minimum dans le domaine`,
      detail: "Renforce ta candidature et ta lettre de motivation",
    });
  }
  toMaximize.push({
    label: "Travaille la lettre de motivation orientée projet pro",
    detail: "Spécifique au programme et à l'école visée",
  });

  const blockers: { label: string }[] = [];
  let status: FeasibilityResult["status"] = "open";
  let missingStep: string | undefined;

  if (!dip.met) {
    status = "closed";
    blockers.push({ label: "Diplôme actuel non reconnu pour ce programme" });
  }
  if (!lang.met) {
    if (status !== "closed") {
      status = "open_with_step";
      missingStep = `Atteindre ${program.language.code.toUpperCase()} ${lang.needed}`;
    } else {
      blockers.push({ label: `Langue ${program.language.code.toUpperCase()} insuffisante` });
    }
  }
  if (grade.applies && !grade.assumed && !grade.met) {
    status = "closed";
    blockers.push({ label: "Moyenne en-dessous du seuil requis" });
  }
  if (budget.applies && !budget.met) {
    status = "closed";
    blockers.push({ label: "Coût annuel au-dessus du budget déclaré" });
  }

  let probability = 0.5;
  if (status === "closed") probability = 0.05;
  else if (status === "open_with_step") probability = 0.55;
  else {
    probability = 0.6;
    if (grade.applies && grade.met) probability += 0.15;
    if (lang.met && lang.current && CEFR_RANK[lang.current] > CEFR_RANK[lang.needed]) probability += 0.05;
    if (program.workStudy && passport.constraints.workStudyPreferred) probability += 0.05;
    if (passport.aspiration.domains.some((d) => program.domains.includes(d))) probability += 0.05;
  }
  probability = Math.max(0.02, Math.min(0.97, probability));

  const ci = status === "closed" ? 3 : status === "open_with_step" ? 12 : 8;
  const basedOn =
    program.id === "lp-asur-iut-paris" ? 124 :
    program.id === "ecole-inge-ats-cnam" ? 56 :
    program.id === "manchester-foundation-cs" ? 412 :
    72;

  return {
    status,
    conditions: { met: conditionsMet, unmet: conditionsUnmet },
    assumptions,
    toMaximize,
    probability: { value: Math.round(probability * 100), ci, basedOn },
    blockers,
    missingStep,
  };
}
