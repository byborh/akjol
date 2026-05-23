import Link from "next/link";
import { ChevronLeft, Copy } from "lucide-react";
import { getDb } from "../../../../lib/db";
import { getProgramForAdminById } from "@akjol/db";
import { ProgramForm } from "../ProgramForm";
import type { ProgramFormInput } from "../../../../lib/admin/program-schema";

export const dynamic = "force-dynamic";

/**
 * `/admin/programs/new` — création.
 *
 * Si `?from=<id>` est présent, on charge le program source et on pré-remplit le
 * formulaire avec ses valeurs (en effaçant id et sourceId pour qu'une nouvelle
 * ligne soit créée). C'est le critère #1 de l'Admin (duplication rapide).
 */
export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  let initial: ProgramFormInput | undefined;
  let duplicatedFromTitle: string | undefined;
  if (from) {
    const db = getDb();
    if (db) {
      const source = await getProgramForAdminById(db, from);
      if (source) {
        duplicatedFromTitle = source.title;
        initial = {
          // Nouveau program → ID et sourceId vides (auto-générés)
          source: "manual",
          countryRef: source.countryRef,
          formationCode: source.formationCode,
          formationLabel: source.formationLabel,
          // Indication de duplication dans le titre pour signaler la modif à faire
          title: source.title.includes("(copie)") ? source.title : `${source.title} (copie)`,
          level: source.level as ProgramFormInput["level"],
          durationYears: source.durationYears,
          description: source.description,
          schoolName: source.school.name,
          schoolCity: source.school.city,
          schoolType: source.school.type ?? "",
          schoolWebsiteUrl: source.school.websiteUrl ?? "",
          schoolUai: source.schoolUai ?? "",
          languageCode: source.language.code,
          languageMinLevel: source.language.minLevel as ProgramFormInput["languageMinLevel"],
          costPerYear: source.costPerYear,
          admissionPlatform: source.admissionPlatform as ProgramFormInput["admissionPlatform"],
          applicationOpens: source.applicationOpens ?? "",
          applicationCloses: source.applicationCloses ?? "",
          applicationFee: source.applicationFee,
          workStudy: source.workStudy,
          resultingDiplomaCode: source.resultingDiplomaCode,
          resultingDiplomaLabel: source.resultingDiplomaLabel,
          minGrade: source.minGrade,
          acceptedDiplomas: source.acceptedDiplomas,
          domains: source.domains,
          outcomesJobs: source.outcomesJobs,
          outcomesNextLevels: source.outcomesNextLevels,
          internationallyRecognizedIn: source.internationallyRecognizedIn,
          documents: source.documents,
          optionalSteps: source.optionalSteps ?? [],
          recommendsCertificate: source.recommendsCertificate,
          recommendsInternshipWeeks: source.recommendsInternshipWeeks,
          isCurated: true,
        };
      }
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto pb-24">
      <header className="mb-6">
        <Link
          href="/admin/programs"
          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft size={12} /> Retour aux programs
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {duplicatedFromTitle ? "Dupliquer la fiche" : "Nouvelle fiche program"}
        </h1>
        {duplicatedFromTitle ? (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Copy size={12} className="text-[#ee7768]" />
            Pré-rempli depuis : <strong className="text-gray-800">{duplicatedFromTitle}</strong>
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-1">
            Crée une fiche curée. Tous les champs marqués <span className="text-red-400">*</span>{" "}
            sont requis.
          </p>
        )}
      </header>
      <ProgramForm initial={initial} />
    </div>
  );
}
