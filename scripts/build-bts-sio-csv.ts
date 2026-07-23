/**
 * Génère un fichier CSV de fiches BTS SIO à partir de l'API Parcoursup (source
 * qui fait autorité sur qui propose réellement la formation) + les variables
 * standardisées du dictionnaire it-formation-refs.ts.
 *
 * Résultat : data/import/bts-sio.csv — vrais établissements (UAI réel, ville,
 * région, capacité, lien fiche) + débouchés/diplômes/domaines/poursuites BTS SIO.
 * Prêt à relire puis importer via `pnpm import:programs -- data/import/bts-sio.csv`.
 *
 * Usage : pnpm build:bts-sio-csv            (20 fiches, spread national)
 *         pnpm build:bts-sio-csv -- --count 30
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { matchRef } from "./data/it-formation-refs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../data/import/bts-sio.csv");

const API =
  "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/records" +
  "?where=" +
  encodeURIComponent('search(lib_for_voe_ins, "informatique aux organisations")') +
  "&select=" +
  encodeURIComponent(
    "cod_uai,g_ea_lib_vx,ville_etab,region_etab_aff,dep_lib,lib_for_voe_ins,contrat_etab,capa_fin,taux_acces_ens,lien_form_psup,cod_aff_form",
  ) +
  "&limit=100";

const HEADER = [
  "source","sourceUrl","countryRef","formationCode","formationLabel","title","level",
  "durationYears","description","schoolName","schoolCity","schoolType","schoolWebsiteUrl",
  "schoolUai","languageCode","languageMinLevel","costPerYear","admissionPlatform",
  "applicationOpens","applicationCloses","applicationFee","workStudy","resultingDiplomaCode",
  "resultingDiplomaLabel","acceptedDiplomas","domains","outcomesJobs","outcomesNextLevels",
  "internationallyRecognizedIn","documents","recommendsInternshipWeeks","isCurated",
];

type Rec = {
  cod_uai?: string;
  g_ea_lib_vx?: string;
  ville_etab?: string;
  region_etab_aff?: string;
  dep_lib?: string;
  lib_for_voe_ins?: string;
  contrat_etab?: string;
  capa_fin?: number | null;
  taux_acces_ens?: number | null;
  lien_form_psup?: string;
  cod_aff_form?: string;
};

/** Nettoie "Marseille  5e  Arrondissement" → "Marseille". */
function cleanCity(v: string | undefined): string {
  if (!v) return "";
  return v.replace(/\s+\d+e(r)?\s+Arrondissement.*/i, "").replace(/\s+/g, " ").trim();
}

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function parseFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const count = Number(parseFlag(argv, "--count") ?? "20");

  const res = await fetch(API, { redirect: "follow" });
  if (!res.ok) throw new Error(`API Parcoursup HTTP ${res.status}`);
  const data = (await res.json()) as { total_count: number; results: Rec[] };
  console.log(`API : ${data.total_count} BTS SIO trouvés, ${data.results.length} récupérés.`);

  // Dédup par UAI (garde le 1er) puis répartition nationale (round-robin région).
  const byUai = new Map<string, Rec>();
  for (const r of data.results) {
    if (r.cod_uai && !byUai.has(r.cod_uai)) byUai.set(r.cod_uai, r);
  }
  const byRegion = new Map<string, Rec[]>();
  for (const r of byUai.values()) {
    const reg = r.region_etab_aff ?? "?";
    if (!byRegion.has(reg)) byRegion.set(reg, []);
    byRegion.get(reg)!.push(r);
  }
  const picked: Rec[] = [];
  const queues = [...byRegion.values()];
  while (picked.length < count && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (picked.length >= count) break;
      const r = q.shift();
      if (r) picked.push(r);
    }
  }

  const ref = matchRef("BTS SIO Services informatiques aux organisations");
  if (!ref) throw new Error("Référence BTS SIO introuvable dans it-formation-refs.ts");

  const rows = picked.map((r) => {
    const school = (r.g_ea_lib_vx ?? "").trim();
    const city = cleanCity(r.ville_etab);
    const isPrivate = /priv/i.test(r.contrat_etab ?? "");
    const capa = typeof r.capa_fin === "number" ? r.capa_fin : null;
    const taux = typeof r.taux_acces_ens === "number" ? r.taux_acces_ens : null;
    const desc =
      ref.description +
      (capa ? ` Capacité indicative : ${capa} places.` : "") +
      (taux != null ? ` Taux d'accès : ${taux}%.` : "");

    const cell: Record<string, string> = {
      source: "parcoursup",
      sourceUrl: r.lien_form_psup ?? "",
      countryRef: "FR",
      formationCode: "BTS",
      formationLabel: "BTS Services informatiques aux organisations (SIO)",
      title: `BTS SIO — ${school}`,
      level: "bachelor",
      durationYears: String(ref.durationYears),
      description: desc,
      schoolName: school,
      schoolCity: city,
      schoolType: (r.contrat_etab ?? "").toLowerCase().includes("priv") ? "privé" : "public",
      schoolWebsiteUrl: "",
      schoolUai: (r.cod_uai ?? "").trim().toUpperCase(),
      languageCode: "fr",
      languageMinLevel: "B2",
      costPerYear: isPrivate ? "5000" : "0",
      admissionPlatform: "parcoursup",
      applicationOpens: "",
      applicationCloses: "",
      applicationFee: "0",
      workStudy: "false",
      resultingDiplomaCode: "BTS_BACHELOR",
      resultingDiplomaLabel: "BTS SIO (Bac+2)",
      acceptedDiplomas: ref.acceptedDiplomas.join("|"),
      domains: ref.domains.join("|"),
      outcomesJobs: ref.outcomesJobs.join("|"),
      outcomesNextLevels: ref.outcomesNextLevels.join("|"),
      internationallyRecognizedIn: "FR",
      documents: "",
      recommendsInternshipWeeks: String(ref.recommendsInternshipWeeks),
      isCurated: "true",
    };
    return HEADER.map((h) => csvCell(cell[h] ?? "")).join(",");
  });

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, [HEADER.join(","), ...rows].join("\n") + "\n", "utf8");
  console.log(`\n${rows.length} fiches écrites → ${OUT}`);
  console.log("Aperçu (établissement · ville · UAI) :");
  for (const r of picked) {
    console.log(`  · ${(r.g_ea_lib_vx ?? "").trim()} — ${cleanCity(r.ville_etab)} — ${r.cod_uai}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
