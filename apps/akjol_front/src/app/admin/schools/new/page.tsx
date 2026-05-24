import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SchoolForm } from "../SchoolForm";

export default function NewSchoolPage() {
  return (
    <div className="p-4 md:p-6 max-w-[900px] mx-auto pb-24">
      <header className="mb-6">
        <Link href="/admin/schools" className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-2">
          <ChevronLeft size={12} /> Retour aux établissements
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Nouvel établissement</h1>
        <p className="text-sm text-gray-600 mt-1">
          L'UAI est la clé primaire — il devient immuable après création.
        </p>
      </header>
      <SchoolForm />
    </div>
  );
}
