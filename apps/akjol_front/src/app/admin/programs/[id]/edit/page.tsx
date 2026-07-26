import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDb } from "../../../../../lib/db";
import { getProgramForAdminById } from "@akjol/db";
import { ProgramForm } from "../../ProgramForm";
import type { ProgramFormInput } from "../../../../../lib/admin/program-schema";

export const dynamic = "force-dynamic";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    return (
      <div className="p-6 text-gray-700">
        Base de données indisponible.
      </div>
    );
  }
  const row = await getProgramForAdminById(db, id);
  if (!row) notFound();

  // Map AdminProgramRow -> ProgramFormInput (mostly identical, but some optional fields).
  const initial: ProgramFormInput = {
    id: row.id,
    source: row.source,
    sourceId: row.sourceId,
    sourceUrl: row.sourceUrl ?? "",
    countryRef: row.countryRef,
    formationCode: row.formationCode,
    formationLabel: row.formationLabel,
    title: row.title,
    level: row.level as ProgramFormInput["level"],
    durationYears: row.durationYears,
    description: row.description,
    schoolName: row.school.name,
    schoolCity: row.school.city,
    schoolType: row.school.type ?? "",
    schoolWebsiteUrl: row.school.websiteUrl ?? "",
    schoolUai: row.schoolUai ?? "",
    languageCode: row.language.code,
    languageMinLevel: row.language.minLevel as ProgramFormInput["languageMinLevel"],
    costPerYear: row.costPerYear,
    costCurrency: row.costCurrency,
    iscedLevel: row.iscedLevel,
    admissionPlatform: row.admissionPlatform as ProgramFormInput["admissionPlatform"],
    applicationOpens: row.applicationOpens ?? "",
    applicationCloses: row.applicationCloses ?? "",
    applicationFee: row.applicationFee,
    workStudy: row.workStudy,
    resultingDiplomaCode: row.resultingDiplomaCode,
    resultingDiplomaLabel: row.resultingDiplomaLabel,
    minGrade: row.minGrade,
    acceptedDiplomas: row.acceptedDiplomas,
    domains: row.domains,
    outcomesJobs: row.outcomesJobs,
    outcomesNextLevels: row.outcomesNextLevels,
    internationallyRecognizedIn: row.internationallyRecognizedIn,
    documents: row.documents,
    optionalSteps: row.optionalSteps ?? [],
    recommendsCertificate: row.recommendsCertificate,
    recommendsInternshipWeeks: row.recommendsInternshipWeeks,
    isCurated: row.isCurated,
  };

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto pb-24">
      <header className="mb-6">
        <Link
          href="/admin/programs"
          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft size={12} /> Retour aux programs
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Éditer · {row.title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Source : <code className="text-gray-700">{row.source}</code> · ID :{" "}
          <code className="text-gray-700">{row.id}</code>
        </p>
      </header>
      <ProgramForm initial={initial} programId={row.id} />
    </div>
  );
}
