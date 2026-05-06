export type ISO2 = string;
export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type LanguageSkill = { code: string; level: CEFR };

export type Certificate = { code: string; score: number };

export type DiplomaStatus = "in_progress" | "obtained";

export type Passport = {
  origin: { country: ISO2; languages: LanguageSkill[] };
  currentDiploma: {
    countryRef: ISO2;
    code: string;
    label: string;
    status: DiplomaStatus;
    yearObtained?: number;
    yearExpected?: number;
    grade?: { value: number; scaleMax: number };
  } | null;
  certificates: Certificate[];
  constraints: {
    maxBudgetPerYear?: number;
    maxDurationYears?: number;
    needsScholarship?: boolean;
    workStudyPreferred?: boolean;
  };
  aspiration: { domains: string[]; jobs: string[]; openToSurprise: boolean };
};

export type ProgramLevel =
  | "lycee"
  | "bachelor"
  | "licence"
  | "licence_pro"
  | "master"
  | "ecole_inge"
  | "doctorat"
  | "certif";

export type AdmissionPlatform =
  | "parcoursup"
  | "mon_master"
  | "ucas"
  | "common_app"
  | "direct";

export type SchoolMeta = {
  name: string;
  city: string;
  rating?: number;
  websiteUrl?: string;
  jpoUrl?: string;
  description?: string;
  type?: "université" | "grande école" | "lycée" | "IUT" | "école privée" | "autre";
};

export type Program = {
  id: string;
  countryRef: ISO2;
  formationCode: string;
  formationLabel: string;
  school: SchoolMeta;
  title: string;
  level: ProgramLevel;
  durationYears: number;
  language: { code: string; minLevel: CEFR };
  costPerYear: number;
  admissionPlatform: AdmissionPlatform;
  acceptedDiplomas: string[];
  minGrade?: { value: number; scaleMax: number };
  workStudy: boolean;
  domains: string[];
  outcomesJobs: string[];
  outcomesNextLevels: ProgramLevel[];
  internationallyRecognizedIn: ISO2[];
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

export type TrajectoryStep = {
  programId: string;
  resultingDiplomaCode: string;
  resultingDiplomaLabel: string;
  resultingLevel: ProgramLevel;
  countryRef: ISO2;
  yearsAdded: number;
};

export type FromOverride = {
  code: string;
  label: string;
  countryRef: ISO2;
};

export type Condition = { label: string; met: boolean; detail?: string };
export type Assumption = { label: string };
export type ActionableSuggestion = { label: string; gainPct?: number; detail?: string };
export type Blocker = { label: string };

export type FeasibilityStatus =
  | "open"
  | "open_with_step"
  | "closed"
  | "uncovered";

export type FeasibilityResult = {
  status: FeasibilityStatus;
  conditions: { met: Condition[]; unmet: Condition[] };
  assumptions: Assumption[];
  toMaximize: ActionableSuggestion[];
  probability: { value: number; ci: number; basedOn: number };
  blockers: Blocker[];
  missingStep?: string;
};
