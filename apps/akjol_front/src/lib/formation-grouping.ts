import type { Program, ProgramLevel, ISO2 } from "../types";

/**
 * Regroupement des "offres" par formation.
 *
 * Une ligne `Program` = une formation dans un établissement (une offre). Plusieurs
 * établissements proposent la même formation (ex. 21 BTS SIO). Pour l'affichage,
 * on regroupe ces offres par identité de formation : (libellé + niveau + pays).
 * La fiche formation est ainsi montrée UNE fois, avec la liste de ses établissements.
 */
export type FormationGroup = {
  key: string;
  formationLabel: string;
  formationCode: string;
  level: ProgramLevel;
  countryRef: ISO2;
  durationYears: number;
  description: string;
  domains: string[];
  outcomesJobs: string[];
  acceptedDiplomas: string[];
  outcomesNextLevels: ProgramLevel[];
  /** Toutes les offres (établissements) de cette formation. */
  offerings: Program[];
};

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/** Clé stable et URL-safe identifiant une formation (indépendante de l'école). */
export function formationKey(p: Pick<Program, "formationLabel" | "level" | "countryRef">): string {
  return `${slug(p.formationLabel)}-${p.level}-${p.countryRef.toLowerCase()}`;
}

/** Regroupe une liste d'offres en formations (déduplique le concept formation). */
export function groupFormations(programs: Program[]): FormationGroup[] {
  const map = new Map<string, FormationGroup>();
  for (const p of programs) {
    const key = formationKey(p);
    const existing = map.get(key);
    if (existing) {
      existing.offerings.push(p);
      continue;
    }
    map.set(key, {
      key,
      formationLabel: p.formationLabel,
      formationCode: p.formationCode,
      level: p.level,
      countryRef: p.countryRef,
      durationYears: p.durationYears,
      description: p.description,
      domains: p.domains,
      outcomesJobs: p.outcomesJobs,
      acceptedDiplomas: p.acceptedDiplomas,
      outcomesNextLevels: p.outcomesNextLevels,
      offerings: [p],
    });
  }
  // Tri : formations avec le plus d'établissements d'abord, puis alpha.
  return [...map.values()].sort(
    (a, b) => b.offerings.length - a.offerings.length || a.formationLabel.localeCompare(b.formationLabel),
  );
}

/** Retrouve une formation par sa clé dans une liste d'offres. */
export function findFormation(programs: Program[], key: string): FormationGroup | null {
  return groupFormations(programs).find((g) => g.key === key) ?? null;
}
