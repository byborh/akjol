import { eq } from "drizzle-orm";
import type { Db } from "./index.js";
import { programs, jobs, type ProgramRow, type JobRow } from "./schema.js";

/**
 * Fonctions de lecture utilisées par les routes API du front.
 *
 * Les colonnes JSON (acceptedDiplomas, salary, etc.) sont stockées en text.
 * On les re-parse ici et on retourne des shapes qui matchent les types front
 * (Program, Job) — pour que les routes /api soient drop-in remplaceables.
 */

function parseList<T = string>(s: string | null | undefined): T[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

function parseObj<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export type ProgramDto = {
  id: string;
  countryRef: string;
  formationCode: string;
  formationLabel: string;
  school: {
    name: string;
    city: string;
    type?: string;
    websiteUrl?: string;
  };
  title: string;
  level: string;
  durationYears: number;
  language: { code: string; minLevel: string };
  costPerYear: number;
  admissionPlatform: string;
  acceptedDiplomas: string[];
  minGrade?: { value: number; scaleMax: number };
  workStudy: boolean;
  domains: string[];
  outcomesJobs: string[];
  outcomesNextLevels: string[];
  internationallyRecognizedIn: string[];
  applicationOpens?: string;
  applicationCloses?: string;
  applicationFee?: number;
  documents: string[];
  optionalSteps?: string[];
  description: string;
  recommendsCertificate?: { code: string; minScore: number; gainPct: number };
  recommendsInternshipWeeks?: number;
  resultingDiplomaCode: string;
  resultingDiplomaLabel: string;
};

export type JobDto = {
  id: string;
  code: string;
  label: string;
  domains: string[];
  salary: { country: string; median: number; currency: string }[];
  regionsTopHiring: string[];
  dailyTasks: string[];
  riskAutomation: number;
  requiresDiplomas: string[];
  matchKeywords: string[];
};

function rowToProgram(r: ProgramRow): ProgramDto {
  return {
    id: r.id,
    countryRef: r.countryRef,
    formationCode: r.formationCode,
    formationLabel: r.formationLabel,
    school: {
      name: r.schoolName,
      city: r.schoolCity,
      type: r.schoolType ?? undefined,
      websiteUrl: r.schoolWebsiteUrl ?? undefined,
    },
    title: r.title,
    level: r.level,
    durationYears: r.durationYears,
    language: { code: r.languageCode, minLevel: r.languageMinLevel },
    costPerYear: r.costPerYear,
    admissionPlatform: r.admissionPlatform,
    acceptedDiplomas: parseList<string>(r.acceptedDiplomas),
    minGrade: parseObj<{ value: number; scaleMax: number }>(r.minGrade) ?? undefined,
    workStudy: r.workStudy,
    domains: parseList<string>(r.domains),
    outcomesJobs: parseList<string>(r.outcomesJobs),
    outcomesNextLevels: parseList<string>(r.outcomesNextLevels),
    internationallyRecognizedIn: parseList<string>(r.internationallyRecognizedIn),
    applicationOpens: r.applicationOpens ?? undefined,
    applicationCloses: r.applicationCloses ?? undefined,
    applicationFee: r.applicationFee ?? undefined,
    documents: parseList<string>(r.documents),
    optionalSteps: r.optionalSteps ? parseList<string>(r.optionalSteps) : undefined,
    description: r.description,
    recommendsCertificate:
      parseObj<{ code: string; minScore: number; gainPct: number }>(r.recommendsCertificate) ??
      undefined,
    recommendsInternshipWeeks: r.recommendsInternshipWeeks ?? undefined,
    resultingDiplomaCode: r.resultingDiplomaCode,
    resultingDiplomaLabel: r.resultingDiplomaLabel,
  };
}

function rowToJob(r: JobRow): JobDto {
  return {
    id: r.id,
    code: r.code,
    label: r.label,
    domains: parseList<string>(r.domains),
    salary: parseList<{ country: string; median: number; currency: string }>(r.salary),
    regionsTopHiring: parseList<string>(r.regionsTopHiring),
    dailyTasks: parseList<string>(r.dailyTasks),
    riskAutomation: r.riskAutomation / 100,
    requiresDiplomas: parseList<string>(r.requiresDiplomas),
    matchKeywords: parseList<string>(r.matchKeywords),
  };
}

export async function getAllPrograms(db: Db): Promise<ProgramDto[]> {
  const rows = await db.select().from(programs).where(eq(programs.deprecated, false));
  return rows.map(rowToProgram);
}

export async function getProgramById(db: Db, id: string): Promise<ProgramDto | null> {
  const rows = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  return rows[0] ? rowToProgram(rows[0]) : null;
}

export async function countPrograms(db: Db): Promise<number> {
  const rows = await db.select().from(programs).limit(1);
  return rows.length;
}

export async function getAllJobs(db: Db): Promise<JobDto[]> {
  const rows = await db.select().from(jobs);
  return rows.map(rowToJob);
}

export async function getJobById(db: Db, id: string): Promise<JobDto | null> {
  const rows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return rows[0] ? rowToJob(rows[0]) : null;
}

export async function countJobs(db: Db): Promise<number> {
  const rows = await db.select().from(jobs).limit(1);
  return rows.length;
}
