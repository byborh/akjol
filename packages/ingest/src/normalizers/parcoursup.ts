import type { CEFR, NormalizedProgram, ProgramLevel } from "../types.js";

/**
 * Normalizer Parcoursup — dataset "fr-esr-parcoursup" (data.enseignementsup-
 * recherche.gouv.fr). Contrairement à ONISEP (qui liste des *types* abstraits),
 * Parcoursup donne des fiches *par établissement* : nom réel, ville, UAI,
 * capacité, taux d'accès, lien fiche. C'est la source la plus riche pour le
 * premier lot informatique Bac+2/3 (BUT Info, BTS SIO, licences info…).
 *
 * Les noms de colonnes du dataset varient d'une session à l'autre ; on accepte
 * plusieurs alias via pick() et on retombe sur null si l'essentiel manque.
 */
export type ParcoursupRow = Record<string, string | undefined>;

/**
 * Mots-clés du domaine informatique Bac+2/3. Utilisés par le filtre `--it` de
 * l'adapter pour ne ramener que le périmètre du premier lot. Volontairement
 * large (réseaux, numérique, multimédia, données…) puis affiné à la curation.
 */
const IT_KEYWORDS = [
  "informatique",
  "numérique",
  "numerique",
  "réseaux",
  "reseaux",
  "télécom",
  "telecom",
  "cybersécurité",
  "cybersecurite",
  "données",
  "donnees",
  "data",
  "développement",
  "developpement",
  "logiciel",
  "systèmes numériques",
  "systemes numeriques",
  // Codes de diplômes informatiques courants sur Parcoursup
  "sio", // BTS Services informatiques aux organisations
  "snir", // BTS Systèmes numériques option informatique et réseaux
  "ciel", // BTS Cybersécurité, informatique et réseaux, électronique
  "mmi", // BUT Métiers du multimédia et de l'internet
  "multimédia",
  "multimedia",
  "internet",
];

/** True si le libellé de formation relève du domaine informatique Bac+2/3. */
export function isInformatique(label: string, extra?: string): boolean {
  const hay = `${label} ${extra ?? ""}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
  return IT_KEYWORDS.some((k) => hay.includes(k.normalize("NFKD").replace(/[̀-ͯ]/g, "")));
}

/** Type de formation Parcoursup → ProgramLevel AkJol. */
function mapLevel(label: string): ProgramLevel {
  const l = label.toUpperCase();
  if (/\bBUT\b|D\.?U\.?T\b/.test(l)) return "bachelor"; // bac+3 (cycle court côté AkJol)
  if (/\bBTS\b/.test(l)) return "bachelor"; // bac+2
  if (/LICENCE PRO/.test(l)) return "licence_pro";
  if (/BACHELOR/.test(l)) return "bachelor";
  if (/PR[ÉE]PA|CPGE|CLASSE PR[ÉE]PARATOIRE/.test(l)) return "certif";
  if (/INGÉNIEUR|INGENIEUR/.test(l)) return "ecole_inge";
  if (/LICENCE/.test(l)) return "licence";
  return "bachelor"; // défaut prudent : Parcoursup = post-bac, cycle court
}

function inferFormationCode(label: string): string {
  const l = label.toUpperCase();
  if (/\bBUT\b/.test(l)) return "BUT";
  if (/D\.?U\.?T\b/.test(l)) return "BUT";
  if (/\bBTS\b/.test(l)) return "BTS";
  if (/LICENCE PRO/.test(l)) return "LICENCE_PRO";
  if (/BACHELOR/.test(l)) return "BACHELOR";
  if (/LICENCE/.test(l)) return "LICENCE";
  if (/PR[ÉE]PA|CPGE/.test(l)) return "CPGE";
  return slugify(label);
}

function durationFor(level: ProgramLevel): number {
  switch (level) {
    case "bachelor":
      return 3; // BUT=3, BTS=2 → on garde 3 par défaut, corrigé à la curation
    case "licence":
      return 3;
    case "licence_pro":
      return 1;
    case "ecole_inge":
      return 5;
    default:
      return 2;
  }
}

/** Coût annuel public moyen (frais MESR 2024) ; privé → fourchette prudente. */
function inferCost(level: ProgramLevel, isPrivate: boolean): number {
  if (isPrivate) {
    if (level === "ecole_inge") return 8000;
    return 5000;
  }
  switch (level) {
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

export type NormalizeParcoursupOptions = {
  /** Si true, ne renvoie que les formations du domaine informatique. */
  itOnly?: boolean;
  /** Session (année) déclarée, pour la traçabilité du sourceId. */
  session?: string;
};

export function normalizeParcoursupRow(
  row: ParcoursupRow,
  opts: NormalizeParcoursupOptions = {},
): NormalizedProgram | null {
  const label = pick(row, [
    "lib_for_voe_ins",
    "form_lib_voe_acc",
    "lib_comp_voe_ins",
    "fil_lib_voe_acc",
    "libelle_formation",
    "formation",
  ]);
  if (!label) return null;

  const etab = pick(row, [
    "g_ea_lib_vx",
    "lib_etab",
    "etablissement",
    "nom_etablissement",
  ]);
  const uaiRaw = pick(row, ["cod_uai", "uai", "code_uai"]);
  const uai = uaiRaw ? uaiRaw.trim().toUpperCase() : null;
  const ville = pick(row, ["ville_etab", "commune", "lib_dep", "ville"]) ?? "";
  const region = pick(row, ["region_etab_aff", "region", "lib_region"]);
  const dep = pick(row, ["dep_lib", "departement", "dep"]);
  const sourceUrl = pick(row, ["lien_form_psup", "lien_fiche", "url"]) ?? null;
  const contrat = pick(row, ["contrat_etab", "statut_etablissement", "secteur"]);
  const session =
    opts.session ?? pick(row, ["session", "annee", "an_session"]) ?? "";

  const isPrivate = !!contrat && /priv/i.test(contrat);

  if (opts.itOnly && !isInformatique(label, pick(row, ["fil_lib_voe_acc", "detail_forma"]))) {
    return null;
  }

  const level = mapLevel(label);
  const formationCode = inferFormationCode(label);
  const lang = inferLanguageMin();

  // ID stable : préférer un code de formation Parcoursup s'il existe, sinon
  // composer UAI + slug(libellé). Le couple (source, sourceId) est unique.
  const codAff = pick(row, ["cod_aff_form", "g_ti_cod", "id"]);
  const sourceId =
    codAff?.trim() ||
    `${uai ?? "NA"}:${slugify(label)}${session ? `:${session}` : ""}`;

  const debouches = splitList(pick(row, ["debouches", "metiers", "secteurs"]));
  const capacite = pick(row, ["capa_fin", "capacite", "nb_places"]);

  return {
    source: "parcoursup",
    sourceId,
    sourceUrl,

    id: `parcoursup:${sourceId}`,
    countryRef: "FR",
    formationCode,
    formationLabel: label,
    title: etab ? `${label} — ${etab}` : label,
    level,
    durationYears: durationFor(level),
    description:
      [label, etab, ville, dep, region, capacite ? `Capacité : ${capacite}` : null]
        .filter(Boolean)
        .join(" · ") || label,

    schoolName: etab ?? "Établissement non précisé",
    schoolCity: ville,
    schoolType: contrat ?? null,
    schoolWebsiteUrl: null,
    schoolUai: uai,

    languageCode: lang.code,
    languageMinLevel: lang.minLevel,
    costPerYear: inferCost(level, isPrivate),
    admissionPlatform: "parcoursup",
    applicationOpens: null,
    applicationCloses: null,
    applicationFee: null,
    workStudy: /altern|apprentissage/i.test(label),

    resultingDiplomaCode: `${formationCode}_${level.toUpperCase()}`,
    resultingDiplomaLabel: label,
    minGrade: null,

    acceptedDiplomas: [],
    domains: opts.itOnly ? ["Informatique"] : [],
    outcomesJobs: debouches,
    outcomesNextLevels: [],
    internationallyRecognizedIn: ["FR"],
    documents: [],
    optionalSteps: null,
    recommendsCertificate: null,
    recommendsInternshipWeeks: null,
  };
}

function inferLanguageMin(): { code: string; minLevel: CEFR } {
  return { code: "fr", minLevel: "B2" };
}

function pick(row: ParcoursupRow, keys: string[]): string | undefined {
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

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
