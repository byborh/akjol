import { z } from "zod";

/**
 * Schéma Zod d'un job — partagé entre le form Admin et la route API.
 * Miroir du schéma DB `jobs` côté @akjol/db, en exposant les listes
 * sérialisées comme des arrays côté form.
 */

const Salary = z.object({
  country: z.string().min(2).max(3),
  median: z.coerce.number().int().min(0),
  currency: z.string().min(3).max(4),
});

const stringList = z.array(z.string().min(1)).default([]);

export const JobFormSchema = z.object({
  id: z.string().min(1).max(120).optional(), // si vide, auto-généré depuis le label
  code: z.string().min(1, "Code requis (ROME ou interne)"),
  label: z.string().min(2, "Libellé requis"),
  riskAutomation: z.coerce.number().int().min(0).max(100).default(30),
  domains: stringList,
  salary: z.array(Salary).default([]),
  regionsTopHiring: stringList,
  dailyTasks: stringList,
  requiresDiplomas: stringList,
  matchKeywords: stringList,
});

export type JobFormInput = z.output<typeof JobFormSchema>;

export function emptyJob(): JobFormInput {
  return {
    code: "",
    label: "",
    riskAutomation: 30,
    domains: [],
    salary: [{ country: "FR", median: 0, currency: "EUR" }],
    regionsTopHiring: [],
    dailyTasks: [],
    requiresDiplomas: [],
    matchKeywords: [],
  };
}
