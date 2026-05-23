import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getDb } from "../../../../lib/db";
import { getAllProgramsForAdmin } from "@akjol/db";
import { BatchEditTable } from "./BatchEditTable";

export const dynamic = "force-dynamic";

/**
 * Mode batch (critère #7 de l'Admin) — édition rapide en vue tableau pour
 * les fiches homogènes. Pensé pour gérer en lot les 40 BTS SIO ou les 30
 * BUT Info dont la majorité des champs varient peu d'une fiche à l'autre.
 *
 * Périmètre : édition inline des champs scalaires (titre, école, ville,
 * niveau, durée, coût, langue, plateforme, isCurated). Les champs listes
 * (acceptedDiplomas, outcomesJobs…) restent en mode édition complète via
 * le bouton "Éditer" qui ouvre /admin/programs/[id]/edit.
 */
export default async function BatchEditPage() {
  const db = getDb();
  if (!db) {
    return (
      <div className="p-6 text-gray-700">
        Base de données indisponible.
      </div>
    );
  }
  const programs = await getAllProgramsForAdmin(db);

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto">
      <header className="mb-6">
        <Link
          href="/admin/programs"
          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft size={12} /> Retour aux programs
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Mode batch · édition rapide</h1>
        <p className="text-sm text-gray-600 mt-1">
          Édite en lot les champs scalaires. Pour les listes (diplômes acceptés, métiers de sortie),
          ouvre la fiche en édition complète via l'icône <span className="font-mono">↗</span>.
        </p>
      </header>

      <BatchEditTable programs={programs} />
    </div>
  );
}
