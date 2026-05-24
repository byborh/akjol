import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDb } from "../../../../../lib/db";
import { getSchoolByUai } from "@akjol/db";
import { SchoolForm } from "../../SchoolForm";
import type { SchoolFormInput } from "../../../../../lib/admin/school-schema";

export const dynamic = "force-dynamic";

export default async function EditSchoolPage({
  params,
}: {
  params: Promise<{ uai: string }>;
}) {
  const { uai } = await params;
  const db = getDb();
  if (!db) return <div className="p-6 text-gray-700">DB indisponible.</div>;
  const school = await getSchoolByUai(db, uai);
  if (!school) notFound();

  const initial: SchoolFormInput = {
    uai: school.uai,
    name: school.name,
    city: school.city,
    postalCode: school.postalCode ?? "",
    region: school.region ?? "",
    lat: school.lat ?? undefined,
    lng: school.lng ?? undefined,
    type: school.type ?? "",
    websiteUrl: school.websiteUrl ?? "",
  };

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto pb-24">
      <header className="mb-6">
        <Link href="/admin/schools" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2">
          <ChevronLeft size={12} /> Retour aux établissements
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Éditer · {school.name}</h1>
        <p className="text-sm text-gray-600 mt-1">
          UAI : <code className="text-gray-700">{school.uai}</code>
        </p>
      </header>
      <SchoolForm initial={initial} uai={school.uai} />
    </div>
  );
}
