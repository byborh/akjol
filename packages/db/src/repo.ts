import { and, eq } from "drizzle-orm";
import type { Db } from "./index";
import { programs, jobs, schools, type ProgramRow, type JobRow, type SchoolRow } from "./schema";

/**
 * Options communes aux lectures de la table `programs`.
 * Par défaut on n'expose que les fiches curées (`is_curated=true`) — les
 * ingestions raw (ONISEP, etc.) servent uniquement de pool de candidats pour
 * l'Admin et ne doivent jamais remonter aux utilisateurs.
 */
export type ProgramReadOptions = {
  /** Si true, inclut aussi les fiches `is_curated=false`. Réservé à l'Admin. */
  includeUncurated?: boolean;
};

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
  costCurrency: string;
  iscedLevel?: number;
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

/**
 * Niveau ISCED (UNESCO 0..8) dérivé du niveau national + durée. Rend comparables
 * les diplômes de pays différents : Licence FR (3 ans) et Bachelor CN (4 ans) = 6.
 */
export function levelToIsced(level: string, durationYears: number): number {
  switch (level) {
    case "lycee":
      return 3;
    case "certif":
      return 4;
    case "bachelor":
      return durationYears <= 2 ? 5 : 6; // BTS/DUT (bac+2)=5, BUT/Bachelor (bac+3)=6
    case "licence":
    case "licence_pro":
      return 6;
    case "master":
    case "ecole_inge":
      return 7;
    case "doctorat":
      return 8;
    default:
      return 6;
  }
}

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
    costCurrency: r.costCurrency,
    iscedLevel: r.iscedLevel ?? undefined,
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

export async function getAllPrograms(
  db: Db,
  opts: ProgramReadOptions = {},
): Promise<ProgramDto[]> {
  const where = opts.includeUncurated
    ? eq(programs.deprecated, false)
    : and(eq(programs.deprecated, false), eq(programs.isCurated, true));
  const rows = await db.select().from(programs).where(where);
  return rows.map(rowToProgram);
}

export async function getProgramById(
  db: Db,
  id: string,
  opts: ProgramReadOptions = {},
): Promise<ProgramDto | null> {
  const where = opts.includeUncurated
    ? eq(programs.id, id)
    : and(eq(programs.id, id), eq(programs.isCurated, true));
  const rows = await db.select().from(programs).where(where).limit(1);
  return rows[0] ? rowToProgram(rows[0]) : null;
}

export async function countPrograms(
  db: Db,
  opts: ProgramReadOptions = {},
): Promise<number> {
  const where = opts.includeUncurated ? undefined : eq(programs.isCurated, true);
  const q = db.select().from(programs);
  const rows = await (where ? q.where(where).limit(1) : q.limit(1));
  return rows.length;
}

/**
 * Vue Admin : tous les programs (curated + raw) avec les champs internes
 * `isCurated`, `source`, `sourceId`, `sourceUrl`, `lastIngestedAt`, `schoolUai`.
 * Ces champs sont volontairement absents de `ProgramDto` (vue publique).
 */
export type AdminProgramRow = ProgramDto & {
  isCurated: boolean;
  source: string;
  sourceId: string;
  sourceUrl: string | null;
  lastIngestedAt: Date;
  schoolUai: string | null;
};

function rowToAdminProgram(r: ProgramRow): AdminProgramRow {
  return {
    ...rowToProgram(r),
    isCurated: r.isCurated,
    source: r.source,
    sourceId: r.sourceId,
    sourceUrl: r.sourceUrl,
    lastIngestedAt: r.lastIngestedAt,
    schoolUai: r.schoolUai,
  };
}

export async function getAllProgramsForAdmin(db: Db): Promise<AdminProgramRow[]> {
  const rows = await db.select().from(programs).where(eq(programs.deprecated, false));
  return rows.map(rowToAdminProgram);
}

export async function getProgramForAdminById(
  db: Db,
  id: string,
): Promise<AdminProgramRow | null> {
  const rows = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  return rows[0] ? rowToAdminProgram(rows[0]) : null;
}

/**
 * Création / mise à jour d'un program via l'Admin.
 * Accepte un payload `AdminProgramInput` (champs métier + champs de provenance)
 * et écrit en DB en sérialisant les listes/objets en text JSON.
 */
export type AdminProgramInput = {
  id?: string;
  source: string;
  sourceId?: string;
  sourceUrl?: string;
  countryRef: string;
  formationCode: string;
  formationLabel: string;
  title: string;
  level: string;
  durationYears: number;
  description: string;
  schoolName: string;
  schoolCity: string;
  schoolType?: string;
  schoolWebsiteUrl?: string;
  schoolUai?: string;
  languageCode: string;
  languageMinLevel: string;
  costPerYear: number;
  costCurrency?: string;
  iscedLevel?: number;
  admissionPlatform: string;
  applicationOpens?: string;
  applicationCloses?: string;
  applicationFee?: number;
  workStudy: boolean;
  resultingDiplomaCode: string;
  resultingDiplomaLabel: string;
  minGrade?: { value: number; scaleMax: number };
  acceptedDiplomas: string[];
  domains: string[];
  outcomesJobs: string[];
  outcomesNextLevels: string[];
  internationallyRecognizedIn: string[];
  documents: string[];
  optionalSteps?: string[];
  recommendsCertificate?: { code: string; minScore: number; gainPct: number };
  recommendsInternshipWeeks?: number;
  isCurated: boolean;
};

function inputToRow(input: AdminProgramInput, fallbackId: string) {
  const finalId = input.id?.trim() || fallbackId;
  const contentHash = `manual-${finalId}-${Date.now()}`;
  return {
    id: finalId,
    source: input.source,
    sourceId: input.sourceId ?? finalId,
    sourceUrl: input.sourceUrl ?? null,
    contentHash,
    countryRef: input.countryRef,
    formationCode: input.formationCode,
    formationLabel: input.formationLabel,
    title: input.title,
    level: input.level,
    durationYears: input.durationYears,
    description: input.description,
    schoolName: input.schoolName,
    schoolCity: input.schoolCity,
    schoolType: input.schoolType ?? null,
    schoolWebsiteUrl: input.schoolWebsiteUrl ?? null,
    schoolUai: input.schoolUai ?? null,
    languageCode: input.languageCode,
    languageMinLevel: input.languageMinLevel,
    costPerYear: input.costPerYear,
    costCurrency: input.costCurrency ?? "EUR",
    iscedLevel: input.iscedLevel ?? levelToIsced(input.level, input.durationYears),
    admissionPlatform: input.admissionPlatform,
    applicationOpens: input.applicationOpens ?? null,
    applicationCloses: input.applicationCloses ?? null,
    applicationFee: input.applicationFee ?? null,
    workStudy: input.workStudy,
    resultingDiplomaCode: input.resultingDiplomaCode,
    resultingDiplomaLabel: input.resultingDiplomaLabel,
    minGrade: input.minGrade ? JSON.stringify(input.minGrade) : null,
    acceptedDiplomas: JSON.stringify(input.acceptedDiplomas),
    domains: JSON.stringify(input.domains),
    outcomesJobs: JSON.stringify(input.outcomesJobs),
    outcomesNextLevels: JSON.stringify(input.outcomesNextLevels),
    internationallyRecognizedIn: JSON.stringify(input.internationallyRecognizedIn),
    documents: JSON.stringify(input.documents),
    optionalSteps: input.optionalSteps ? JSON.stringify(input.optionalSteps) : null,
    recommendsCertificate: input.recommendsCertificate
      ? JSON.stringify(input.recommendsCertificate)
      : null,
    recommendsInternshipWeeks: input.recommendsInternshipWeeks ?? null,
    isCurated: input.isCurated,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export async function createProgramFromAdmin(
  db: Db,
  input: AdminProgramInput,
): Promise<AdminProgramRow> {
  // Si l'input vient du pré-remplissage ONISEP, il porte source+sourceId d'une
  // ligne raw existante. Plutôt qu'INSERT (UNIQUE constraint violation), on
  // UPDATE la raw pour la promouvoir en curée — c'est le mental model attendu :
  // « cette fiche ONISEP devient riche, elle reste la même ligne en DB ».
  if (input.sourceId) {
    const existing = await db
      .select()
      .from(programs)
      .where(and(eq(programs.source, input.source), eq(programs.sourceId, input.sourceId)))
      .limit(1);
    if (existing[0]) {
      const updated = await updateProgramFromAdmin(db, existing[0].id, input);
      if (!updated) throw new Error("createProgramFromAdmin: promote failed");
      return updated;
    }
  }
  const fallbackId = `manual-${slugify(input.title)}-${Date.now().toString(36)}`;
  const row = inputToRow(input, fallbackId);
  await db.insert(programs).values(row);
  const created = await getProgramForAdminById(db, row.id);
  if (!created) throw new Error("createProgramFromAdmin: row not found after insert");
  return created;
}

export async function updateProgramFromAdmin(
  db: Db,
  id: string,
  input: AdminProgramInput,
): Promise<AdminProgramRow | null> {
  const existing = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!existing[0]) return null;
  const row = inputToRow({ ...input, id }, id);
  // Conserve la provenance d'origine (source/sourceId) si non explicitement remplacée.
  await db
    .update(programs)
    .set({
      sourceUrl: row.sourceUrl,
      countryRef: row.countryRef,
      formationCode: row.formationCode,
      formationLabel: row.formationLabel,
      title: row.title,
      level: row.level,
      durationYears: row.durationYears,
      description: row.description,
      schoolName: row.schoolName,
      schoolCity: row.schoolCity,
      schoolType: row.schoolType,
      schoolWebsiteUrl: row.schoolWebsiteUrl,
      schoolUai: row.schoolUai,
      languageCode: row.languageCode,
      languageMinLevel: row.languageMinLevel,
      costPerYear: row.costPerYear,
      costCurrency: row.costCurrency,
      iscedLevel: row.iscedLevel,
      admissionPlatform: row.admissionPlatform,
      applicationOpens: row.applicationOpens,
      applicationCloses: row.applicationCloses,
      applicationFee: row.applicationFee,
      workStudy: row.workStudy,
      resultingDiplomaCode: row.resultingDiplomaCode,
      resultingDiplomaLabel: row.resultingDiplomaLabel,
      minGrade: row.minGrade,
      acceptedDiplomas: row.acceptedDiplomas,
      domains: row.domains,
      outcomesJobs: row.outcomesJobs,
      outcomesNextLevels: row.outcomesNextLevels,
      internationallyRecognizedIn: row.internationallyRecognizedIn,
      documents: row.documents,
      optionalSteps: row.optionalSteps,
      recommendsCertificate: row.recommendsCertificate,
      recommendsInternshipWeeks: row.recommendsInternshipWeeks,
      isCurated: row.isCurated,
      contentHash: row.contentHash,
    })
    .where(eq(programs.id, id));
  return getProgramForAdminById(db, id);
}

export async function deleteProgramFromAdmin(db: Db, id: string): Promise<boolean> {
  const existing = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(programs).where(eq(programs.id, id));
  return true;
}

/**
 * Création / mise à jour / suppression d'un job via l'Admin.
 */
export type AdminJobInput = {
  id?: string;
  code: string;
  label: string;
  riskAutomation: number; // 0..100
  domains: string[];
  salary: Array<{ country: string; median: number; currency: string }>;
  regionsTopHiring: string[];
  dailyTasks: string[];
  requiresDiplomas: string[];
  matchKeywords: string[];
};

function jobInputToRow(input: AdminJobInput, fallbackId: string) {
  return {
    id: input.id?.trim() || fallbackId,
    code: input.code,
    label: input.label,
    riskAutomation: input.riskAutomation,
    domains: JSON.stringify(input.domains),
    salary: JSON.stringify(input.salary),
    regionsTopHiring: JSON.stringify(input.regionsTopHiring),
    dailyTasks: JSON.stringify(input.dailyTasks),
    requiresDiplomas: JSON.stringify(input.requiresDiplomas),
    matchKeywords: JSON.stringify(input.matchKeywords),
  };
}

export async function createJobFromAdmin(
  db: Db,
  input: AdminJobInput,
): Promise<JobDto> {
  const fallbackId = `job-${slugify(input.label)}-${Date.now().toString(36)}`;
  const row = jobInputToRow(input, fallbackId);
  await db.insert(jobs).values(row);
  const created = await getJobById(db, row.id);
  if (!created) throw new Error("createJobFromAdmin: row not found after insert");
  return created;
}

export async function updateJobFromAdmin(
  db: Db,
  id: string,
  input: AdminJobInput,
): Promise<JobDto | null> {
  const existing = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!existing[0]) return null;
  const row = jobInputToRow({ ...input, id }, id);
  await db
    .update(jobs)
    .set({
      code: row.code,
      label: row.label,
      riskAutomation: row.riskAutomation,
      domains: row.domains,
      salary: row.salary,
      regionsTopHiring: row.regionsTopHiring,
      dailyTasks: row.dailyTasks,
      requiresDiplomas: row.requiresDiplomas,
      matchKeywords: row.matchKeywords,
    })
    .where(eq(jobs.id, id));
  return getJobById(db, id);
}

export async function deleteJobFromAdmin(db: Db, id: string): Promise<boolean> {
  const existing = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!existing[0]) return false;
  await db.delete(jobs).where(eq(jobs.id, id));
  return true;
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

// ─────────── Schools (CRUD Admin) ───────────

/**
 * Vue Admin d'un établissement. Identique à la row DB mais avec lat/lng
 * convertis en degrés décimaux (stockage interne en *1e6 pour précision).
 */
export type AdminSchoolRow = {
  uai: string;
  name: string;
  city: string;
  postalCode: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  type: string | null;
  websiteUrl: string | null;
  updatedAt: Date;
};

function rowToAdminSchool(r: SchoolRow): AdminSchoolRow {
  return {
    uai: r.uai,
    name: r.name,
    city: r.city,
    postalCode: r.postalCode,
    region: r.region,
    lat: r.lat !== null ? r.lat / 1e6 : null,
    lng: r.lng !== null ? r.lng / 1e6 : null,
    type: r.type,
    websiteUrl: r.websiteUrl,
    updatedAt: r.updatedAt,
  };
}

export type AdminSchoolInput = {
  uai: string;
  name: string;
  city: string;
  postalCode?: string;
  region?: string;
  lat?: number;
  lng?: number;
  type?: string;
  websiteUrl?: string;
};

function schoolInputToRow(input: AdminSchoolInput) {
  return {
    uai: input.uai,
    name: input.name,
    city: input.city,
    postalCode: input.postalCode || null,
    region: input.region || null,
    lat: input.lat !== undefined ? Math.round(input.lat * 1e6) : null,
    lng: input.lng !== undefined ? Math.round(input.lng * 1e6) : null,
    type: input.type || null,
    websiteUrl: input.websiteUrl || null,
  };
}

export async function getAllSchoolsForAdmin(db: Db): Promise<AdminSchoolRow[]> {
  const rows = await db.select().from(schools);
  return rows.map(rowToAdminSchool);
}

export async function getSchoolByUai(db: Db, uai: string): Promise<AdminSchoolRow | null> {
  const rows = await db.select().from(schools).where(eq(schools.uai, uai)).limit(1);
  return rows[0] ? rowToAdminSchool(rows[0]) : null;
}

export async function createSchoolFromAdmin(
  db: Db,
  input: AdminSchoolInput,
): Promise<AdminSchoolRow> {
  await db.insert(schools).values(schoolInputToRow(input));
  const created = await getSchoolByUai(db, input.uai);
  if (!created) throw new Error("createSchoolFromAdmin: row not found after insert");
  return created;
}

export async function updateSchoolFromAdmin(
  db: Db,
  uai: string,
  input: AdminSchoolInput,
): Promise<AdminSchoolRow | null> {
  const existing = await db.select().from(schools).where(eq(schools.uai, uai)).limit(1);
  if (!existing[0]) return null;
  // L'UAI étant PK, on n'autorise pas de le changer ici. Si besoin de "renommer"
  // l'UAI, supprimer + recréer + repointer manuellement les programs.school_uai.
  const row = schoolInputToRm(uai, input);
  await db
    .update(schools)
    .set(row)
    .where(eq(schools.uai, uai));
  return getSchoolByUai(db, uai);
}

function schoolInputToRm(uai: string, input: AdminSchoolInput) {
  const r = schoolInputToRow({ ...input, uai });
  // On retire l'UAI du set update (immuable)
  const { uai: _ignored, ...rest } = r;
  void _ignored;
  return rest;
}

export async function deleteSchoolFromAdmin(db: Db, uai: string): Promise<boolean> {
  const existing = await db.select().from(schools).where(eq(schools.uai, uai)).limit(1);
  if (!existing[0]) return false;
  await db.delete(schools).where(eq(schools.uai, uai));
  return true;
}
