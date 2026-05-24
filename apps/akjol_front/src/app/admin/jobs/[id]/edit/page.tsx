import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDb } from "../../../../../lib/db";
import { getJobById } from "@akjol/db";
import { JobForm } from "../../JobForm";
import type { JobFormInput } from "../../../../../lib/admin/job-schema";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  if (!db) return <div className="p-6 text-gray-700">DB indisponible.</div>;
  const job = await getJobById(db, id);
  if (!job) notFound();

  // riskAutomation est exposé en 0..1 par getJobById (cf. rowToJob), mais le
  // schéma form attend 0..100. On reconvertit.
  const initial: JobFormInput = {
    id: job.id,
    code: job.code,
    label: job.label,
    riskAutomation: Math.round(job.riskAutomation * 100),
    domains: job.domains,
    salary: job.salary,
    regionsTopHiring: job.regionsTopHiring,
    dailyTasks: job.dailyTasks,
    requiresDiplomas: job.requiresDiplomas,
    matchKeywords: job.matchKeywords,
  };

  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto pb-24">
      <header className="mb-6">
        <Link href="/admin/jobs" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2">
          <ChevronLeft size={12} /> Retour aux métiers
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Éditer · {job.label}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Code : <code className="text-gray-700">{job.code}</code> · ID : <code className="text-gray-700">{job.id}</code>
        </p>
      </header>
      <JobForm initial={initial} jobId={job.id} />
    </div>
  );
}
