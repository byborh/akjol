import type { ProgramLevel } from "../types";

export type VisaComplexity = "simple" | "medium" | "complex";

export type VisaCorridor = {
  origin: string;
  dest: string;
  levels: ProgramLevel[];
  complexity: VisaComplexity;
  visaName: string;
  processingDays: number;
  fee: number;
  feeCurrency: "EUR" | "GBP" | "USD" | "CAD" | "SGD" | "MYR";
  refusalRate: number;
  requiredDocs: string[];
  sources: { label: string; url: string }[];
  reviewedAt: string;
};

const ALL_LEVELS: ProgramLevel[] = [
  "lycee",
  "bachelor",
  "licence",
  "licence_pro",
  "master",
  "ecole_inge",
  "doctorat",
  "certif",
];

export const VISA_CORRIDORS: VisaCorridor[] = [
  {
    origin: "MY",
    dest: "FR",
    levels: ALL_LEVELS,
    complexity: "medium",
    visaName: "Visa long séjour études (VLS-TS)",
    processingDays: 21,
    fee: 99,
    feeCurrency: "EUR",
    refusalRate: 0.12,
    requiredDocs: [
      "Passeport valide >15 mois",
      "Lettre d'admission Campus France",
      "Justificatif de ressources 615€/mois",
      "Logement justifié",
      "Assurance maladie",
      "Photos d'identité",
    ],
    sources: [
      { label: "France-Visas", url: "https://france-visas.gouv.fr" },
      { label: "Campus France Malaisie", url: "https://www.malaysia.campusfrance.org" },
    ],
    reviewedAt: "2026-01-15",
  },
  {
    origin: "MY",
    dest: "GB",
    levels: ALL_LEVELS,
    complexity: "complex",
    visaName: "Student Visa (ex-Tier 4)",
    processingDays: 21,
    fee: 490,
    feeCurrency: "GBP",
    refusalRate: 0.08,
    requiredDocs: [
      "CAS letter (Confirmation of Acceptance for Studies)",
      "Preuve de fonds £1 334/mois (London) ou £1 023/mois (hors London)",
      "Tuberculosis test",
      "ATAS clearance (si STEM sensible)",
      "IHS surcharge (£776/an)",
      "Passeport biométrique",
    ],
    sources: [{ label: "GOV.UK Student Visa", url: "https://www.gov.uk/student-visa" }],
    reviewedAt: "2026-01-20",
  },
  {
    origin: "MY",
    dest: "DE",
    levels: ALL_LEVELS,
    complexity: "medium",
    visaName: "Visum zu Studienzwecken (§16b AufenthG)",
    processingDays: 56,
    fee: 75,
    feeCurrency: "EUR",
    refusalRate: 0.1,
    requiredDocs: [
      "Lettre d'admission de l'université allemande",
      "Sperrkonto (~11 904€)",
      "Assurance santé",
      "APS certificate (pour étudiants malaisiens)",
      "Preuve de niveau de langue (DSH/TestDaF ou anglais B2)",
    ],
    sources: [{ label: "Make-it-in-Germany", url: "https://www.make-it-in-germany.com" }],
    reviewedAt: "2026-01-15",
  },
  {
    origin: "MY",
    dest: "SG",
    levels: ALL_LEVELS,
    complexity: "simple",
    visaName: "Student's Pass",
    processingDays: 14,
    fee: 90,
    feeCurrency: "SGD",
    refusalRate: 0.04,
    requiredDocs: [
      "Lettre d'admission",
      "Preuve de fonds",
      "Passeport",
      "Photo récente",
      "ICA medical exam",
    ],
    sources: [{ label: "ICA Singapore", url: "https://www.ica.gov.sg" }],
    reviewedAt: "2026-01-10",
  },
  {
    origin: "FR",
    dest: "GB",
    levels: ALL_LEVELS,
    complexity: "complex",
    visaName: "Student Visa (post-Brexit)",
    processingDays: 21,
    fee: 490,
    feeCurrency: "GBP",
    refusalRate: 0.05,
    requiredDocs: [
      "CAS letter",
      "Preuve de fonds (~£12 000/an London)",
      "IHS surcharge £776/an",
      "Passeport biométrique",
    ],
    sources: [{ label: "GOV.UK Student Visa", url: "https://www.gov.uk/student-visa" }],
    reviewedAt: "2026-01-20",
  },
  {
    origin: "FR",
    dest: "US",
    levels: ALL_LEVELS,
    complexity: "complex",
    visaName: "F-1 Student Visa",
    processingDays: 60,
    fee: 510,
    feeCurrency: "USD",
    refusalRate: 0.18,
    requiredDocs: [
      "Form I-20",
      "DS-160",
      "SEVIS fee receipt ($350)",
      "Preuve de fonds total (1 an de tuition + $14k vie)",
      "Entretien consulat",
    ],
    sources: [{ label: "U.S. Dept. of State", url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html" }],
    reviewedAt: "2026-01-22",
  },
  {
    origin: "FR",
    dest: "DE",
    levels: ALL_LEVELS,
    complexity: "simple",
    visaName: "Aucun visa requis (UE)",
    processingDays: 0,
    fee: 0,
    feeCurrency: "EUR",
    refusalRate: 0,
    requiredDocs: [
      "Carte d'identité ou passeport UE",
      "Anmeldung (déclaration de domicile) sous 14j",
      "Couverture santé européenne",
    ],
    sources: [{ label: "Europa.eu", url: "https://europa.eu/youreurope" }],
    reviewedAt: "2026-01-15",
  },
  {
    origin: "FR",
    dest: "BE",
    levels: ALL_LEVELS,
    complexity: "simple",
    visaName: "Aucun visa requis (UE)",
    processingDays: 0,
    fee: 0,
    feeCurrency: "EUR",
    refusalRate: 0,
    requiredDocs: ["CNI ou passeport", "Inscription à la commune"],
    sources: [{ label: "Europa.eu", url: "https://europa.eu/youreurope" }],
    reviewedAt: "2026-01-15",
  },
  {
    origin: "FR",
    dest: "CH",
    levels: ALL_LEVELS,
    complexity: "medium",
    visaName: "Permis B étudiant",
    processingDays: 14,
    fee: 95,
    feeCurrency: "EUR",
    refusalRate: 0.05,
    requiredDocs: [
      "Confirmation d'admission",
      "Preuve de fonds (~21 000 CHF/an)",
      "Bail logement",
      "Attestation assurance maladie suisse",
    ],
    sources: [{ label: "swissuniversities.ch", url: "https://www.swissuniversities.ch" }],
    reviewedAt: "2026-01-10",
  },
  {
    origin: "FR",
    dest: "CA",
    levels: ALL_LEVELS,
    complexity: "medium",
    visaName: "Permis d'études (Study Permit)",
    processingDays: 56,
    fee: 235,
    feeCurrency: "CAD",
    refusalRate: 0.27,
    requiredDocs: [
      "Lettre d'acceptation établissement désigné (DLI)",
      "PAL provincial (depuis 2024)",
      "Preuve de fonds (20 635 CAD/an + tuition)",
      "Biométrie",
    ],
    sources: [{ label: "IRCC", url: "https://www.canada.ca/en/immigration-refugees-citizenship.html" }],
    reviewedAt: "2026-01-25",
  },
  {
    origin: "FR",
    dest: "FR",
    levels: ALL_LEVELS,
    complexity: "simple",
    visaName: "Pas de visa (citoyen FR)",
    processingDays: 0,
    fee: 0,
    feeCurrency: "EUR",
    refusalRate: 0,
    requiredDocs: [],
    sources: [],
    reviewedAt: "2026-01-15",
  },
];

export function findCorridor(
  origin: string,
  dest: string,
  level?: ProgramLevel,
): VisaCorridor | undefined {
  return VISA_CORRIDORS.find(
    (c) =>
      c.origin === origin &&
      c.dest === dest &&
      (!level || c.levels.includes(level)),
  );
}

export function corridorsFromOrigin(origin: string): VisaCorridor[] {
  return VISA_CORRIDORS.filter((c) => c.origin === origin && c.dest !== origin);
}
