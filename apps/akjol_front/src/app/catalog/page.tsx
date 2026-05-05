"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LayoutGrid, Map as MapIcon, Search, Sparkles, X } from "lucide-react";
import { PageContainer } from "../../new-ui/components/PageContainer";
import { SchoolCard } from "../../new-ui/components/SchoolCard";
import { GaugeCircular } from "../../new-ui/components/GaugeCircular";
import { StatusBadge } from "../../new-ui/components/StatusBadge";
import { PROGRAMS } from "../../new-ui/data/programs";
import { COUNTRIES } from "../../new-ui/data/countries";
import { getAllSchools, getUniqueCities } from "../../new-ui/data/schools";
import { computeFeasibility } from "../../new-ui/engine/feasibility";
import { usePassportStore } from "../../new-ui/store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../../new-ui/store/trajectory-store";
import type { Program, ProgramLevel } from "../../new-ui/types";

const SchoolMap = dynamic(() => import("../../new-ui/components/SchoolMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-black/5 bg-white h-[480px] flex items-center justify-center text-sm text-[#1a1d24]/50">
      Chargement de la carte…
    </div>
  ),
});

type ViewMode = "formations" | "schools";
type SchoolDisplayMode = "list" | "map";

const LEVELS: { code: ProgramLevel; label: string }[] = [
  { code: "lycee", label: "Lycée / Prépa" },
  { code: "licence", label: "Licence" },
  { code: "licence_pro", label: "Licence pro" },
  { code: "bachelor", label: "Bachelor" },
  { code: "master", label: "Master" },
  { code: "ecole_inge", label: "École d'ingé" },
  { code: "doctorat", label: "Doctorat" },
];

const DOMAINS = ["Tech", "Santé", "Sciences", "Industrie", "Affaires", "Arts", "Droit", "Sciences humaines"];

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
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);

  const [view, setView] = useState<ViewMode>("formations");
  const [schoolDisplay, setSchoolDisplay] = useState<SchoolDisplayMode>("list");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState<ProgramLevel | "">("");
  const [domain, setDomain] = useState<string>("");
  const [city, setCity] = useState("");

  const effective = useMemo(
    () => (isComplete ? applyTrajectory(passport, { fromOverride, steps }) : null),
    [passport, fromOverride, steps, isComplete],
  );

  const filteredFormations = useMemo(() => {
    const q = normalize(search.trim());
    return PROGRAMS.filter((p) => {
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
  }, [search, country, level, domain]);

  const filteredSchools = useMemo(() => {
    const q = normalize(search.trim());
    return getAllSchools().filter((s) => {
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
  }, [search, country, city, level, domain]);

  return (
    <PageContainer>
      <header className="mb-5">
        <h1 className="text-3xl font-medium tracking-tight">Catalogue</h1>
        <p className="text-sm text-[#1a1d24]/70 mt-1">
          Visite toutes les formations et tous les établissements — sans simulation, sans pression. Le filtre
          fonctionne dans les deux sens : choisis une formation pour voir les écoles qui la proposent, ou choisis
          une école pour voir ses formations.
        </p>
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
          📚 Formations ({PROGRAMS.length})
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
          🏢 Établissements ({getAllSchools().length})
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-black/5 p-4 mb-5">
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-stretch">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1d24]/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                view === "formations"
                  ? "Cherche une formation, un métier, une école…"
                  : "Cherche un établissement, une ville…"
              }
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
            <option value="">Tous pays</option>
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
            <option value="">Tous niveaux</option>
            {LEVELS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          {view === "formations" ? (
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm"
            >
              <option value="">Tous domaines</option>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm"
            >
              <option value="">Toutes villes</option>
              {getUniqueCities().map((c) => (
                <option key={c} value={c}>
                  📍 {c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-3 text-[11px] text-[#1a1d24]/50">
          {view === "formations"
            ? `${filteredFormations.length} formation${filteredFormations.length > 1 ? "s" : ""}`
            : `${filteredSchools.length} établissement${filteredSchools.length > 1 ? "s" : ""}`}
          {effective ? (
            <span className="ml-2 inline-flex items-center gap-1">
              <Sparkles size={11} className="text-[#ee7768]" />
              Les badges « match avec ton profil » apparaissent quand le programme est ouvert pour ton passeport
              actuel.
            </span>
          ) : (
            <Link href="/onboarding" className="ml-2 text-[#ee7768] hover:underline">
              Crée ton passeport pour voir les matches →
            </Link>
          )}
        </div>
      </div>

      {view === "formations" ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {filteredFormations.length === 0 ? (
            <p className="text-sm text-[#1a1d24]/60">Aucune formation avec ces filtres.</p>
          ) : null}
          {filteredFormations.map((p) => (
            <CatalogProgramCard key={p.id} program={p} effective={effective} />
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
                <LayoutGrid size={12} /> Liste
              </button>
              <button
                onClick={() => setSchoolDisplay("map")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition"
                style={{
                  background: schoolDisplay === "map" ? "#fff" : "transparent",
                  color: schoolDisplay === "map" ? "#ee7768" : "#1a1d2480",
                }}
              >
                <MapIcon size={12} /> Carte
              </button>
            </div>
            {schoolDisplay === "map" ? (
              <span className="text-[11px] text-[#1a1d24]/50">
                Cluster par ville · clic pour ouvrir une école · taille = nb de formations · vert = match avec
                ton profil
              </span>
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
                        s.programs.filter((p) => computeFeasibility(effective, p).status === "open").length,
                      ]),
                    )
                  : {}
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredSchools.length === 0 ? (
                <p className="text-sm text-[#1a1d24]/60">Aucun établissement avec ces filtres.</p>
              ) : null}
              {filteredSchools.map((s) => {
                const matchCount = effective
                  ? s.programs.filter((p) => computeFeasibility(effective, p).status === "open").length
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

function CatalogProgramCard({
  program,
  effective,
}: {
  program: Program;
  effective: ReturnType<typeof applyTrajectory> | null;
}) {
  const feasibility = effective ? computeFeasibility(effective, program) : null;
  return (
    <Link
      href={`/program/${program.id}`}
      className="block rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-[11px]">
            {feasibility ? <StatusBadge status={feasibility.status} /> : (
              <span className="px-2 py-0.5 rounded-full bg-black/5 text-[#1a1d24]/60">
                Pas de passeport — feasibility non calculée
              </span>
            )}
          </div>
          <h3 className="font-medium text-[#1a1d24] leading-snug">{program.title}</h3>
          <p className="text-[12px] text-[#1a1d24]/60 mt-0.5">
            {program.school.name} · {program.school.city}
          </p>
          {program.outcomesJobs.length ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {program.outcomesJobs.slice(0, 3).map((j) => (
                <span
                  key={j}
                  className="px-2 py-0.5 rounded-full bg-[#ee776815] text-[#a8463a] text-[11px]"
                >
                  {j}
                </span>
              ))}
              {program.outcomesJobs.length > 3 ? (
                <span className="text-[11px] text-[#1a1d24]/50">+{program.outcomesJobs.length - 3}</span>
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
