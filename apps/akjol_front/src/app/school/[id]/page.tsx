"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import { PageContainer } from "../../../components/PageContainer";
import { GaugeCircular } from "../../../components/GaugeCircular";
import { StatusBadge } from "../../../components/StatusBadge";
import { findSchool } from "../../../data/schools";
import { findCountry } from "../../../data/countries";
import { computeFeasibility } from "../../../engine/feasibility";
import { usePassportStore } from "../../../store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../../../store/trajectory-store";
import { useEquivalencesStore } from "../../../store/equivalences-store";
import { useMounted } from "../../../hooks/useMounted";
import { GitCompare } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  université: "Université",
  "grande école": "Grande école",
  lycée: "Lycée (prépa)",
  IUT: "IUT",
  "école privée": "École privée",
  autre: "Autre",
};

export default function SchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const mounted = useMounted();
  const { id } = use(params);
  const school = findSchool(id);
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const compareSchools = usePassportStore((s) => s.comparatorSchools);
  const toggleCompareSchool = usePassportStore((s) => s.toggleCompareSchool);
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const equivEdges = useEquivalencesStore((s) => s.edges);

  const effective = useMemo(
    () => (isComplete ? applyTrajectory(passport, { fromOverride, steps }) : null),
    [passport, fromOverride, steps, isComplete],
  );

  if (!mounted) return null;
  if (!school) return notFound();

  const country = findCountry(school.countryRef);
  const stats = effective
    ? {
        open: school.programs.filter((p) => computeFeasibility(effective, p, equivEdges).status === "open").length,
        ambre: school.programs.filter((p) => computeFeasibility(effective, p, equivEdges).status === "open_with_step").length,
      }
    : null;

  return (
    <PageContainer>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour au catalogue
      </Link>

      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1d24] to-[#2d3039] text-white p-7 mb-6">
        <div className="flex items-center gap-2 mb-3 text-[12px]">
          <span className="px-2 py-0.5 rounded-full bg-white/10 inline-flex items-center gap-1">
            <Building2 size={11} /> {school.type ? TYPE_LABEL[school.type] ?? school.type : "École"}
          </span>
          <span className="text-white/70">{country?.flag} {country?.name}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight leading-tight">{school.name}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-[13px] text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} /> {school.city}
          </span>
          {typeof school.rating === "number" ? (
            <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
              <Star size={14} fill="currentColor" className="text-[#f5b86a]" />
              {school.rating.toFixed(1)} / 5
            </span>
          ) : null}
          <span>
            {school.programs.length} formation{school.programs.length > 1 ? "s" : ""} référencée
            {school.programs.length > 1 ? "s" : ""}
          </span>
        </div>
        {school.description ? (
          <p className="text-white/80 text-sm mt-4 leading-relaxed max-w-3xl">{school.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 mt-5">
          {school.websiteUrl ? (
            <a
              href={school.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition"
            >
              Site officiel <ExternalLink size={12} />
            </a>
          ) : null}
          {school.jpoUrl ? (
            <a
              href={school.jpoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ee7768] hover:bg-[#d96655] text-sm font-medium transition"
            >
              <Calendar size={12} /> Journée portes ouvertes
            </a>
          ) : null}
          <button
            onClick={() => toggleCompareSchool(school.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            style={{
              background: compareSchools.includes(school.id) ? "#a3cf91" : "rgba(255,255,255,0.1)",
              color: compareSchools.includes(school.id) ? "#1a1d24" : "white",
            }}
          >
            <GitCompare size={12} />
            {compareSchools.includes(school.id) ? "Dans le comparateur" : "Comparer cet établissement"}
          </button>
        </div>
      </div>

      {stats ? (
        <div className="rounded-xl bg-[#a3cf9115] border border-[#a3cf91]/40 px-4 py-3 mb-5 inline-flex items-center gap-2 text-sm">
          <Sparkles size={14} className="text-[#3a6f2c]" />
          <span>
            <strong className="text-[#3a6f2c]">{stats.open}</strong> formation{stats.open > 1 ? "s" : ""} ouverte
            {stats.open > 1 ? "s" : ""} pour ton profil
            {stats.ambre > 0 ? (
              <>
                {" · "}
                <strong className="text-[#8a5314]">{stats.ambre}</strong> avec une étape
              </>
            ) : null}
          </span>
        </div>
      ) : null}

      <h2 className="text-xl font-medium tracking-tight mb-3">Formations proposées</h2>
      <div className="space-y-3">
        {school.programs.map((p) => {
          const fz = effective ? computeFeasibility(effective, p, equivEdges) : null;
          return (
            <Link
              key={p.id}
              href={`/program/${p.id}`}
              className="block rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-[11px]">
                    {fz ? <StatusBadge status={fz.status} /> : null}
                    <span className="text-[#1a1d24]/50">
                      {p.durationYears} an{p.durationYears > 1 ? "s" : ""} · {p.language.code.toUpperCase()}{" "}
                      {p.language.minLevel}
                    </span>
                  </div>
                  <h3 className="font-medium text-[#1a1d24] leading-snug">{p.title}</h3>
                  <p className="text-[12px] text-[#1a1d24]/60 mt-0.5 line-clamp-2">{p.description}</p>
                  {p.outcomesJobs.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.outcomesJobs.slice(0, 3).map((j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 rounded-full bg-[#ee776815] text-[#a8463a] text-[11px]"
                        >
                          {j}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {fz ? (
                  <GaugeCircular
                    value={fz.probability.value}
                    ci={fz.probability.ci}
                    basedOn={fz.probability.basedOn}
                    size={56}
                    showCaption={false}
                  />
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}
