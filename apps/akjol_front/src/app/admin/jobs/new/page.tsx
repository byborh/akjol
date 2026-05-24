import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JobForm } from "../JobForm";

export default function NewJobPage() {
  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto pb-24">
      <header className="mb-6">
        <Link href="/admin/jobs" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2">
          <ChevronLeft size={12} /> Retour aux métiers
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Nouveau métier</h1>
      </header>
      <JobForm />
    </div>
  );
}
