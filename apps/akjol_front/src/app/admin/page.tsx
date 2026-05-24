import Link from "next/link";
import { sql } from "drizzle-orm";
import { FileText, Briefcase, Building2, GitBranch, Table, ArrowRight } from "lucide-react";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

/**
 * Hub d'entrée de la console curator. Affiche les compteurs des 4 entités
 * gérables (programs, jobs, schools, équivalences) et oriente vers les
 * sections CRUD correspondantes.
 */
export default async function AdminDashboard() {
  const db = getDb();
  let counts = { programs: 0, programsCurated: 0, jobs: 0, schools: 0, edges: 0 };
  if (db) {
    const c = (q: string) =>
      (db.all(sql.raw(q)) as unknown as Array<{ n: number }>)[0]?.n ?? 0;
    counts = {
      programs: await c("SELECT COUNT(*) as n FROM programs"),
      programsCurated: await c("SELECT COUNT(*) as n FROM programs WHERE is_curated = 1"),
      jobs: await c("SELECT COUNT(*) as n FROM jobs"),
      schools: await c("SELECT COUNT(*) as n FROM schools"),
      edges: await c("SELECT COUNT(*) as n FROM equivalence_edges"),
    };
  }

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Console curator · dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gère le catalogue de la verticale Tech FR. Toutes les modifications sont versionnées
          en DB locale.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          icon={FileText}
          title="Programs"
          subtitle="Fiches formation curées"
          metric={`${counts.programsCurated} / 200`}
          secondary={`${counts.programs - counts.programsCurated} candidats ONISEP en attente`}
          href="/admin/programs"
          cta="Ouvrir la console"
        />
        <Card
          icon={Table}
          title="Mode batch"
          subtitle="Édition rapide en tableau"
          metric="Inline"
          secondary="Pour curer rapidement des fiches homogènes (BTS SIO ×40)"
          href="/admin/programs/batch"
          cta="Ouvrir le tableau"
        />
        <Card
          icon={Briefcase}
          title="Jobs"
          subtitle="Métiers cibles + données ROME"
          metric={`${counts.jobs}`}
          secondary="Référentiel pour outcomesJobs et reverse-routing"
          href="/admin/jobs"
          cta="Gérer les métiers"
        />
        <Card
          icon={Building2}
          title="Schools"
          subtitle="Établissements (Annuaire + MESR + custom)"
          metric={`${counts.schools.toLocaleString()}`}
          secondary="UAI · ville · lat/lng · type"
          href="/admin/schools"
          cta="Gérer les établissements"
        />
        <Card
          icon={GitBranch}
          title="Équivalences"
          subtitle="Graphe des passerelles entre diplômes"
          metric={`${counts.edges}`}
          secondary="Édition visuelle node/edge"
          href="/admin/graph"
          cta="Ouvrir le graphe"
        />
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  subtitle,
  metric,
  secondary,
  href,
  cta,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  metric: string;
  secondary: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-md border border-gray-200 bg-white p-4 hover:border-gray-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-[#ee7768]" />
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            {title}
          </h2>
        </div>
        <ArrowRight
          size={14}
          className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
      <div className="text-3xl font-semibold text-gray-900 mb-1">{metric}</div>
      <p className="text-xs text-gray-500 mb-3">{secondary}</p>
      <span className="inline-block text-xs text-[#ee7768] group-hover:underline">{cta} →</span>
    </Link>
  );
}
