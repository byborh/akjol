"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Coins,
  Activity,
  Clock,
  MapPin,
  GraduationCap,
  Sparkles,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import { PageContainer } from "../../../components/PageContainer";
import { findJob, JOBS } from "../../../data/jobs";
import { PROGRAMS } from "../../../data/programs";
import { findCountry } from "../../../data/countries";
import { reverseRoutes, type Trajectory } from "../../../engine/reverseRoutes";
import { usePassportStore } from "../../../store/passport-store";
import { useTrajectoryStore, applyTrajectory } from "../../../store/trajectory-store";
import { useMounted } from "../../../hooks/useMounted";

const SAFE_AUTOMATION = 0.2;

function formatSalary(s: { country: string; median: number; currency: string }): string {
  const sym = s.currency === "EUR" ? "€" : s.currency === "GBP" ? "£" : s.currency === "USD" ? "$" : s.currency;
  return `${s.median.toLocaleString("fr-FR")} ${sym}`;
}

function automationLabel(p: number): string {
  if (p < 0.2) return "Très faible";
  if (p < 0.4) return "Faible";
  if (p < 0.6) return "Modéré";
  return "Élevé";
}

function automationColor(p: number): string {
  if (p < 0.2) return "#3a6f2c";
  if (p < 0.4) return "#3a6f2c";
  if (p < 0.6) return "#8a5314";
  return "#7e2929";
}

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const mounted = useMounted();
  const job = findJob(id);

  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);

  const effective = useMemo(
    () => (mounted && isComplete ? applyTrajectory(passport, { fromOverride, steps }) : null),
    [mounted, passport, isComplete, fromOverride, steps],
  );

  const trajectories = useMemo<Trajectory[]>(
    () => (effective && job ? reverseRoutes(effective, job.id) : []),
    [effective, job],
  );

  const programsLeadingHere = useMemo(() => {
    if (!job) return [];
    const jl = job.label.toLowerCase();
    return PROGRAMS.filter((p) =>
      p.outcomesJobs.some((label) => {
        const lc = label.toLowerCase();
        return (
          lc.includes(jl) ||
          jl.includes(lc) ||
          job.matchKeywords.some((k) => lc.includes(k.toLowerCase()))
        );
      }),
    );
  }, [job]);

  const relatedJobs = useMemo(() => {
    if (!job) return [];
    return JOBS.filter((j) => j.id !== job.id && j.domains.some((d) => job.domains.includes(d)))
      .slice(0, 4);
  }, [job]);

  if (!job) {
    return (
      <PageContainer className="py-10 max-w-xl">
        <h1 className="text-2xl font-medium tracking-tight">Métier introuvable</h1>
        <p className="text-sm text-[#1a1d24]/70 mt-2">Aucun métier ne correspond à l'id <code>{id}</code>.</p>
        <button
          onClick={() => router.push("/jobs")}
          className="mt-6 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[#ee7768] text-white"
        >
          <ArrowLeft size={14} /> Retour au catalogue
        </button>
      </PageContainer>
    );
  }

  const automationPct = Math.round(job.riskAutomation * 100);
  const frSalary = job.salary.find((s) => s.country === "FR");

  return (
    <PageContainer>
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour au catalogue métiers
      </Link>

      <div className="rounded-2xl bg-white border border-black/5 p-6 mb-6">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-2">
          <Briefcase size={12} /> Métier · {job.code}
        </div>
        <h1 className="text-3xl font-medium tracking-tight">{job.label}</h1>
        <div className="flex flex-wrap gap-1 mt-2">
          {job.domains.map((d) => (
            <span
              key={d}
              className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#1a1d2408] text-[#1a1d24]/70 font-medium"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-lg bg-[#fafaf7] border border-black/5 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-medium inline-flex items-center gap-1">
              <Coins size={10} /> Salaire médian FR
            </div>
            <div className="text-lg font-medium font-mono mt-0.5">
              {frSalary ? formatSalary(frSalary) : "—"}
              <span className="text-[11px] text-[#1a1d24]/50 ml-1">/an brut</span>
            </div>
          </div>
          <div className="rounded-lg bg-[#fafaf7] border border-black/5 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-medium inline-flex items-center gap-1">
              <Activity size={10} /> Risque automation
            </div>
            <div className="text-lg font-medium mt-0.5" style={{ color: automationColor(job.riskAutomation) }}>
              {automationPct}%
              <span className="text-[11px] ml-1 font-normal">
                {automationLabel(job.riskAutomation)}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-[#fafaf7] border border-black/5 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-medium inline-flex items-center gap-1">
              <GraduationCap size={10} /> Niveaux requis
            </div>
            <div className="text-sm font-medium mt-0.5">
              {job.requiresDiplomas.map((d) => d.replace("_", " ")).join(", ")}
            </div>
          </div>
        </div>

        {job.salary.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.salary.map((s) => {
              const c = findCountry(s.country);
              return (
                <span
                  key={s.country}
                  className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1 rounded-full bg-[#fafaf7] border border-black/5"
                >
                  <span>{c?.flag ?? "🌍"}</span>
                  <span className="text-[#1a1d24]/70">{c?.name ?? s.country}</span>
                  <span className="font-medium font-mono">{formatSalary(s)}</span>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <section className="rounded-xl bg-white border border-black/5 p-5">
            <h2 className="text-sm font-medium inline-flex items-center gap-2 mb-3">
              <ListChecks size={14} className="text-[#ee7768]" /> Ce que tu fais au quotidien
            </h2>
            <ul className="space-y-1.5 text-sm text-[#1a1d24]/85">
              {job.dailyTasks.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#ee7768] mt-0.5 shrink-0">·</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-[#1a1d24]/50 italic">
              Liste indicative — varie selon la séniorité, le secteur, l'employeur.
            </p>
          </section>

          <section className="rounded-xl bg-white border border-black/5 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium inline-flex items-center gap-2">
                <Sparkles size={14} className="text-[#ee7768]" /> Routes vers ce métier
              </h2>
              {effective ? (
                <span className="text-[11px] text-[#1a1d24]/50">depuis ton passeport</span>
              ) : (
                <span className="text-[11px] text-[#1a1d24]/50">profil incomplet</span>
              )}
            </div>

            {!mounted ? (
              <p className="text-[12px] text-[#1a1d24]/50">Chargement…</p>
            ) : !isComplete ? (
              <div className="rounded-lg bg-[#fafaf7] border border-black/5 p-4 text-[12px]">
                <p className="text-[#1a1d24]/70">
                  Construis ton passeport pour voir tes routes possibles depuis ton point de
                  départ actuel.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-3 inline-flex items-center gap-1 text-[#ee7768] hover:underline font-medium"
                >
                  Construire mon passeport <ArrowRight size={12} />
                </Link>
              </div>
            ) : trajectories.length === 0 ? (
              <p className="text-[12px] text-[#1a1d24]/60">
                Aucune route trouvée à 5 étapes max depuis ton passeport. Le métier exige
                probablement un diplôme que tu n'as pas encore (ou un parcours non couvert
                dans la base actuelle).
              </p>
            ) : (
              <div className="space-y-2">
                {trajectories.map((t, i) => (
                  <TrajectoryRow key={i} t={t} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-white border border-black/5 p-5">
            <h2 className="text-sm font-medium inline-flex items-center gap-2 mb-3">
              <GraduationCap size={14} className="text-[#ee7768]" /> Formations qui mènent à ce métier
            </h2>
            {programsLeadingHere.length === 0 ? (
              <p className="text-[12px] text-[#1a1d24]/60">
                Aucun programme de la base actuelle ne liste explicitement {job.label} comme
                débouché.
              </p>
            ) : (
              <ul className="space-y-2">
                {programsLeadingHere.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/program/${p.id}`}
                      className="flex items-start gap-2 group p-2 -mx-2 rounded hover:bg-[#fafaf7]"
                    >
                      <span className="text-base shrink-0">
                        {findCountry(p.countryRef)?.flag ?? "🌍"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm group-hover:text-[#ee7768] transition truncate">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-[#1a1d24]/60">
                          {p.school.name} · {p.school.city} ·{" "}
                          {p.costPerYear === 0 ? "Gratuit" : `${p.costPerYear} €/an`} ·{" "}
                          {p.durationYears} an{p.durationYears > 1 ? "s" : ""}
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-[#1a1d24]/30 group-hover:text-[#ee7768] mt-0.5 shrink-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 self-start space-y-3">
          <section className="rounded-xl bg-white border border-black/5 p-4">
            <h3 className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-2 inline-flex items-center gap-1">
              <MapPin size={11} /> Régions qui recrutent
            </h3>
            <ul className="text-sm text-[#1a1d24]/80 space-y-1">
              {job.regionsTopHiring.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </section>

          {relatedJobs.length > 0 ? (
            <section className="rounded-xl bg-white border border-black/5 p-4">
              <h3 className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-2">
                Métiers proches
              </h3>
              <ul className="space-y-1.5">
                {relatedJobs.map((rj) => (
                  <li key={rj.id}>
                    <Link
                      href={`/jobs/${rj.id}`}
                      className="text-sm text-[#1a1d24] hover:text-[#ee7768] transition inline-flex items-center gap-1"
                    >
                      → {rj.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl bg-[#fcf6e8] border border-[#e6c068]/30 p-4">
            <p className="text-[11px] text-[#8a5314] leading-relaxed">
              <strong>Sources.</strong> Salaires : INSEE DADS / ONS / BLS. Risque automation :
              estimation Frey-Osborne 2017. Tâches : ROME (Pôle emploi). Détails sur{" "}
              <Link href="/methodologie" className="underline">
                /méthodologie
              </Link>
              .
            </p>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
}

function TrajectoryRow({ t }: { t: Trajectory }) {
  const flags = t.countries.map((c) => findCountry(c)?.flag ?? "").filter(Boolean).join(" ");
  return (
    <Link
      href={`/program/${t.steps[0].programId}`}
      className="block rounded-lg border border-black/5 bg-[#fafaf7] hover:bg-[#fff7f5] hover:border-[#ee7768]/30 transition p-3 group"
    >
      <div className="text-[11px] text-[#1a1d24]/60 mb-1">
        {flags} {t.steps.length} étape{t.steps.length > 1 ? "s" : ""} · {t.totalYears} an
        {t.totalYears > 1 ? "s" : ""} ·{" "}
        {t.totalCost === 0 ? "Gratuit" : `${t.totalCost.toLocaleString("fr-FR")} €`} · proba{" "}
        {Math.round(t.joinedProbability * 100)}%
      </div>
      <div className="text-sm font-medium leading-snug group-hover:text-[#ee7768] transition">
        {t.steps.map((s) => s.title).join(" → ")}
      </div>
      <p className="text-[11px] text-[#1a1d24]/60 mt-1">{t.rationale}</p>
    </Link>
  );
}
