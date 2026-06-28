import { eq, and, ne, sql } from "drizzle-orm";
import { programs, ingestionRuns, type Db } from "@akjol/db";
import type { IngestSource, NormalizedProgram, RunStats, SourceAdapter } from "./types.js";
import { hashProgram } from "./util/hash.js";

/**
 * Boucle principale d'ingestion :
 *  1. Crée une ligne ingestion_runs (status = "running").
 *  2. Itère le SourceAdapter, calcule le hash, INSERT/UPDATE/UNCHANGED.
 *  3. À la fin, déprécie les programmes du même source qui n'ont pas été
 *     "vus" pendant ce run (probablement supprimés à la source).
 *  4. Met à jour ingestion_runs avec stats finales.
 *
 * On ne supprime jamais : on flag `deprecated = true`. Le front pourra
 * les masquer / les afficher avec un badge "fermé".
 */
export async function runIngestion(db: Db, adapter: SourceAdapter): Promise<RunStats> {
  const startedAt = new Date();
  const stats: RunStats = {
    source: adapter.source,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    deprecated: 0,
    errors: 0,
    startedAt,
    finishedAt: startedAt,
    notes: [],
  };

  const [run] = await db
    .insert(ingestionRuns)
    .values({ source: adapter.source, status: "running" })
    .returning();

  const seenSourceIds = new Set<string>();

  try {
    for await (const program of adapter.iterate()) {
      try {
        const seen = await upsertOne(db, program);
        seenSourceIds.add(program.sourceId);
        stats[seen]++;
      } catch (err) {
        stats.errors++;
        if (stats.errors <= 10) {
          stats.notes.push(
            `error on ${program.sourceId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    stats.deprecated = await deprecateMissing(db, adapter.source, seenSourceIds, startedAt);
  } catch (err) {
    stats.errors++;
    stats.notes.push(`fatal: ${err instanceof Error ? err.message : String(err)}`);
    await db
      .update(ingestionRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        inserted: stats.inserted,
        updated: stats.updated,
        unchanged: stats.unchanged,
        deprecated: stats.deprecated,
        errors: stats.errors,
        notes: stats.notes.join("\n"),
      })
      .where(eq(ingestionRuns.id, run.id));
    stats.finishedAt = new Date();
    return stats;
  }

  stats.finishedAt = new Date();

  await db
    .update(ingestionRuns)
    .set({
      status: "success",
      finishedAt: stats.finishedAt,
      inserted: stats.inserted,
      updated: stats.updated,
      unchanged: stats.unchanged,
      deprecated: stats.deprecated,
      errors: stats.errors,
      notes: stats.notes.join("\n") || null,
    })
    .where(eq(ingestionRuns.id, run.id));

  return stats;
}

async function upsertOne(
  db: Db,
  p: NormalizedProgram,
): Promise<"inserted" | "updated" | "unchanged"> {
  const contentHash = hashProgram(p);

  const existing = await db
    .select({ contentHash: programs.contentHash })
    .from(programs)
    .where(and(eq(programs.source, p.source), eq(programs.sourceId, p.sourceId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(programs).values({
      id: p.id,
      source: p.source,
      sourceId: p.sourceId,
      sourceUrl: p.sourceUrl,
      contentHash,
      lastIngestedAt: new Date(),
      deprecated: false,

      countryRef: p.countryRef,
      formationCode: p.formationCode,
      formationLabel: p.formationLabel,
      title: p.title,
      level: p.level,
      durationYears: p.durationYears,
      description: p.description,

      schoolName: p.schoolName,
      schoolCity: p.schoolCity,
      schoolType: p.schoolType,
      schoolWebsiteUrl: p.schoolWebsiteUrl,
      schoolUai: p.schoolUai ?? null,

      languageCode: p.languageCode,
      languageMinLevel: p.languageMinLevel,
      costPerYear: p.costPerYear,
      admissionPlatform: p.admissionPlatform,
      applicationOpens: p.applicationOpens,
      applicationCloses: p.applicationCloses,
      applicationFee: p.applicationFee,
      workStudy: p.workStudy,

      resultingDiplomaCode: p.resultingDiplomaCode,
      resultingDiplomaLabel: p.resultingDiplomaLabel,
      minGrade: p.minGrade ? JSON.stringify(p.minGrade) : null,

      acceptedDiplomas: JSON.stringify(p.acceptedDiplomas),
      domains: JSON.stringify(p.domains),
      outcomesJobs: JSON.stringify(p.outcomesJobs),
      outcomesNextLevels: JSON.stringify(p.outcomesNextLevels),
      internationallyRecognizedIn: JSON.stringify(p.internationallyRecognizedIn),
      documents: JSON.stringify(p.documents),
      optionalSteps: p.optionalSteps ? JSON.stringify(p.optionalSteps) : null,
      recommendsCertificate: p.recommendsCertificate
        ? JSON.stringify(p.recommendsCertificate)
        : null,
      recommendsInternshipWeeks: p.recommendsInternshipWeeks,
    });
    return "inserted";
  }

  if (existing[0].contentHash === contentHash) {
    // Touche juste lastIngestedAt (preuve qu'on l'a re-vu) sans réécrire le reste.
    await db
      .update(programs)
      .set({ lastIngestedAt: new Date(), deprecated: false, deprecatedAt: null })
      .where(and(eq(programs.source, p.source), eq(programs.sourceId, p.sourceId)));
    return "unchanged";
  }

  await db
    .update(programs)
    .set({
      contentHash,
      lastIngestedAt: new Date(),
      sourceUrl: p.sourceUrl,
      deprecated: false,
      deprecatedAt: null,

      countryRef: p.countryRef,
      formationCode: p.formationCode,
      formationLabel: p.formationLabel,
      title: p.title,
      level: p.level,
      durationYears: p.durationYears,
      description: p.description,

      schoolName: p.schoolName,
      schoolCity: p.schoolCity,
      schoolType: p.schoolType,
      schoolWebsiteUrl: p.schoolWebsiteUrl,
      schoolUai: p.schoolUai ?? null,

      languageCode: p.languageCode,
      languageMinLevel: p.languageMinLevel,
      costPerYear: p.costPerYear,
      admissionPlatform: p.admissionPlatform,
      applicationOpens: p.applicationOpens,
      applicationCloses: p.applicationCloses,
      applicationFee: p.applicationFee,
      workStudy: p.workStudy,

      resultingDiplomaCode: p.resultingDiplomaCode,
      resultingDiplomaLabel: p.resultingDiplomaLabel,
      minGrade: p.minGrade ? JSON.stringify(p.minGrade) : null,

      acceptedDiplomas: JSON.stringify(p.acceptedDiplomas),
      domains: JSON.stringify(p.domains),
      outcomesJobs: JSON.stringify(p.outcomesJobs),
      outcomesNextLevels: JSON.stringify(p.outcomesNextLevels),
      internationallyRecognizedIn: JSON.stringify(p.internationallyRecognizedIn),
      documents: JSON.stringify(p.documents),
      optionalSteps: p.optionalSteps ? JSON.stringify(p.optionalSteps) : null,
      recommendsCertificate: p.recommendsCertificate
        ? JSON.stringify(p.recommendsCertificate)
        : null,
      recommendsInternshipWeeks: p.recommendsInternshipWeeks,
    })
    .where(and(eq(programs.source, p.source), eq(programs.sourceId, p.sourceId)));
  return "updated";
}

/**
 * Marque deprecated tous les programmes de cette source qui n'ont pas été
 * touchés pendant le run en cours. Évite la suppression brutale : un programme
 * peut revenir l'année suivante (campagne d'inscription).
 */
async function deprecateMissing(
  db: Db,
  source: IngestSource,
  seen: Set<string>,
  runStartedAt: Date,
): Promise<number> {
  // Tout ce qui appartient à cette source ET n'a pas été touché ce run = stale.
  // On compare via lastIngestedAt < runStartedAt (les rows freshly upsert ont
  // lastIngestedAt >= runStartedAt). On évite ainsi un IN (...) géant.
  const stale = await db
    .select({ sourceId: programs.sourceId })
    .from(programs)
    .where(
      and(
        eq(programs.source, source),
        eq(programs.deprecated, false),
        sql`${programs.lastIngestedAt} < ${Math.floor(runStartedAt.getTime() / 1000)}`,
      ),
    );

  let count = 0;
  for (const row of stale) {
    if (seen.has(row.sourceId)) continue; // safety net
    await db
      .update(programs)
      .set({ deprecated: true, deprecatedAt: new Date() })
      .where(and(eq(programs.source, source), eq(programs.sourceId, row.sourceId)));
    count++;
  }
  return count;
}
