/**
 * Import de formations depuis un tableur CSV (Pipeline C).
 *
 * Pensé pour un profil non-technique : la personne remplit un Google Sheet /
 * Excel calqué sur le schéma (voir scripts/templates/programs-template.csv),
 * l'exporte en CSV, et ce script valide chaque ligne puis upsert en base via
 * createProgramFromAdmin (la même fonction que l'Admin — mêmes garanties).
 *
 * Les colonnes de listes (acceptedDiplomas, domains, outcomesJobs,
 * outcomesNextLevels, internationallyRecognizedIn, documents) sont saisies
 * séparées par des barres verticales : "Bac général|Bac STI2D".
 *
 * Sécurité : DRY-RUN par défaut (valide + affiche), --apply pour écrire.
 *
 * Usage :
 *   pnpm import:programs -- data/import/info-but.csv            # valide seulement
 *   pnpm import:programs -- data/import/info-but.csv --apply    # valide + écrit
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { createDb, createProgramFromAdmin, type AdminProgramInput } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

const PROGRAM_LEVELS = [
  "lycee",
  "bachelor",
  "licence",
  "licence_pro",
  "master",
  "ecole_inge",
  "doctorat",
  "certif",
];
const ADMISSION_PLATFORMS = [
  "parcoursup",
  "mon_master",
  "ucas",
  "common_app",
  "direct",
  "concours",
  "other",
];
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Parseur CSV minimal mais correct (gère guillemets, "" échappés, retours ligne). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === "," || c === ";") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function splitList(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
}

function bool(s: string | undefined): boolean {
  return /^(true|1|oui|yes|x)$/i.test((s ?? "").trim());
}

function durationFor(level: string): number {
  switch (level) {
    case "licence_pro":
      return 1;
    case "master":
      return 2;
    case "ecole_inge":
      return 5;
    default:
      return 3;
  }
}

function buildInput(rec: Record<string, string>, errors: string[]): AdminProgramInput | null {
  const before = errors.length;
  const req = (key: string): string => {
    const v = (rec[key] ?? "").trim();
    if (!v) errors.push(`colonne requise vide: ${key}`);
    return v;
  };

  const level = (rec.level ?? "").trim() || "bachelor";
  if (!PROGRAM_LEVELS.includes(level)) errors.push(`level invalide: ${level}`);

  const admissionPlatform = (rec.admissionPlatform ?? "").trim() || "parcoursup";
  if (!ADMISSION_PLATFORMS.includes(admissionPlatform))
    errors.push(`admissionPlatform invalide: ${admissionPlatform}`);

  const languageMinLevel = (rec.languageMinLevel ?? "").trim() || "B2";
  if (!CEFR.includes(languageMinLevel)) errors.push(`languageMinLevel invalide: ${languageMinLevel}`);

  const uai = (rec.schoolUai ?? "").trim();
  if (uai && !/^\d{7}[A-Z]$/.test(uai)) errors.push(`schoolUai invalide (attendu 0750553U): ${uai}`);

  const formationLabel = req("formationLabel");
  const title = (rec.title ?? "").trim() || formationLabel;
  const formationCode = (rec.formationCode ?? "").trim() || level.toUpperCase();
  const resultingDiplomaCode =
    (rec.resultingDiplomaCode ?? "").trim() || `${formationCode}_${level.toUpperCase()}`;
  const resultingDiplomaLabel = (rec.resultingDiplomaLabel ?? "").trim() || formationLabel;

  req("schoolName");
  req("schoolCity");

  if (errors.length > before) return null;

  return {
    source: (rec.source ?? "").trim() || "manual",
    sourceId: (rec.sourceId ?? "").trim() || undefined,
    sourceUrl: (rec.sourceUrl ?? "").trim() || undefined,
    countryRef: (rec.countryRef ?? "").trim() || "FR",
    formationCode,
    formationLabel,
    title,
    level,
    durationYears: Number(rec.durationYears) || durationFor(level),
    description: (rec.description ?? "").trim(),
    schoolName: rec.schoolName.trim(),
    schoolCity: rec.schoolCity.trim(),
    schoolType: (rec.schoolType ?? "").trim() || undefined,
    schoolWebsiteUrl: (rec.schoolWebsiteUrl ?? "").trim() || undefined,
    schoolUai: uai || undefined,
    languageCode: (rec.languageCode ?? "").trim() || "fr",
    languageMinLevel,
    costPerYear: Number(rec.costPerYear) || 0,
    admissionPlatform,
    applicationOpens: (rec.applicationOpens ?? "").trim() || undefined,
    applicationCloses: (rec.applicationCloses ?? "").trim() || undefined,
    applicationFee: rec.applicationFee ? Number(rec.applicationFee) : undefined,
    workStudy: bool(rec.workStudy),
    resultingDiplomaCode,
    resultingDiplomaLabel,
    acceptedDiplomas: splitList(rec.acceptedDiplomas),
    domains: splitList(rec.domains),
    outcomesJobs: splitList(rec.outcomesJobs),
    outcomesNextLevels: splitList(rec.outcomesNextLevels),
    internationallyRecognizedIn: splitList(rec.internationallyRecognizedIn).length
      ? splitList(rec.internationallyRecognizedIn)
      : ["FR"],
    documents: splitList(rec.documents),
    recommendsInternshipWeeks: rec.recommendsInternshipWeeks
      ? Number(rec.recommendsInternshipWeeks)
      : undefined,
    isCurated: rec.isCurated === undefined || rec.isCurated.trim() === "" ? true : bool(rec.isCurated),
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Usage: pnpm import:programs -- <fichier.csv> [--apply]");
    process.exit(2);
  }

  const rows = parseCsv(readFileSync(resolve(file), "utf8"));
  if (rows.length < 2) throw new Error("CSV vide ou sans lignes de données.");

  const header = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);
  console.log(`${dataRows.length} ligne(s) de données. mode: ${apply ? "APPLY" : "DRY-RUN"}\n`);

  const db = createDb(DB_PATH);
  let valid = 0;
  let invalid = 0;
  let written = 0;

  for (let r = 0; r < dataRows.length; r++) {
    const rec: Record<string, string> = {};
    header.forEach((h, i) => (rec[h] = dataRows[r][i] ?? ""));

    const errors: string[] = [];
    const input = buildInput(rec, errors);
    const lineNo = r + 2; // +1 header, +1 index→ligne

    if (!input || errors.length) {
      invalid++;
      console.error(`  ✗ L${lineNo}: ${errors.join("; ")}`);
      continue;
    }
    valid++;

    if (apply) {
      try {
        const created = await createProgramFromAdmin(db, input);
        written++;
        console.log(`  ✓ L${lineNo}: ${created.title}`);
      } catch (err) {
        invalid++;
        console.error(`  ✗ L${lineNo} (écriture): ${err instanceof Error ? err.message : err}`);
      }
    } else {
      console.log(`  • L${lineNo}: ${input.title}`);
    }
  }

  console.log(`\nValides=${valid} invalides=${invalid}${apply ? ` écrites=${written}` : ""}.`);
  if (!apply && valid > 0) console.log("DRY-RUN OK : relance avec --apply pour écrire.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
