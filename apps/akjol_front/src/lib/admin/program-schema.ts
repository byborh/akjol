import { z } from "zod";

/**
 * Schéma Zod d'un program — source unique de vérité partagée entre le form
 * Admin (validation temps réel côté client) et les routes API (re-validation
 * côté serveur). Ne JAMAIS contourner ce schéma : un champ ajouté ici doit
 * apparaître dans le form et dans le mapping API → DB.
 */

const CEFR = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const PROGRAM_LEVELS = [
  "lycee",
  "bachelor",
  "licence",
  "licence_pro",
  "master",
  "ecole_inge",
  "doctorat",
  "certif",
] as const;
export const Level = z.enum(PROGRAM_LEVELS);

export const ADMISSION_PLATFORMS = [
  "parcoursup",
  "mon_master",
  "ucas",
  "common_app",
  "direct",
  "concours",
  "other",
] as const;
export const AdmissionPlatform = z.enum(ADMISSION_PLATFORMS);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : YYYY-MM-DD")
  .or(z.literal(""))
  .transform((s) => s || undefined);

/**
 * Le formulaire saisit les listes (acceptedDiplomas, domains, outcomesJobs…)
 * comme des tableaux de strings. Vide = [].
 */
const stringList = z.array(z.string().min(1)).default([]);

export const ProgramFormSchema = z.object({
  // Identité (id auto-généré côté serveur si vide)
  id: z.string().min(1).max(120).optional(),

  // Provenance (auto-rempli si pre-fill ONISEP, sinon "manual")
  source: z.string().min(1).default("manual"),
  sourceId: z.string().min(1).optional(),
  sourceUrl: z.string().url().or(z.literal("")).optional(),

  // Identité programme
  countryRef: z.string().length(2).default("FR"),
  formationCode: z.string().min(1, "Code formation requis"),
  formationLabel: z.string().min(1, "Libellé formation requis"),
  title: z.string().min(3, "Titre requis (≥ 3 caractères)"),
  level: Level,
  durationYears: z.coerce.number().int().min(1).max(10),
  description: z.string().default(""),

  // École (dénormalisé pour rétrocompat ; school_uai = pivot moderne)
  schoolName: z.string().min(1, "Nom de l'école requis"),
  schoolCity: z.string().min(1, "Ville requise"),
  schoolType: z.string().optional(),
  schoolWebsiteUrl: z.string().url().or(z.literal("")).optional(),
  schoolUai: z.string().regex(/^\d{7}[A-Z]$/, "Format UAI invalide (ex: 0750553U)").or(z.literal("")).optional(),

  // Langue / coût / admission
  languageCode: z.string().min(2).max(5).default("fr"),
  languageMinLevel: CEFR.default("B2"),
  costPerYear: z.coerce.number().int().min(0).default(0),
  admissionPlatform: AdmissionPlatform.default("direct"),
  applicationOpens: isoDate.optional(),
  applicationCloses: isoDate.optional(),
  applicationFee: z.coerce.number().int().min(0).optional(),
  workStudy: z.boolean().default(false),

  // Diplôme délivré
  resultingDiplomaCode: z.string().min(1, "Code diplôme délivré requis"),
  resultingDiplomaLabel: z.string().min(1, "Libellé diplôme délivré requis"),
  minGrade: z
    .object({
      value: z.coerce.number(),
      scaleMax: z.coerce.number(),
    })
    .optional(),

  // Listes structurées
  acceptedDiplomas: stringList,
  domains: stringList,
  outcomesJobs: stringList,
  outcomesNextLevels: stringList,
  internationallyRecognizedIn: stringList,
  documents: stringList,
  optionalSteps: stringList.optional(),

  // Recommandations
  recommendsCertificate: z
    .object({
      code: z.string(),
      minScore: z.coerce.number(),
      gainPct: z.coerce.number(),
    })
    .optional(),
  recommendsInternshipWeeks: z.coerce.number().int().min(0).optional(),

  // Curation
  isCurated: z.boolean().default(true),
});

// Le form state utilise les types de sortie (post-coercion) pour que les inputs
// HTML (number, string) aient des props typées correctement. La validation
// Zod ré-applique la coercion à la soumission, donc on reste safe.
export type ProgramFormInput = z.output<typeof ProgramFormSchema>;
export type ProgramFormOutput = z.output<typeof ProgramFormSchema>;

/** Build empty default values for a brand-new fiche. */
export function emptyProgram(): ProgramFormInput {
  return {
    source: "manual",
    countryRef: "FR",
    formationCode: "",
    formationLabel: "",
    title: "",
    level: "bachelor",
    durationYears: 3,
    description: "",
    schoolName: "",
    schoolCity: "",
    languageCode: "fr",
    languageMinLevel: "B2",
    costPerYear: 0,
    admissionPlatform: "direct",
    workStudy: false,
    resultingDiplomaCode: "",
    resultingDiplomaLabel: "",
    acceptedDiplomas: [],
    domains: [],
    outcomesJobs: [],
    outcomesNextLevels: [],
    internationallyRecognizedIn: [],
    documents: [],
    isCurated: true,
  };
}
