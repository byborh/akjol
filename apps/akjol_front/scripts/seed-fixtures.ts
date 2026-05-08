/**
 * Pousse les fixtures hardcodées (PROGRAMS + JOBS du front) dans SQLite, via
 * la même table que celle qu'alimente packages/ingest. Idempotent : INSERT
 * OR REPLACE par id.
 *
 * Usage : pnpm --filter akjol seed:fixtures
 *
 * Quand tu auras vraiment branché ONISEP en prod, ce script ne servira plus
 * que pour le dev/démo offline — il reste utile pour que `next dev` ait
 * toujours quelque chose à afficher.
 */
import { createDb, programs, jobs } from "@akjol/db";
import { PROGRAMS } from "../src/data/programs.js";
import { JOBS } from "../src/data/jobs.js";

const DB_PATH = process.env.AKJOL_DB ?? "./data/akjol.db";

function main() {
  const db = createDb(DB_PATH);
  const now = new Date();

  console.log(`[seed-fixtures] writing to ${DB_PATH}`);

  let p = 0;
  for (const prog of PROGRAMS) {
    db.insert(programs)
      .values({
        id: prog.id,
        source: "fixture",
        sourceId: prog.id,
        sourceUrl: prog.school.websiteUrl ?? null,
        contentHash: "fixture-" + prog.id,
        lastIngestedAt: now,
        deprecated: false,

        countryRef: prog.countryRef,
        formationCode: prog.formationCode,
        formationLabel: prog.formationLabel,
        title: prog.title,
        level: prog.level,
        durationYears: prog.durationYears,
        description: prog.description,

        schoolName: prog.school.name,
        schoolCity: prog.school.city,
        schoolType: prog.school.type ?? null,
        schoolWebsiteUrl: prog.school.websiteUrl ?? null,

        languageCode: prog.language.code,
        languageMinLevel: prog.language.minLevel,
        costPerYear: prog.costPerYear,
        admissionPlatform: prog.admissionPlatform,
        applicationOpens: prog.applicationOpens ?? null,
        applicationCloses: prog.applicationCloses ?? null,
        applicationFee: prog.applicationFee ?? null,
        workStudy: prog.workStudy,

        resultingDiplomaCode: prog.resultingDiplomaCode,
        resultingDiplomaLabel: prog.resultingDiplomaLabel,
        minGrade: prog.minGrade ? JSON.stringify(prog.minGrade) : null,

        acceptedDiplomas: JSON.stringify(prog.acceptedDiplomas),
        domains: JSON.stringify(prog.domains),
        outcomesJobs: JSON.stringify(prog.outcomesJobs),
        outcomesNextLevels: JSON.stringify(prog.outcomesNextLevels),
        internationallyRecognizedIn: JSON.stringify(prog.internationallyRecognizedIn),
        documents: JSON.stringify(prog.documents),
        optionalSteps: prog.optionalSteps ? JSON.stringify(prog.optionalSteps) : null,
        recommendsCertificate: prog.recommendsCertificate
          ? JSON.stringify(prog.recommendsCertificate)
          : null,
        recommendsInternshipWeeks: prog.recommendsInternshipWeeks ?? null,
      })
      .onConflictDoUpdate({
        target: programs.id,
        set: { lastIngestedAt: now, deprecated: false },
      })
      .run();
    p++;
  }

  let j = 0;
  for (const job of JOBS) {
    db.insert(jobs)
      .values({
        id: job.id,
        code: job.code,
        label: job.label,
        riskAutomation: Math.round(job.riskAutomation * 100),
        domains: JSON.stringify(job.domains),
        salary: JSON.stringify(job.salary),
        regionsTopHiring: JSON.stringify(job.regionsTopHiring),
        dailyTasks: JSON.stringify(job.dailyTasks),
        requiresDiplomas: JSON.stringify(job.requiresDiplomas),
        matchKeywords: JSON.stringify(job.matchKeywords),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: jobs.id,
        set: {
          label: job.label,
          riskAutomation: Math.round(job.riskAutomation * 100),
          domains: JSON.stringify(job.domains),
          salary: JSON.stringify(job.salary),
          regionsTopHiring: JSON.stringify(job.regionsTopHiring),
          dailyTasks: JSON.stringify(job.dailyTasks),
          requiresDiplomas: JSON.stringify(job.requiresDiplomas),
          matchKeywords: JSON.stringify(job.matchKeywords),
          updatedAt: now,
        },
      })
      .run();
    j++;
  }

  console.log(`[seed-fixtures] OK — ${p} programs, ${j} jobs`);
}

main();
