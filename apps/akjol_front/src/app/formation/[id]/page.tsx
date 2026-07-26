"use client";

import { useMemo, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Building2, Clock, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { PageContainer } from "../../../components/PageContainer";
import { GaugeCircular } from "../../../components/GaugeCircular";
import { StatusBadge } from "../../../components/StatusBadge";
import { findCountry } from "../../../data/countries";
import { jobsForProgram } from "../../../data/jobs";
import { formatCost } from "../../../data/fxRates";
import type { Locale } from "../../../i18n/config";
import { usePrograms } from "../../../hooks/data";
import { computeFeasibility } from "../../../engine/feasibility";
import { usePassportStore } from "../../../store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../../../store/trajectory-store";
import { useEquivalencesStore } from "../../../store/equivalences-store";
import { useMounted } from "../../../hooks/useMounted";
import { findFormation } from "../../../lib/formation-grouping";
import type { ProgramLevel } from "../../../types";

const LEVEL_KEY: Record<ProgramLevel, string> = {
  lycee: "levelLycee",
  licence: "levelLicence",
  licence_pro: "levelLicencePro",
  bachelor: "levelBachelor",
  master: "levelMaster",
  ecole_inge: "levelEcoleInge",
  doctorat: "levelDoctorat",
  certif: "levelLicencePro",
};

export default function FormationPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("formation");
  const tc = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const mounted = useMounted();
  const { id } = use(params);
  const { data: programs = [], isLoading } = usePrograms();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const equivEdges = useEquivalencesStore((s) => s.edges);

  const group = useMemo(() => findFormation(programs, id), [programs, id]);
  const effective = useMemo(
    () => (mounted && isComplete ? applyTrajectory(passport, { fromOverride, steps }) : null),
    [mounted, passport, fromOverride, steps, isComplete],
  );

  if (!mounted || isLoading) return null;
  if (!group) return notFound();

  const country = findCountry(group.countryRef);

  return (
    <PageContainer>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> {t("back")}
      </Link>

      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1d24] to-[#2d3039] text-white p-7 mb-6">
        <div className="text-xs text-white/60 mb-2">
          {country?.flag} {country?.name} · {tc(LEVEL_KEY[group.level])}
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight leading-tight">
          {group.formationLabel}
        </h1>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-[13px] text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {t("yearsSuffix", { years: group.durationYears })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={14} /> {t("establishments", { count: group.offerings.length })}
          </span>
        </div>
        {group.domains.length ? (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {group.domains.map((d) => (
              <span key={d} className="px-2 py-0.5 rounded-full bg-white/10 text-[12px]">
                {d}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          {group.description ? (
            <Section title={t("aboutTitle")} icon={<Sparkles size={18} />}>
              <p className="text-sm text-[#1a1d24]/75 leading-relaxed">{group.description}</p>
            </Section>
          ) : null}

          <Section title={t("jobsTitle")} icon={<GraduationCap size={18} />}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-2">
                  {t("outcomesJobs")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.outcomesJobs.map((label) => {
                    const matched = jobsForProgram([label])[0];
                    return matched ? (
                      <Link
                        key={label}
                        href={`/jobs/${matched.id}`}
                        className="px-2.5 py-1 rounded-full bg-[#ee776815] text-[#a8463a] text-[12px] hover:bg-[#ee776830] transition"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span
                        key={label}
                        className="px-2.5 py-1 rounded-full bg-[#ee776815] text-[#a8463a] text-[12px]"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-2">
                  {t("acceptedTitle")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.acceptedDiplomas.map((d) => (
                    <span key={d} className="px-2 py-1 rounded-md bg-black/5 text-[12px]">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title={t("establishmentsTitle")} icon={<Building2 size={18} />}>
            <div className="grid sm:grid-cols-2 gap-2">
              {group.offerings.map((p) => {
                const feasibility = effective ? computeFeasibility(effective, p, equivEdges) : null;
                const c = findCountry(p.countryRef);
                return (
                  <Link
                    key={p.id}
                    href={`/program/${p.id}`}
                    className="block rounded-lg border border-black/5 hover:border-[#ee7768]/40 bg-white px-3 py-2.5 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-[13px] text-[#1a1d24] truncate">
                          {p.school.name}
                        </div>
                        <div className="text-[11px] text-[#1a1d24]/55 mt-0.5 truncate">
                          <MapPin size={10} className="inline -mt-0.5" /> {c?.flag} {p.school.city}
                        </div>
                        <div
                          className="text-[10px] text-[#1a1d24]/55 mt-1"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {p.costPerYear === 0
                            ? t("free")
                            : t("costPerYear", {
                                value: formatCost(locale, p.costPerYear, { fromCurrency: p.costCurrency }),
                              })}
                        </div>
                      </div>
                      {feasibility ? <StatusBadge status={feasibility.status} /> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-20 self-start space-y-3">
          {effective ? (
            <div className="rounded-xl bg-white border border-black/5 p-5 flex flex-col items-center">
              <FormationGauge
                effective={effective}
                programId={group.offerings[0].id}
                programs={programs}
                edges={equivEdges}
              />
              <p className="text-[11px] text-[#1a1d24]/55 mt-3 text-center">{t("gaugeHint")}</p>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-black/5 p-5 text-[12px] text-[#1a1d24]/70 leading-relaxed">
              <Link href="/onboarding" className="text-[#ee7768] hover:underline">
                {tc("createPassportHint")}
              </Link>
            </div>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}

function FormationGauge({
  effective,
  programId,
  programs,
  edges,
}: {
  effective: NonNullable<ReturnType<typeof applyTrajectory>>;
  programId: string;
  programs: ReturnType<typeof usePrograms>["data"];
  edges: Parameters<typeof computeFeasibility>[2];
}) {
  const p = (programs ?? []).find((x) => x.id === programId);
  if (!p) return null;
  const f = computeFeasibility(effective, p, edges);
  return (
    <GaugeCircular
      value={f.probability.value}
      ci={f.probability.ci}
      basedOn={f.probability.basedOn}
      size={120}
    />
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#ee7768]/10 text-[#ee7768]">
          {icon}
        </span>
        <h2 className="font-medium text-[#1a1d24]">{title}</h2>
      </div>
      {children}
    </div>
  );
}
