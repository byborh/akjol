import type { CEFR, NormalizedProgram, ProgramLevel, AdmissionPlatform } from "../types.js";

/**
 * Mapping niveau_formation ONISEP → ProgramLevel AkJol.
 * ONISEP utilise des chaînes hétérogènes ("Niveau bac", "Niveau bac + 2", "CAP",
 * "Bac + 5", etc.) — on couvre les cas courants. Les inconnus tombent sur "certif".
 */
export function mapOnisepNiveauToLevel(niveau: string | null | undefined): ProgramLevel {
  if (!niveau) return "certif";
  const n = niveau.toLowerCase().replace(/\s+/g, " ").trim();

  if (/(bac \+ ?8|niveau 8|doctorat)/.test(n)) return "doctorat";
  if (/(bac \+ ?5|niveau 7|master)/.test(n)) return "master";
  if (/ing[ée]nieur/.test(n)) return "ecole_inge";
  if (/licence pro/.test(n)) return "licence_pro";
  if (/(bac \+ ?3|niveau 6|bachelor)/.test(n)) return "bachelor";
  if (/licence/.test(n)) return "licence";
  if (/(bac \+ ?2|niveau 5|bts|but|dut)/.test(n)) return "bachelor"; // bac+2 → cycle court bachelor
  if (/(niveau bac|niveau 4|bac\b)/.test(n)) return "lycee";
  if (/(cap|niveau 3)/.test(n)) return "lycee";
  return "certif";
}

/** Type ONISEP (BTS, BUT, Licence pro, Master…) → code formation interne. */
export function inferFormationCode(niveau: string, libelle: string): string {
  const lib = libelle.toUpperCase();
  if (/BTS/.test(lib)) return "BTS";
  if (/BUT|D\.U\.T/.test(lib)) return "BUT";
  if (/LICENCE PRO/.test(lib)) return "LICENCE_PRO";
  if (/MASTER/.test(lib)) return "MASTER";
  if (/INGÉNIEUR|INGENIEUR|DIPL[OÔ]ME D'INGÉNIEUR/.test(lib)) return "DIPL_INGE";
  if (/LICENCE/.test(lib)) return "LICENCE";
  if (/CAP/.test(lib)) return "CAP";
  if (/BAC PRO/.test(lib)) return "BAC_PRO";
  if (/DOCTORAT/.test(lib)) return "DOCTORAT";
  return slugify(niveau || "FORMATION");
}

/** Coût annuel public moyen par type de cursus (frais d'inscription FR 2024). */
export function inferCostPerYear(level: ProgramLevel, etablissementType: string | null): number {
  if (etablissementType && /priv[ée]/i.test(etablissementType)) {
    // École privée — fourchette extrêmement large, on prend une médiane prudente.
    if (level === "ecole_inge") return 8000;
    if (level === "master" || level === "bachelor") return 6000;
    return 4000;
  }
  // Public FR : tarifs MESR 2024-2025.
  switch (level) {
    case "doctorat":
      return 391;
    case "master":
      return 250;
    case "ecole_inge":
      return 618;
    case "licence":
    case "licence_pro":
    case "bachelor":
      return 175;
    default:
      return 0;
  }
}

export function inferAdmissionPlatform(level: ProgramLevel): AdmissionPlatform {
  if (level === "master") return "mon_master";
  if (level === "lycee" || level === "bachelor" || level === "licence" || level === "licence_pro")
    return "parcoursup";
  return "direct";
}

export function inferLanguageMin(): { code: string; minLevel: CEFR } {
  // Par défaut : programme FR enseigné en français, niveau B2 attendu pour suivre.
  return { code: "fr", minLevel: "B2" };
}

export function inferDurationYears(level: ProgramLevel): number {
  switch (level) {
    case "lycee":
      return 3;
    case "bachelor":
      return 3;
    case "licence":
      return 3;
    case "licence_pro":
      return 1;
    case "master":
      return 2;
    case "ecole_inge":
      return 3;
    case "doctorat":
      return 3;
    default:
      return 1;
  }
}

export function inferDiplomaCode(level: ProgramLevel, formationCode: string): string {
  return `${formationCode}_${level.toUpperCase()}`;
}

export function inferDiplomaLabel(level: ProgramLevel, libelle: string): string {
  if (level === "doctorat") return `${libelle} (Bac+8)`;
  if (level === "master" || level === "ecole_inge") return `${libelle} (Bac+5)`;
  if (level === "licence" || level === "bachelor" || level === "licence_pro")
    return `${libelle} (Bac+3)`;
  return libelle;
}

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Forme typique d'une ligne du dataset ONISEP "Idéo - Formations
 * initiales France entière" (data.gouv.fr). Les noms de colonnes varient
 * légèrement entre revisions ; on accepte plusieurs alias et on fallback à null.
 */
export type OnisepRow = Record<string, string | undefined>;

export function normalizeOnisepRow(row: OnisepRow): NormalizedProgram | null {
  const id = pick(row, ["identifiant", "identifiant_formation", "ideo_id", "id"]);
  const libelle = pick(row, ["libelle", "libelle_formation", "libelle_type_formation"]);
  const niveau = pick(row, ["niveau_de_sortie", "niveau", "niveau_formation"]);
  const url = pick(row, ["url_formation", "url_et_id_onisep", "url"]);

  if (!id || !libelle) return null;

  const etabName = pick(row, ["nom", "etablissement_libelle", "etablissement", "uai"]);
  const etabType = pick(row, ["type_etablissement", "tutelle"]);
  const ville = pick(row, ["commune", "ville", "ville_lib", "commune_lib"]) ?? "";
  const departement = pick(row, ["departement", "code_departement", "dep"]);
  const region = pick(row, ["region", "region_lib"]);

  const level = mapOnisepNiveauToLevel(niveau);
  const formationCode = inferFormationCode(niveau ?? "", libelle);
  const lang = inferLanguageMin();

  return {
    source: "onisep",
    sourceId: id,
    sourceUrl: url ?? null,

    id: `onisep:${id}`,
    countryRef: "FR",
    formationCode,
    formationLabel: libelle,
    title: etabName ? `${libelle} — ${etabName}` : libelle,
    level,
    durationYears: inferDurationYears(level),
    description:
      [libelle, etabName, ville, departement, region].filter(Boolean).join(" · ") || libelle,

    schoolName: etabName ?? "Établissement non précisé",
    schoolCity: ville,
    schoolType: etabType ?? null,
    schoolWebsiteUrl: pick(row, ["url_etablissement", "site_internet"]) ?? null,

    languageCode: lang.code,
    languageMinLevel: lang.minLevel,
    costPerYear: inferCostPerYear(level, etabType ?? null),
    admissionPlatform: inferAdmissionPlatform(level),
    applicationOpens: null,
    applicationCloses: null,
    applicationFee: null,
    workStudy: /altern/i.test(libelle) || /altern/i.test(pick(row, ["modalites_alternance"]) ?? ""),

    resultingDiplomaCode: inferDiplomaCode(level, formationCode),
    resultingDiplomaLabel: inferDiplomaLabel(level, libelle),
    minGrade: null,

    acceptedDiplomas: [],
    domains: splitList(pick(row, ["domainesous-domaine", "domaines", "domaine"])),
    outcomesJobs: splitList(pick(row, ["debouches", "metiers"])),
    outcomesNextLevels: [],
    internationallyRecognizedIn: ["FR"],
    documents: [],
    optionalSteps: null,
    recommendsCertificate: null,
    recommendsInternshipWeeks: null,
  };
}

function pick(row: OnisepRow, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

function splitList(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[;|,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
