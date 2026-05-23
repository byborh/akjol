import Link from "next/link";
import { Plus } from "lucide-react";
import { getDb } from "../../../lib/db";
import { getAllProgramsForAdmin } from "@akjol/db";
import { ProgressBars } from "./ProgressBars";
import { ProgramsTable } from "./ProgramsTable";

export const dynamic = "force-dynamic";

/**
 * Console de curation des programs.
 *
 * Charge tous les programs (curated + raw ONISEP) côté serveur, calcule la
 * progression par niveau, et passe le tout au tableau client pour filtrage /
 * tri / pagination. Pour V1 (~6k lignes), le tout-en-mémoire client est OK ;
 * on basculera vers une API paginée + FTS5 si la table dépasse 50k.
 */
export default async function AdminProgramsPage() {
  const db = getDb();
  if (!db) {
    return (
      <div className="p-6">
        <p className="text-gray-700">
          Base de données indisponible. Vérifie que better-sqlite3 est compilé pour ta plateforme.
        </p>
      </div>
    );
  }

  const programs = await getAllProgramsForAdmin(db);
  const curatedCount = programs.filter((p) => p.isCurated).length;
  const rawCount = programs.length - curatedCount;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Programs · curation</h1>
          <p className="text-sm text-gray-600 mt-1">
            <strong className="text-gray-900">{curatedCount}</strong> / 200 fiches curées ·{" "}
            <span className="text-gray-500">{rawCount.toLocaleString()} candidats ONISEP bruts</span>
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#ee7768] hover:bg-[#e9614f] text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus size={16} />
          Nouvelle fiche
        </Link>
      </header>

      <ProgressBars programs={programs} />
      <ProgramsTable programs={programs} />
    </div>
  );
}
