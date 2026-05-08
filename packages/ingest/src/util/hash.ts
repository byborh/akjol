import { createHash } from "node:crypto";
import type { NormalizedProgram } from "../types.js";

/**
 * Hash stable du contenu d'un NormalizedProgram, hors champs de provenance.
 * Sert à la détection de diff : si le hash actuel = hash en DB → UNCHANGED,
 * sinon → UPDATE. Les clés sont triées pour rester stable entre runs.
 */
export function hashProgram(p: NormalizedProgram): string {
  const stable = {
    countryRef: p.countryRef,
    formationCode: p.formationCode,
    formationLabel: p.formationLabel,
    title: p.title,
    level: p.level,
    durationYears: p.durationYears,
    description: p.description,
    schoolName: p.schoolName,
    schoolCity: p.schoolCity,
    schoolType: p.schoolType,
    schoolWebsiteUrl: p.schoolWebsiteUrl,
    languageCode: p.languageCode,
    languageMinLevel: p.languageMinLevel,
    costPerYear: p.costPerYear,
    admissionPlatform: p.admissionPlatform,
    applicationOpens: p.applicationOpens,
    applicationCloses: p.applicationCloses,
    applicationFee: p.applicationFee,
    workStudy: p.workStudy,
    resultingDiplomaCode: p.resultingDiplomaCode,
    resultingDiplomaLabel: p.resultingDiplomaLabel,
    minGrade: p.minGrade,
    acceptedDiplomas: [...p.acceptedDiplomas].sort(),
    domains: [...p.domains].sort(),
    outcomesJobs: [...p.outcomesJobs].sort(),
    outcomesNextLevels: [...p.outcomesNextLevels].sort(),
    internationallyRecognizedIn: [...p.internationallyRecognizedIn].sort(),
    documents: [...p.documents].sort(),
    optionalSteps: p.optionalSteps ? [...p.optionalSteps].sort() : null,
    recommendsCertificate: p.recommendsCertificate,
    recommendsInternshipWeeks: p.recommendsInternshipWeeks,
  };
  return createHash("sha1").update(JSON.stringify(stable)).digest("hex");
}
