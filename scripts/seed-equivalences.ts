/**
 * Seed du graphe d'équivalences entre diplômes pour la verticale Tech FR.
 *
 * Le graphe est lu par les engines feasibility / reverseRoutes / planB pour
 * répondre à « avec mon BTS SIO, qu'est-ce qui m'accepte ? » et inversement.
 * Sans ce seed, le reverse-routing (différenciateur #1 du projet) ne marche
 * pas — il manque les passerelles entre niveaux.
 *
 * Convention des `kind` (cf. schema.ts) :
 *   - `equivalent`     → A vaut B en pratique (ex: BUT Info ≡ Bachelor Info)
 *   - `acceptedAs`     → A donne accès à B (dossier suffit, pas de passerelle)
 *   - `requiresBridge` → A donne accès à B mais nécessite un module / une
 *                        année de prérequis / un concours spécifique
 *   - `notRecognized`  → A ne donne PAS accès à B (utile pour bloquer des
 *                        suggestions absurdes côté reverse-routing)
 *
 * Convention des `weight` (0..100) :
 *   - 90-100 : route fluide, taux d'admission élevé
 *   - 70-89  : route classique mais sélective
 *   - 50-69  : route atypique, nécessite un bon dossier
 *   - 30-49  : route rare, exceptions
 *   - 0-29   : route quasi-fermée
 *
 * Les weights sont des **estimations d'expert** — à raffiner avec des données
 * d'admission réelles (Parcoursup, Mon Master) quand on les aura. Ils ne
 * doivent JAMAIS être affichés comme des probabilités sans intervalle de
 * confiance côté UI.
 *
 * Idempotent : UPSERT par id. Tu peux relancer sans crainte.
 *
 * Usage : pnpm seed:equivalences
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { sql } from "drizzle-orm";
import { createDb, equivalenceEdges, type EquivalenceEdgeInsert } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

type Kind = "equivalent" | "acceptedAs" | "requiresBridge" | "notRecognized";
type Edge = { from: string; to: string; kind: Kind; weight: number; note?: string };

const EDGES: Edge[] = [
  // ─────────── Famille 1 — Bac → BTS SIO (6 edges) ───────────
  { from: "BAC_GENERAL", to: "BTS_SIO_SISR", kind: "acceptedAs", weight: 90, note: "Voie naturelle depuis le bac général, en particulier spé NSI/Maths" },
  { from: "BAC_GENERAL", to: "BTS_SIO_SLAM", kind: "acceptedAs", weight: 90 },
  { from: "BAC_TECHNO", to: "BTS_SIO_SISR", kind: "acceptedAs", weight: 75, note: "STI2D et STMG-SIG ouvrent à BTS SIO ; bons dossiers acceptés" },
  { from: "BAC_TECHNO", to: "BTS_SIO_SLAM", kind: "acceptedAs", weight: 75 },
  { from: "BAC_PRO", to: "BTS_SIO_SISR", kind: "acceptedAs", weight: 60, note: "Bac pro SN ou MELEC privilégié ; nécessite un bon dossier" },
  { from: "BAC_PRO", to: "BTS_SIO_SLAM", kind: "acceptedAs", weight: 60 },

  // ─────────── Famille 2 — Bac → BUT/Licence/Prépa (13 edges) ───────────
  { from: "BAC_GENERAL", to: "DUT_INFO", kind: "acceptedAs", weight: 90, note: "Spé NSI ou Maths recommandée" },
  { from: "BAC_GENERAL", to: "LICENCE_INFO", kind: "acceptedAs", weight: 95 },
  { from: "BAC_GENERAL", to: "LICENCE_MATHS", kind: "acceptedAs", weight: 95 },
  { from: "BAC_GENERAL", to: "PREPA_MP", kind: "acceptedAs", weight: 85, note: "Très sélectif, dossier scientifique solide requis" },
  { from: "BAC_GENERAL", to: "PREPA_PC", kind: "acceptedAs", weight: 85 },
  { from: "BAC_GENERAL", to: "PREPA_PSI", kind: "acceptedAs", weight: 80 },
  { from: "BAC_GENERAL", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 85, note: "Voie écoles privées post-bac (Epitech, Epita, etc.)" },
  { from: "BAC_GENERAL", to: "BACHELOR_CYBER", kind: "acceptedAs", weight: 80 },
  { from: "BAC_TECHNO", to: "DUT_INFO", kind: "acceptedAs", weight: 80 },
  { from: "BAC_TECHNO", to: "LICENCE_INFO", kind: "acceptedAs", weight: 60, note: "Admission spécifique, suivi en parcours adapté souvent" },
  { from: "BAC_TECHNO", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 75 },
  { from: "BAC_PRO", to: "DUT_INFO", kind: "acceptedAs", weight: 50, note: "Rare, dossier exceptionnel ; STS souvent préféré" },
  { from: "BAC_PRO", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 55 },

  // ─────────── Famille 3 — BTS SIO → poursuite (14 edges) ───────────
  { from: "BTS_SIO_SISR", to: "LP_ASUR", kind: "acceptedAs", weight: 95, note: "Continuité métier directe (admin & sécurité réseaux)" },
  { from: "BTS_SIO_SISR", to: "LP_CYBER_CNAM", kind: "acceptedAs", weight: 90 },
  { from: "BTS_SIO_SISR", to: "LICENCE_INFO", kind: "acceptedAs", weight: 60, note: "Admission L2 ou L3 sur dossier ; remise à niveau math/algo possible" },
  { from: "BTS_SIO_SISR", to: "DUT_INFO", kind: "acceptedAs", weight: 70, note: "Admission en 3e année (BUT3) — voie peu utilisée mais possible" },
  { from: "BTS_SIO_SISR", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 75 },
  { from: "BTS_SIO_SISR", to: "BACHELOR_CYBER", kind: "acceptedAs", weight: 80, note: "Voie naturelle pour spécialisation cyber" },
  { from: "BTS_SIO_SISR", to: "DIPLOME_INGE", kind: "requiresBridge", weight: 55, note: "Admission parallèle via concours type FCBC ou Cycle Préparatoire Intégré ; dossier + entretien" },
  { from: "BTS_SIO_SISR", to: "MASTER_CYBER", kind: "requiresBridge", weight: 30, note: "Rare ; il faut passer par LP/L3 d'abord" },
  { from: "BTS_SIO_SLAM", to: "LP_ASUR", kind: "acceptedAs", weight: 65, note: "Moins direct ; SLAM est dev, ASUR est ops" },
  { from: "BTS_SIO_SLAM", to: "LICENCE_INFO", kind: "acceptedAs", weight: 60 },
  { from: "BTS_SIO_SLAM", to: "DUT_INFO", kind: "acceptedAs", weight: 70 },
  { from: "BTS_SIO_SLAM", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 80 },
  { from: "BTS_SIO_SLAM", to: "DIPLOME_INGE", kind: "requiresBridge", weight: 55 },
  { from: "BTS_SIO_SLAM", to: "MASTER_IA", kind: "requiresBridge", weight: 25, note: "Très rare, nécessite L3 + remise à niveau maths" },

  // ─────────── Famille 4 — BTS SIO réorientation intra (2 edges) ───────────
  { from: "BTS_SIO_SISR", to: "BTS_SIO_SLAM", kind: "acceptedAs", weight: 60, note: "Réorientation 2e année possible avec accord conseil de classe" },
  { from: "BTS_SIO_SLAM", to: "BTS_SIO_SISR", kind: "acceptedAs", weight: 60 },

  // ─────────── Famille 5 — DUT/BUT INFO → poursuite (9 edges) ───────────
  { from: "DUT_INFO", to: "LICENCE_INFO", kind: "equivalent", weight: 95, note: "BUT Info ≡ Licence Info niveau Bac+3 — admission Master directe" },
  { from: "DUT_INFO", to: "LP_ASUR", kind: "acceptedAs", weight: 85 },
  { from: "DUT_INFO", to: "LP_CYBER_CNAM", kind: "acceptedAs", weight: 85 },
  { from: "DUT_INFO", to: "BACHELOR_INFO", kind: "equivalent", weight: 95 },
  { from: "DUT_INFO", to: "BACHELOR_CYBER", kind: "acceptedAs", weight: 85 },
  { from: "DUT_INFO", to: "MASTER_IA", kind: "acceptedAs", weight: 75, note: "Admission M1 ; les bonnes BUT (Vannes, Lannion, Orsay) ouvrent souvent" },
  { from: "DUT_INFO", to: "MASTER_CYBER", kind: "acceptedAs", weight: 80 },
  { from: "DUT_INFO", to: "MASTER_MBDS", kind: "acceptedAs", weight: 80 },
  { from: "DUT_INFO", to: "DIPLOME_INGE", kind: "acceptedAs", weight: 80, note: "Admission parallèle 3e année — voie classique post-BUT" },

  // ─────────── Famille 6 — Licence → Master/École (9 edges) ───────────
  { from: "LICENCE_INFO", to: "MASTER_IA", kind: "equivalent", weight: 95 },
  { from: "LICENCE_INFO", to: "MASTER_CYBER", kind: "equivalent", weight: 95 },
  { from: "LICENCE_INFO", to: "MASTER_MBDS", kind: "equivalent", weight: 95 },
  { from: "LICENCE_INFO", to: "DIPLOME_INGE", kind: "acceptedAs", weight: 70, note: "Admission L3/M1 dans la plupart des écoles d'ingé info" },
  { from: "LICENCE_INFO", to: "DUT_INFO", kind: "notRecognized", weight: 0, note: "Retour en arrière non pertinent" },
  { from: "LICENCE_MATHS", to: "LICENCE_INFO", kind: "acceptedAs", weight: 75, note: "Passerelle L3 sur dossier, niveau math très bon" },
  { from: "LICENCE_MATHS", to: "MASTER_IA", kind: "acceptedAs", weight: 85, note: "Bonne prépa au M1 IA ; manque parfois en pratique algorithmique" },
  { from: "LICENCE_MATHS", to: "DIPLOME_INGE", kind: "acceptedAs", weight: 80 },
  { from: "LICENCE_MATHS", to: "MASTER_CYBER", kind: "acceptedAs", weight: 65 },

  // ─────────── Famille 7 — Licence Pro → poursuite (6 edges) ───────────
  // Les LP sont terminales par construction — peu de poursuite, mais possible
  { from: "LP_ASUR", to: "MASTER_CYBER", kind: "requiresBridge", weight: 45, note: "Rare, dossier exceptionnel + entretien" },
  { from: "LP_ASUR", to: "MASTER_IA", kind: "requiresBridge", weight: 30 },
  { from: "LP_ASUR", to: "DIPLOME_INGE", kind: "requiresBridge", weight: 40, note: "Admission parallèle possible si très bon dossier" },
  { from: "LP_CYBER_CNAM", to: "MASTER_CYBER", kind: "acceptedAs", weight: 65, note: "CNAM a des passerelles internes vers Master Cyber" },
  { from: "LP_CYBER_CNAM", to: "MASTER_IA", kind: "requiresBridge", weight: 30 },
  { from: "LP_CYBER_CNAM", to: "DIPLOME_INGE", kind: "requiresBridge", weight: 40 },

  // ─────────── Famille 8 — Bachelor → Master/École (6 edges) ───────────
  { from: "BACHELOR_INFO", to: "MASTER_IA", kind: "acceptedAs", weight: 85 },
  { from: "BACHELOR_INFO", to: "MASTER_CYBER", kind: "acceptedAs", weight: 85 },
  { from: "BACHELOR_INFO", to: "MASTER_MBDS", kind: "acceptedAs", weight: 85 },
  { from: "BACHELOR_INFO", to: "DIPLOME_INGE", kind: "acceptedAs", weight: 75, note: "Admission parallèle ou continuation en cycle ingénieur (Epitech→Master, etc.)" },
  { from: "BACHELOR_CYBER", to: "MASTER_CYBER", kind: "equivalent", weight: 95 },
  { from: "BACHELOR_CYBER", to: "MASTER_IA", kind: "acceptedAs", weight: 75 },

  // ─────────── Famille 9 — Prépa → École ingé (12 edges) ───────────
  { from: "PREPA_MP", to: "DIPLOME_INGE", kind: "equivalent", weight: 95, note: "Voie royale via concours CCMP, CCINP, Mines, Centrale, X" },
  { from: "PREPA_PC", to: "DIPLOME_INGE", kind: "equivalent", weight: 95 },
  { from: "PREPA_PSI", to: "DIPLOME_INGE", kind: "equivalent", weight: 95 },
  { from: "PREPA_BCPST", to: "DIPLOME_INGE", kind: "acceptedAs", weight: 80, note: "Écoles agro/vivant ; peu d'options pures info" },
  { from: "PREPA_MP", to: "LICENCE_INFO", kind: "acceptedAs", weight: 90, note: "Équivalence Bac+2 + admission L3 sur dossier" },
  { from: "PREPA_PC", to: "LICENCE_INFO", kind: "acceptedAs", weight: 80 },
  { from: "PREPA_PSI", to: "LICENCE_INFO", kind: "acceptedAs", weight: 80 },
  { from: "PREPA_MP", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 90, note: "Admission directe en 3e année dans la plupart des bachelors info" },
  { from: "PREPA_PC", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 85 },
  { from: "PREPA_PSI", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 85 },
  { from: "PREPA_MP", to: "MASTER_IA", kind: "requiresBridge", weight: 40, note: "Atypique : il faut faire L3 d'abord" },
  { from: "PREPA_MP", to: "MASTER_CYBER", kind: "requiresBridge", weight: 40 },

  // ─────────── Famille 10 — Internationaux → Bac/FR (12 edges) ───────────
  { from: "A_LEVEL", to: "BAC_GENERAL", kind: "equivalent", weight: 90, note: "Reconnaissance Erasmus/EHEA" },
  { from: "ABITUR", to: "BAC_GENERAL", kind: "equivalent", weight: 90 },
  { from: "HS_DIPLOMA", to: "BAC_GENERAL", kind: "equivalent", weight: 80, note: "Sous condition de GPA et SAT" },
  { from: "STPM", to: "BAC_GENERAL", kind: "acceptedAs", weight: 80, note: "Via Campus France ; dossier requis" },
  { from: "A_LEVEL", to: "LICENCE_INFO", kind: "acceptedAs", weight: 85, note: "Admission universitaire FR via Études en France" },
  { from: "A_LEVEL", to: "DIPLOME_INGE", kind: "requiresBridge", weight: 60, note: "Concours FCBC ou admission directe selon école" },
  { from: "ABITUR", to: "LICENCE_INFO", kind: "acceptedAs", weight: 90 },
  { from: "ABITUR", to: "DIPLOME_INGE", kind: "requiresBridge", weight: 65 },
  { from: "HS_DIPLOMA", to: "LICENCE_INFO", kind: "acceptedAs", weight: 70 },
  { from: "HS_DIPLOMA", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 75 },
  { from: "STPM", to: "LICENCE_INFO", kind: "acceptedAs", weight: 65, note: "Dossier Campus France + niveau français B2 requis" },
  { from: "STPM", to: "BACHELOR_INFO", kind: "acceptedAs", weight: 75 },

  // ─────────── Famille 11 — Sortie internationale FR → bachelor étranger (8 edges) ───────────
  { from: "LICENCE_INFO", to: "BSC_MANCHESTER", kind: "acceptedAs", weight: 60, note: "Admission Master direct (Bac+3 ≡ BSc) ; pas un BSc de plein droit" },
  { from: "LICENCE_INFO", to: "BSC_TUM", kind: "acceptedAs", weight: 70, note: "Reconnaissance EHEA simplifiée" },
  { from: "DUT_INFO", to: "BSC_MANCHESTER", kind: "acceptedAs", weight: 65 },
  { from: "DUT_INFO", to: "BSC_TUM", kind: "acceptedAs", weight: 75 },
  { from: "BACHELOR_INFO", to: "BSC_MANCHESTER", kind: "acceptedAs", weight: 75, note: "Admission Master via dossier ; le bachelor FR souvent reconnu" },
  { from: "BACHELOR_INFO", to: "BSC_TUM", kind: "acceptedAs", weight: 80 },
  { from: "BTS_SIO_SISR", to: "BSC_MANCHESTER", kind: "requiresBridge", weight: 35, note: "Via foundation year ou top-up year" },
  { from: "BTS_SIO_SLAM", to: "BSC_TUM", kind: "requiresBridge", weight: 35 },

  // ─────────── Famille 12 — Master → Master (réorientation spé) (8 edges) ───────────
  { from: "MASTER_IA", to: "MASTER_CYBER", kind: "acceptedAs", weight: 60, note: "Réorientation M2 selon spé proposée par l'université" },
  { from: "MASTER_IA", to: "MASTER_MBDS", kind: "acceptedAs", weight: 70 },
  { from: "MASTER_CYBER", to: "MASTER_IA", kind: "acceptedAs", weight: 60 },
  { from: "MASTER_CYBER", to: "MASTER_MBDS", kind: "acceptedAs", weight: 65 },
  { from: "MASTER_MBDS", to: "MASTER_IA", kind: "acceptedAs", weight: 70 },
  { from: "MASTER_MBDS", to: "MASTER_CYBER", kind: "acceptedAs", weight: 65 },
  { from: "MASTER_IA", to: "DIPLOME_INGE", kind: "acceptedAs", weight: 50, note: "Rare : passerelle vers cycle ingénieur via M2 spé" },
  { from: "MASTER_CYBER", to: "DIPLOME_INGE", kind: "acceptedAs", weight: 55 },

  // ─────────── Famille 13 — DIPLOME_INGE → autres (5 edges) ───────────
  { from: "DIPLOME_INGE", to: "MASTER_IA", kind: "acceptedAs", weight: 90, note: "Double diplôme courant, surtout en 3e année" },
  { from: "DIPLOME_INGE", to: "MASTER_CYBER", kind: "acceptedAs", weight: 90 },
  { from: "DIPLOME_INGE", to: "MASTER_MBDS", kind: "acceptedAs", weight: 85 },
  { from: "DIPLOME_INGE", to: "LICENCE_INFO", kind: "equivalent", weight: 100, note: "Bac+5 contient Bac+3 universitaire" },
  { from: "DIPLOME_INGE", to: "BACHELOR_INFO", kind: "equivalent", weight: 100 },

  // ─────────── Famille 14 — Master → niveaux inférieurs (équivalences descendantes, 5 edges) ───────────
  { from: "MASTER_IA", to: "LICENCE_INFO", kind: "equivalent", weight: 100, note: "Bac+5 contient Bac+3" },
  { from: "MASTER_CYBER", to: "LICENCE_INFO", kind: "equivalent", weight: 100 },
  { from: "MASTER_MBDS", to: "LICENCE_INFO", kind: "equivalent", weight: 100 },
  { from: "MASTER_IA", to: "BACHELOR_INFO", kind: "equivalent", weight: 100 },
  { from: "MASTER_CYBER", to: "BACHELOR_CYBER", kind: "equivalent", weight: 100 },
];

function edgeId(e: Edge): string {
  return `${e.from}__${e.kind}__${e.to}`;
}

async function main() {
  const db = createDb(DB_PATH);
  console.log(`Seeding ${EDGES.length} equivalence edges…`);

  const rows: EquivalenceEdgeInsert[] = EDGES.map((e) => ({
    id: edgeId(e),
    from: e.from,
    to: e.to,
    kind: e.kind,
    weight: e.weight,
    note: e.note ?? null,
  }));

  // UPSERT par id : si l'edge existe déjà (même triplet from/kind/to), on met
  // à jour weight et note. Permet de relancer sans dupliquer.
  await db
    .insert(equivalenceEdges)
    .values(rows)
    .onConflictDoUpdate({
      target: equivalenceEdges.id,
      set: {
        weight: sql`excluded.weight_x100`,
        note: sql`excluded.note`,
        updatedAt: sql`(unixepoch())`,
      },
    });

  console.log(`OK — ${rows.length} edges upserted.`);

  // Diagnostic : répartition par kind, top "from" et top "to"
  const rs = (sqlText: string) =>
    db.all(sql.raw(sqlText)) as unknown as Promise<Array<Record<string, unknown>>>;
  const byKind = await rs(
    `SELECT kind, COUNT(*) as n FROM equivalence_edges GROUP BY kind ORDER BY n DESC`,
  );
  console.log("\n=== Distribution par kind ===");
  for (const r of byKind) console.log(` ${String(r.kind).padEnd(18)} ${r.n}`);

  const topFrom = await rs(
    `SELECT from_code, COUNT(*) as n FROM equivalence_edges GROUP BY from_code ORDER BY n DESC LIMIT 10`,
  );
  console.log("\n=== Top diplômes (sorties — d'où partent les routes) ===");
  for (const r of topFrom) console.log(` ${String(r.from_code).padEnd(20)} ${r.n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
