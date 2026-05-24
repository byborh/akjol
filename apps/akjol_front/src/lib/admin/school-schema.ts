import { z } from "zod";

/**
 * Schéma Zod d'un établissement (school). PK = UAI.
 *
 * Le format UAI officiel est 7 chiffres + 1 lettre (ex: 0750553U). On accepte
 * aussi les UAI provisoires du seed-iut (préfixe 999, ex: 9990001I) — même
 * regex car le pattern reste \d{7}[A-Z].
 */
export const SchoolFormSchema = z.object({
  uai: z.string().regex(/^\d{7}[A-Z]$/, "Format UAI invalide (ex: 0750553U)"),
  name: z.string().min(2, "Nom requis"),
  city: z.string().min(1, "Ville requise"),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal à 5 chiffres").or(z.literal("")).optional(),
  region: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  type: z.string().optional(),
  websiteUrl: z.string().url().or(z.literal("")).optional(),
});

export type SchoolFormInput = z.output<typeof SchoolFormSchema>;

export const SCHOOL_TYPES = ["lycée", "iut", "université", "école_ingé", "école_sup", "école_commerce", "grand_étab", "autre"] as const;

export function emptySchool(): SchoolFormInput {
  return {
    uai: "",
    name: "",
    city: "",
    postalCode: "",
    region: "",
    type: "",
    websiteUrl: "",
  };
}
