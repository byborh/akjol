import type { Passport } from "../types";

export type Persona = {
  id: "lea" | "lana";
  emoji: string;
  passport: Passport;
};

export const LEA_PERSONA: Passport = {
  origin: {
    country: "FR",
    languages: [
      { code: "fr", level: "C2" },
      { code: "en", level: "B2" },
    ],
  },
  currentDiploma: {
    countryRef: "FR",
    code: "BTS_SIO_SISR",
    label: "BTS SIO option SISR",
    status: "in_progress",
    yearExpected: 2027,
    grade: { value: 14, scaleMax: 20 },
  },
  certificates: [{ code: "TOEIC", score: 785 }],
  constraints: {
    maxBudgetPerYear: 5000,
    maxDurationYears: 3,
    needsScholarship: false,
    workStudyPreferred: true,
  },
  aspiration: {
    domains: ["Tech"],
    jobs: ["Administrateur réseau", "Ingénieur sécurité junior", "DevOps"],
    openToSurprise: true,
  },
};

export const LANA_PERSONA: Passport = {
  origin: {
    country: "MY",
    languages: [
      { code: "ms", level: "C2" },
      { code: "en", level: "C1" },
      { code: "zh", level: "B2" },
    ],
  },
  currentDiploma: {
    countryRef: "MY",
    code: "STPM",
    label: "STPM",
    status: "in_progress",
    yearExpected: 2026,
    grade: { value: 3.5, scaleMax: 4 },
  },
  certificates: [{ code: "IELTS", score: 7 }],
  constraints: {
    maxBudgetPerYear: 15000,
    maxDurationYears: 6,
    needsScholarship: true,
    workStudyPreferred: false,
  },
  aspiration: {
    domains: ["Santé", "Tech"],
    jobs: ["Médecin", "Ingénieur biomédical"],
    openToSurprise: true,
  },
};

export const PERSONAS: Persona[] = [
  { id: "lea", emoji: "🇫🇷", passport: LEA_PERSONA },
  { id: "lana", emoji: "🇲🇾", passport: LANA_PERSONA },
];

export function getPersona(id: "lea" | "lana"): Passport {
  return id === "lea" ? LEA_PERSONA : LANA_PERSONA;
}
