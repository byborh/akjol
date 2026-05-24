import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { getDb } from "../../../lib/db";
import { getAllJobs } from "@akjol/db";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const db = getDb();
  if (!db) return <div className="p-6 text-gray-700">DB indisponible.</div>;
  const jobs = await getAllJobs(db);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Métiers (jobs)</h1>
          <p className="text-sm text-gray-600 mt-1">
            <strong className="text-gray-900">{jobs.length}</strong> métiers dans le référentiel —
            utilisés par les autocompletes <code>outcomesJobs</code> et le reverse-routing.
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#ee7768] hover:bg-[#e9614f] text-white text-sm font-medium rounded-md"
        >
          <Plus size={16} /> Nouveau métier
        </Link>
      </header>

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-3 py-2 text-left w-32">Code</th>
              <th scope="col" className="px-3 py-2 text-left">Libellé</th>
              <th scope="col" className="px-3 py-2 text-left">Domaines</th>
              <th scope="col" className="px-3 py-2 text-left w-24">Salaire</th>
              <th scope="col" className="px-3 py-2 text-left w-16">Risque IA</th>
              <th scope="col" className="px-3 py-2 text-right w-16">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  Aucun métier. <Link href="/admin/jobs/new" className="text-[#ee7768] hover:underline">Crée le premier</Link>.
                </td>
              </tr>
            )}
            {jobs.map((j) => {
              const sal = j.salary?.[0];
              return (
                <tr key={j.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs text-gray-700">{j.code}</td>
                  <td className="px-3 py-2 text-gray-900">{j.label}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{j.domains.join(", ")}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">
                    {sal ? `${sal.median.toLocaleString()} ${sal.currency}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{Math.round(j.riskAutomation * 100)}%</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/jobs/${encodeURIComponent(j.id)}/edit`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      title="Éditer"
                    >
                      <Pencil size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
