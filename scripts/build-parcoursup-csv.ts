/**
 * Générateur CSV GÉNÉRIQUE depuis l'API Parcoursup.
 *
 * UN SEUL script pour TOUTES les formations : le type (BTS SIO, BUT Info, MMI…)
 * est reconnu automatiquement à partir du libellé Parcoursup via le dictionnaire
 * it-formation-refs.ts. On ne crée donc PAS un script par formation — on change
 * juste le terme de recherche.
 *
 * Chaque fiche porte un sourceId (cod_aff_form Parcoursup) → import idempotent
 * (ré-importer met à jour au lieu de dupliquer).
 *
 * Exemples :
 *   pnpm build:parcoursup-csv -- --search "informatique aux organisations" --out data/import/bts-sio.csv
 *   pnpm build:parcoursup-csv -- --search "BUT informatique" --out data/import/but-info.csv
 *   pnpm build:parcoursup-csv -- --search "informatique aux organisations" --match "Gustave Eiffel" --count 1 --out data/import/bordeaux.csv
 *
 * Options :
 *   --search "<phrase>"  recherche plein-texte sur le libellé de formation (requis en pratique)
 *   --match  "<substr>"  filtre optionnel sur le nom de l'établissement
 *   --count  N           nombre de fiches (défaut 20), réparties nationalement
 *   --out    <path>      fichier CSV de sortie (défaut data/import/parcoursup.csv)
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { matchRef } from "./data/it-formation-refs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const HEADER = [
  "source","sourceId","sourceUrl","countryRef","formationCode","formationLabel","title","level",
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
  lib_for_voe_ins?: string;
  contrat_etab?: string;
  capa_fin?: number | null;
  taux_acces_ens?: number | null;
  lien_form_psup?: string;
  cod_aff_form?: string;
};

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

async function fetchParcoursup(
  search: string,
  match?: string,
): Promise<{ total: number; rows: Rec[] }> {
  const url = new URL(
    "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/records",
  );
  const where =
    `search(lib_for_voe_ins, "${search}")` +
    (match ? ` and search(g_ea_lib_vx, "${match}")` : "");
  url.searchParams.set("where", where);
  url.searchParams.set(
    "select",
    "cod_uai,g_ea_lib_vx,ville_etab,region_etab_aff,lib_for_voe_ins,contrat_etab,capa_fin,taux_acces_ens,lien_form_psup,cod_aff_form",
  );
  url.searchParams.set("limit", "100");
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`API Parcoursup HTTP ${res.status}`);
  const data = (await res.json()) as { total_count: number; results: Rec[] };
  return { total: data.total_count, rows: data.results };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const search = parseFlag(argv, "--search") ?? "informatique aux organisations";
  const match = parseFlag(argv, "--match");
  const count = Number(parseFlag(argv, "--count") ?? "20");
  const out = resolve(__dirname, "..", parseFlag(argv, "--out") ?? "data/import/parcoursup.csv");

  const { total, rows } = await fetchParcoursup(search, match);
  console.log(
    `API : ${total} résultats pour "${search}"${match ? ` + établissement "${match}"` : ""}, ${rows.length} récupérés.`,
  );

  // Dédup par UAI puis répartition nationale (round-robin par région).
  const byUai = new Map<string, Rec>();
  for (const r of rows) if (r.cod_uai && !byUai.has(r.cod_uai)) byUai.set(r.cod_uai, r);
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

  const lines: string[] = [];
  let skipped = 0;
  for (const r of picked) {
    const ref = matchRef(r.lib_for_voe_ins ?? "");
    if (!ref) {
      skipped++;
      console.warn(`  (ignoré, type non reconnu) ${r.lib_for_voe_ins} — ${r.g_ea_lib_vx}`);
      continue;
    }
    const school = (r.g_ea_lib_vx ?? "").trim();
    const isPrivate = /priv/i.test(r.contrat_etab ?? "");
    const capa = typeof r.capa_fin === "number" ? r.capa_fin : null;
    const taux = typeof r.taux_acces_ens === "number" ? r.taux_acces_ens : null;
    const bacPlus = ref.code === "BTS" ? 2 : 3;
    const desc =
      ref.description +
      (capa ? ` Capacité indicative : ${capa} places.` : "") +
      (taux != null ? ` Taux d'accès : ${taux}%.` : "");

    const cell: Record<string, string> = {
      source: "parcoursup",
      sourceId: (r.cod_aff_form ?? "").trim(),
      sourceUrl: r.lien_form_psup ?? "",
      countryRef: "FR",
      formationCode: ref.code,
      formationLabel: ref.label,
      title: `${ref.short} — ${school}`,
      level: ref.level,
      durationYears: String(ref.durationYears),
      description: desc,
      schoolName: school,
      schoolCity: cleanCity(r.ville_etab),
      schoolType: isPrivate ? "privé" : "public",
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
      resultingDiplomaCode: `${ref.code}_${ref.level.toUpperCase()}`,
      resultingDiplomaLabel: `${ref.short} (Bac+${bacPlus})`,
      acceptedDiplomas: ref.acceptedDiplomas.join("|"),
      domains: ref.domains.join("|"),
      outcomesJobs: ref.outcomesJobs.join("|"),
      outcomesNextLevels: ref.outcomesNextLevels.join("|"),
      internationallyRecognizedIn: "FR",
      documents: "",
      recommendsInternshipWeeks: String(ref.recommendsInternshipWeeks),
      isCurated: "true",
    };
    lines.push(HEADER.map((h) => csvCell(cell[h] ?? "")).join(","));
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, [HEADER.join(","), ...lines].join("\n") + "\n", "utf8");
  console.log(`\n${lines.length} fiche(s) écrite(s) → ${out}${skipped ? ` (${skipped} ignorée[s])` : ""}`);
  for (const r of picked) {
    if (matchRef(r.lib_for_voe_ins ?? ""))
      console.log(`  · ${(r.g_ea_lib_vx ?? "").trim()} — ${cleanCity(r.ville_etab)} — ${r.cod_uai}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
