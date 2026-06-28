/**
 * Enrichissement LLM des fiches brutes (Pipeline B).
 *
 * Problème résolu : les fiches ingérées (ONISEP/Parcoursup, isCurated=false) ont
 * un squelette correct mais les champs *utiles* sont vides — débouchés, diplômes
 * acceptés, description riche, niveaux de poursuite. Les remplir à la main est
 * exactement ce qui est "vite chiant". Ce script les remplit avec Claude :
 *
 *   1. Sélectionne les fiches brutes du domaine informatique Bac+2/3.
 *   2. (optionnel) récupère le texte de la page de l'école pour donner du contexte.
 *   3. Appelle Claude en *structured outputs* (JSON garanti conforme au schéma).
 *   4. Écrit les champs en base — sans curer (review humaine en /admin ensuite).
 *
 * Sécurité du flux : par défaut DRY-RUN (n'écrit rien, affiche). Il faut --apply
 * pour écrire, et --curate en plus pour passer isCurated=true automatiquement.
 *
 * Pré-requis : ANTHROPIC_API_KEY dans .env.local + `pnpm add -w @anthropic-ai/sdk`.
 *
 * Usage :
 *   pnpm enrich:llm -- --limit 10                 # dry-run sur 10 fiches
 *   pnpm enrich:llm -- --limit 50 --apply         # écrit les champs (reste à curer)
 *   pnpm enrich:llm -- --apply --curate           # écrit + cure (à n'utiliser qu'en confiance)
 *   pnpm enrich:llm -- --apply --no-fetch         # sans aller chercher la page école (plus rapide)
 *
 * Modèle : claude-opus-4-8 par défaut (le plus capable). Pour réduire le coût sur
 * un gros volume, surcharger : AKJOL_ENRICH_MODEL=claude-haiku-4-5 pnpm enrich:llm ...
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { createDb, programs, type ProgramRow } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");
const MODEL = process.env.AKJOL_ENRICH_MODEL ?? "claude-opus-4-8";

// Mots-clés informatique (miroir du filtre Parcoursup, côté SQL/JS).
const IT_KEYWORDS = [
  "informatique",
  "numérique",
  "réseaux",
  "cybersécurité",
  "données",
  "data",
  "développement",
  "logiciel",
  "multimédia",
  "sio",
  "snir",
  "ciel",
  "mmi",
];

const IT_LEVELS = new Set(["bachelor", "licence", "licence_pro"]);

const ENRICH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    description: {
      type: "string",
      description: "Description claire de la formation en 2-4 phrases, en français.",
    },
    domains: {
      type: "array",
      items: { type: "string" },
      description: "Domaines/sous-domaines (ex: 'Développement web', 'Réseaux').",
    },
    outcomesJobs: {
      type: "array",
      items: { type: "string" },
      description: "Métiers/débouchés concrets après cette formation.",
    },
    acceptedDiplomas: {
      type: "array",
      items: { type: "string" },
      description: "Diplômes/bacs typiquement acceptés en entrée (ex: 'Bac général', 'Bac STI2D').",
    },
    outcomesNextLevels: {
      type: "array",
      items: {
        type: "string",
        enum: ["licence", "licence_pro", "bachelor", "master", "ecole_inge", "doctorat"],
      },
      description: "Niveaux de poursuite d'études possibles, codes AkJol.",
    },
    recommendsInternshipWeeks: {
      type: "integer",
      description: "Semaines de stage indicatives (0 si inconnu).",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
      description: "Confiance globale dans les valeurs renvoyées.",
    },
  },
  required: [
    "description",
    "domains",
    "outcomesJobs",
    "acceptedDiplomas",
    "outcomesNextLevels",
    "recommendsInternshipWeeks",
    "confidence",
  ],
} as const;

type Enrichment = {
  description: string;
  domains: string[];
  outcomesJobs: string[];
  acceptedDiplomas: string[];
  outcomesNextLevels: string[];
  recommendsInternshipWeeks: number;
  confidence: "low" | "medium" | "high";
};

function parseFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

/** Récupère le texte brut d'une page web (best-effort), tronqué pour le prompt. */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 6000) || null;
  } catch {
    return null;
  }
}

function buildPrompt(p: ProgramRow, pageText: string | null): string {
  return [
    "Tu enrichis une fiche de formation pour une plateforme d'orientation française.",
    "À partir des informations ci-dessous, renvoie des champs précis et factuels.",
    "Si une information est incertaine, reste prudent et baisse la confiance.",
    "N'invente pas de chiffres de stage ; mets 0 si inconnu.",
    "",
    `Titre : ${p.title}`,
    `Formation : ${p.formationLabel} (code ${p.formationCode}, niveau ${p.level})`,
    `Établissement : ${p.schoolName} — ${p.schoolCity}`,
    p.sourceUrl ? `Source : ${p.sourceUrl}` : "",
    pageText ? `\nExtrait de la page de l'établissement :\n${pageText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const curate = argv.includes("--curate");
  const noFetch = argv.includes("--no-fetch");
  const limit = Number(parseFlag(argv, "--limit") ?? "10");

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquant (à mettre dans .env.local).");
  }

  const db = createDb(DB_PATH);
  const client = new Anthropic();

  // Pool de candidats : fiches non curées, informatique, niveaux Bac+2/3,
  // dont la description est encore pauvre OU les débouchés vides.
  const candidates = (
    await db.select().from(programs).where(eq(programs.isCurated, false))
  ).filter((p) => {
    if (!IT_LEVELS.has(p.level)) return false;
    const hay = `${p.title} ${p.formationLabel}`.toLowerCase();
    const isIt = IT_KEYWORDS.some((k) => hay.includes(k));
    if (!isIt) return false;
    const thinDesc = (p.description ?? "").length < 120;
    const noJobs = (p.outcomesJobs ?? "[]") === "[]";
    return thinDesc || noJobs;
  });

  const batch = candidates.slice(0, limit);
  console.log(
    `${candidates.length} fiches info Bac+2/3 à enrichir ; traitement de ${batch.length}.`,
  );
  console.log(`Modèle: ${MODEL} | mode: ${apply ? (curate ? "APPLY+CURATE" : "APPLY") : "DRY-RUN"}\n`);

  let ok = 0;
  let failed = 0;

  for (const p of batch) {
    const pageText = !noFetch && p.sourceUrl ? await fetchPageText(p.sourceUrl) : null;

    let enrich: Enrichment;
    try {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        output_config: { format: { type: "json_schema", schema: ENRICH_SCHEMA }, effort: "low" },
        messages: [{ role: "user", content: buildPrompt(p, pageText) }],
      });
      const textBlock = resp.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") throw new Error("réponse sans texte");
      enrich = JSON.parse(textBlock.text) as Enrichment;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${p.id}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    console.log(`  • [${enrich.confidence}] ${p.title}`);
    console.log(`      débouchés: ${enrich.outcomesJobs.join(", ") || "—"}`);

    if (apply) {
      await db
        .update(programs)
        .set({
          description: enrich.description || p.description,
          domains: JSON.stringify(enrich.domains),
          outcomesJobs: JSON.stringify(enrich.outcomesJobs),
          acceptedDiplomas: JSON.stringify(enrich.acceptedDiplomas),
          outcomesNextLevels: JSON.stringify(enrich.outcomesNextLevels),
          recommendsInternshipWeeks:
            enrich.recommendsInternshipWeeks > 0 ? enrich.recommendsInternshipWeeks : null,
          ...(curate ? { isCurated: true } : {}),
        })
        .where(eq(programs.id, p.id));
    }
    ok++;
  }

  console.log(`\nTerminé. enrichies=${ok} échecs=${failed}.`);
  if (!apply) console.log("DRY-RUN : rien écrit. Relance avec --apply pour persister.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
