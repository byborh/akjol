/**
 * Types internes au pipeline d'ingestion.
 * Le type `NormalizedProgram` est ce qu'un source-adapter doit produire :
 * forme alignée sur la table `programs` (packages/db), prête à upsert.
 */

export type IngestSource = "onisep" | "mon_master" | "ucas" | "common_app";

export type ProgramLevel =
  | "lycee"
  | "bachelor"
  | "licence"
  | "licence_pro"
  | "master"
  | "ecole_inge"
  | "doctorat"
  | "certif";

export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type AdmissionPlatform =
  | "parcoursup"
  | "mon_master"
  | "ucas"
  | "common_app"
  | "direct";

export type NormalizedProgram = {
  // Provenance
  source: IngestSource;
  sourceId: string;
  sourceUrl: string | null;

  // Identité
  id: string; // = `${source}:${sourceId}`
  countryRef: string; // ISO2
  formationCode: string;
  formationLabel: string;
  title: string;
  level: ProgramLevel;
  durationYears: number;
  description: string;

  // École
  schoolName: string;
  schoolCity: string;
  schoolType: string | null;
  schoolWebsiteUrl: string | null;

  // Langue / coût / admission
  languageCode: string;
  languageMinLevel: CEFR;
  costPerYear: number;
  admissionPlatform: AdmissionPlatform;
  applicationOpens: string | null;
  applicationCloses: string | null;
  applicationFee: number | null;
  workStudy: boolean;

  // Diplôme
  resultingDiplomaCode: string;
  resultingDiplomaLabel: string;
  minGrade: { value: number; scaleMax: number } | null;

  // Listes
  acceptedDiplomas: string[];
  domains: string[];
  outcomesJobs: string[];
  outcomesNextLevels: ProgramLevel[];
  internationallyRecognizedIn: string[];
  documents: string[];
  optionalSteps: string[] | null;
  recommendsCertificate: { code: string; minScore: number; gainPct: number } | null;
  recommendsInternshipWeeks: number | null;
};

/**
 * Contrat qu'implémente chaque source : fournir un async iterable de programmes
 * normalisés. Un async iterable permet le streaming (60k+ lignes ONISEP) sans
 * tout charger en mémoire.
 */
export type SourceAdapter = {
  source: IngestSource;
  /** Un seul label humain, e.g. "ONISEP — Idéo-Formations". */
  label: string;
  /** Itère sur les programmes normalisés, ligne par ligne. */
  iterate(): AsyncIterable<NormalizedProgram>;
};

export type RunStats = {
  source: IngestSource;
  inserted: number;
  updated: number;
  unchanged: number;
  deprecated: number;
  errors: number;
  startedAt: Date;
  finishedAt: Date;
  notes: string[];
};
