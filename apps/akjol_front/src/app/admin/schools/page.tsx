import Link from "next/link";
import { Plus } from "lucide-react";
import { getDb } from "../../../lib/db";
import { getAllSchoolsForAdmin } from "@akjol/db";
import { SchoolsTable } from "./SchoolsTable";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  const db = getDb();
  if (!db) return <div className="p-6 text-gray-700">DB indisponible.</div>;
  const schools = await getAllSchoolsForAdmin(db);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Établissements (schools)</h1>
          <p className="text-sm text-gray-600 mt-1">
            <strong className="text-gray-900">{schools.length.toLocaleString()}</strong> établissements ·
            Annuaire Éducation, MESR et saisie manuelle confondus.
          </p>
        </div>
        <Link
          href="/admin/schools/new"
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#ee7768] hover:bg-[#e9614f] text-white text-sm font-medium rounded-md"
        >
          <Plus size={16} /> Nouvel établissement
        </Link>
      </header>
      <SchoolsTable schools={schools} />
    </div>
  );
}
