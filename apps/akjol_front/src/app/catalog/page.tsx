"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { LayoutGrid, Map as MapIcon, Search, Sparkles, X } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { SchoolCard } from "../../components/SchoolCard";
import { GaugeCircular } from "../../components/GaugeCircular";
import { StatusBadge } from "../../components/StatusBadge";
import { COUNTRIES } from "../../data/countries";
import { getSchoolsFrom, getUniqueCitiesFrom } from "../../data/schools";
import { usePrograms } from "../../hooks/data";
import { computeFeasibility } from "../../engine/feasibility";
import { usePassportStore } from "../../store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../../store/trajectory-store";
import { useEquivalencesStore } from "../../store/equivalences-store";
import type { EquivalenceEdge } from "../../data/equivalences";
import { useMounted } from "../../hooks/useMounted";
import { groupFormations, type FormationGroup } from "../../lib/formation-grouping";
import type { ProgramLevel } from "../../types";

const SchoolMap = dynamic(() => import("../../components/SchoolMap"), {
  ssr: false,
  loading: () => <MapLoader />,
});

function MapLoader() {
  const t = useTranslations("catalog");
  return (
    <div className="rounded-xl border border-black/5 bg-white h-[480px] flex items-center justify-center text-sm text-[#1a1d24]/50">
      {t("loadingMap")}
    </div>
  );
}

type ViewMode = "formations" | "schools";
type SchoolDisplayMode = "list" | "map";

const LEVEL_CODES: ProgramLevel[] = [
  "lycee",
  "licence",
  "licence_pro",
  "bachelor",
  "master",
  "ecole_inge",
  "doctorat",
];

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

const DOMAIN_VALUES = ["Tech", "Santé", "Sciences", "Industrie", "Affaires", "Arts", "Droit", "Sciences humaines"];
const DOMAIN_KEY: Record<string, string> = {
  Tech: "domainTech",
  "Santé": "domainSante",
  Sciences: "domainSciences",
  Industrie: "domainIndustrie",
  Affaires: "domainAffaires",
  Arts: "domainArts",
  Droit: "domainDroit",
  "Sciences humaines": "domainSh",
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogInner />
    </Suspense>
  );
}

function CatalogInner() {
  const t = useTranslations("catalog");
  const mounted = useMounted();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const equivEdges = useEquivalencesStore((s) => s.edges);

  const { data: programs = [], isLoading } = usePrograms();
  const allSchools = useMemo(() => getSchoolsFrom(programs), [programs]);
  const allCities = useMemo(() => getUniqueCitiesFrom(allSchools), [allSchools]);

  const [view, setView] = useState<ViewMode>("formations");
  const [schoolDisplay, setSchoolDisplay] = useState<SchoolDisplayMode>("list");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState<ProgramLevel | "">("");
  const [domain, setDomain] = useState<string>("");
  const [city, setCity] = useState("");

  const effective = useMemo(
    () => (mounted && isComplete ? applyTrajectory(passport, { fromOverride, steps }) : null),
    [mounted, passport, fromOverride, steps, isComplete],
  );

  const filteredFormations = useMemo(() => {
    const q = normalize(search.trim());
    return programs.filter((p) => {
      if (country && p.countryRef !== country) return false;
      if (level && p.level !== level) return false;
      if (domain && !p.domains.includes(domain)) return false;
      if (!q) return true;
      const hay = normalize(
        [
          p.title,
          p.description,
          p.school.name,
          p.school.city,
          p.outcomesJobs.join(" "),
          p.domains.join(" "),
        ].join(" "),
      );
      return hay.includes(q);
    });
  }, [programs, search, country, level, domain]);

  // Regroupe les offres filtrées par formation (BTS SIO affiché une seule fois).
  const formationGroups = useMemo(() => groupFormations(filteredFormations), [filteredFormations]);
  const totalFormationCount = useMemo(() => groupFormations(programs).length, [programs]);

  const filteredSchools = useMemo(() => {
    const q = normalize(search.trim());
    return allSchools.filter((s) => {
      if (country && s.countryRef !== country) return false;
      if (city && s.city !== city) return false;
      if (level && !s.programs.some((p) => p.level === level)) return false;
      if (domain && !s.programs.some((p) => p.domains.includes(domain))) return false;
      if (!q) return true;
      return (
        normalize(s.name).includes(q) ||
        normalize(s.city).includes(q) ||
        s.programs.some((p) => normalize(p.title).includes(q))
      );
    });
  }, [allSchools, search, country, city, level, domain]);

  return (
    <PageContainer>
      <header className="mb-5">
        <h1 className="text-3xl font-medium tracking-tight">{t("title")}</h1>
        <p className="text-sm text-[#1a1d24]/70 mt-1">{t("subtitle")}</p>
      </header>

      <div className="inline-flex p-1 rounded-xl bg-black/5 mb-4">
        <button
          onClick={() => setView("formations")}
          className="px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{
            background: view === "formations" ? "#fff" : "transparent",
            color: view === "formations" ? "#ee7768" : "#1a1d2480",
            boxShadow: view === "formations" ? "0 1px 2px rgba(0,0,0,0.04)" : undefined,
          }}
        >
          {t("tabFormations", { count: isLoading ? 0 : totalFormationCount })}
        </button>
        <button
          onClick={() => setView("schools")}
          className="px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{
            background: view === "schools" ? "#fff" : "transparent",
            color: view === "schools" ? "#ee7768" : "#1a1d2480",
            boxShadow: view === "schools" ? "0 1px 2px rgba(0,0,0,0.04)" : undefined,
          }}
        >
          {t("tabSchools", { count: allSchools.length })}
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-black/5 p-4 mb-5">
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-stretch">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1d24]/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={view === "formations" ? t("searchFormations") : t("searchSchools")}
              className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-[#ee7768]"
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1a1d24]/40 hover:text-[#1a1d24]"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm"
          >
            <option value="">{t("filterAllCountries")}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ProgramLevel | "")}
            className="px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm"
          >
            <option value="">{t("filterAllLevels")}</option>
            {LEVEL_CODES.map((code) => (
              <option key={code} value={code}>
                {t(LEVEL_KEY[code])}
              </option>
            ))}
          </select>

          {view === "formations" ? (
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm"
            >
              <option value="">{t("filterAllDomains")}</option>
              {DOMAIN_VALUES.map((d) => (
                <option key={d} value={d}>
                  {t(DOMAIN_KEY[d])}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm"
            >
              <option value="">{t("filterAllCities")}</option>
              {allCities.map((c) => (
                <option key={c} value={c}>
                  📍 {c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-3 text-[11px] text-[#1a1d24]/50">
          {view === "formations"
            ? t("countFormations", { count: formationGroups.length })
            : t("countSchools", { count: filteredSchools.length })}
          {effective ? (
            <span className="ml-2 inline-flex items-center gap-1">
              <Sparkles size={11} className="text-[#ee7768]" />
              {t("matchHint")}
            </span>
          ) : (
            <Link href="/onboarding" className="ml-2 text-[#ee7768] hover:underline">
              {t("createPassportHint")}
            </Link>
          )}
        </div>
      </div>

      {view === "formations" ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {formationGroups.length === 0 ? (
            <p className="text-sm text-[#1a1d24]/60">{t("noFormations")}</p>
          ) : null}
          {formationGroups.map((g) => (
            <CatalogFormationCard key={g.key} group={g} effective={effective} edges={equivEdges} />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex p-0.5 rounded-lg bg-black/5">
              <button
                onClick={() => setSchoolDisplay("list")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition"
                style={{
                  background: schoolDisplay === "list" ? "#fff" : "transparent",
                  color: schoolDisplay === "list" ? "#ee7768" : "#1a1d2480",
                }}
              >
                <LayoutGrid size={12} /> {t("viewList")}
              </button>
              <button
                onClick={() => setSchoolDisplay("map")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition"
                style={{
                  background: schoolDisplay === "map" ? "#fff" : "transparent",
                  color: schoolDisplay === "map" ? "#ee7768" : "#1a1d2480",
                }}
              >
                <MapIcon size={12} /> {t("viewMap")}
              </button>
            </div>
            {schoolDisplay === "map" ? (
              <span className="text-[11px] text-[#1a1d24]/50">{t("mapLegend")}</span>
            ) : null}
          </div>

          {schoolDisplay === "map" ? (
            <SchoolMap
              schools={filteredSchools}
              matchedProgramsBySchool={
                effective
                  ? Object.fromEntries(
                      filteredSchools.map((s) => [
                        s.id,
                        s.programs.filter((p) => computeFeasibility(effective, p, equivEdges).status === "open").length,
                      ]),
                    )
                  : {}
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredSchools.length === 0 ? (
                <p className="text-sm text-[#1a1d24]/60">{t("noSchools")}</p>
              ) : null}
              {filteredSchools.map((s) => {
                const matchCount = effective
                  ? s.programs.filter((p) => computeFeasibility(effective, p, equivEdges).status === "open").length
                  : 0;
                return <SchoolCard key={s.id} school={s} matchCount={matchCount} />;
              })}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

function CatalogFormationCard({
  group,
  effective,
  edges,
}: {
  group: FormationGroup;
  effective: ReturnType<typeof applyTrajectory> | null;
  edges: EquivalenceEdge[];
}) {
  const t = useTranslations("catalog");
  // La faisabilité dépend de la formation (diplômes acceptés, niveau), pas de
  // l'établissement : on la calcule sur une offre représentative.
  const rep = group.offerings[0];
  const feasibility = effective ? computeFeasibility(effective, rep, edges) : null;
  return (
    <Link
      href={`/formation/${group.key}`}
      className="block rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-[11px]">
            {feasibility ? <StatusBadge status={feasibility.status} /> : (
              <span className="px-2 py-0.5 rounded-full bg-black/5 text-[#1a1d24]/60">
                {t("noFeasibility")}
              </span>
            )}
          </div>
          <h3 className="font-medium text-[#1a1d24] leading-snug">{group.formationLabel}</h3>
          <p className="text-[12px] text-[#ee7768] font-medium mt-0.5 inline-flex items-center gap-1">
            📍 {t("establishmentsCount", { count: group.offerings.length })}
          </p>
          {group.outcomesJobs.length ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {group.outcomesJobs.slice(0, 3).map((j) => (
                <span
                  key={j}
                  className="px-2 py-0.5 rounded-full bg-[#ee776815] text-[#a8463a] text-[11px]"
                >
                  {j}
                </span>
              ))}
              {group.outcomesJobs.length > 3 ? (
                <span className="text-[11px] text-[#1a1d24]/50">+{group.outcomesJobs.length - 3}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        {feasibility ? (
          <GaugeCircular
            value={feasibility.probability.value}
            ci={feasibility.probability.ci}
            basedOn={feasibility.probability.basedOn}
            size={56}
            showCaption={false}
          />
        ) : null}
      </div>
    </Link>
  );
}
