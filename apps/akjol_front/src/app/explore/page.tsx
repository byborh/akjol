"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, Sparkles, List, Globe as GlobeIcon } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { ProgramCard } from "../../components/ProgramCard";
import { TrajectoryBar } from "../../components/TrajectoryBar";
import { FromToSearch } from "../../components/FromToSearch";
import { Globe } from "../../components/Globe";
import { JobTargetPanel } from "../../components/JobTargetPanel";
import { PROGRAMS } from "../../data/programs";
import { COUNTRIES } from "../../data/countries";
import { computeFeasibility } from "../../engine/feasibility";
import { usePassportStore } from "../../store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../../store/trajectory-store";
import { useMounted } from "../../hooks/useMounted";
import type { FeasibilityStatus } from "../../types";

const STATUS_ORDER: Record<FeasibilityStatus, number> = {
  open: 0,
  open_with_step: 1,
  closed: 2,
  uncovered: 3,
};

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreInner />
    </Suspense>
  );
}

function ExploreInner() {
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const hydrated = usePassportStore((s) => s.hydrated);

  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const loadFromUrl = useTrajectoryStore((s) => s.loadFromUrl);

  const [onlyOpen, setOnlyOpen] = useState(false);
  const [country, setCountry] = useState<string>("");
  const [aimFilter, setAimFilter] = useState<string>("");
  const [view, setView] = useState<"list" | "globe">("list");

  // URL → store : une seule fois au mount, pour permettre les liens partagés
  // (?from=…&via=…). Ensuite c'est strictement à sens unique store → URL —
  // sinon le router.replace ci-dessous re-fait remonter l'URL au store, qui
  // recrée des références d'array → relance un replace → ping-pong infini.
  const didLoadFromUrl = useRef(false);
  useEffect(() => {
    if (didLoadFromUrl.current) return;
    didLoadFromUrl.current = true;
    loadFromUrl({ from: searchParams.get("from"), via: searchParams.get("via") });
  }, [loadFromUrl, searchParams]);

  // Store → URL : on synchronise l'URL après chaque changement de trajectoire.
  // On compare au snapshot URL courant pour ne pas dispatcher un replace inutile.
  const lastWrittenUrl = useRef<string | null>(null);
  useEffect(() => {
    if (!didLoadFromUrl.current) return;
    const params = new URLSearchParams();
    if (fromOverride) params.set("from", fromOverride.code);
    if (steps.length) params.set("via", steps.map((s) => s.programId).join(","));
    const qs = params.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    if (target === lastWrittenUrl.current) return;
    lastWrittenUrl.current = target;
    router.replace(target, { scroll: false });
  }, [fromOverride, steps, pathname, router]);

  const effective = useMemo(
    () => applyTrajectory(passport, { fromOverride, steps }),
    [passport, fromOverride, steps],
  );

  const enriched = useMemo(() => {
    const visitedIds = new Set(steps.map((s) => s.programId));
    return PROGRAMS.filter((p) => !visitedIds.has(p.id))
      .map((p) => ({ program: p, feasibility: computeFeasibility(effective, p) }))
      .sort((a, b) => {
        const s = STATUS_ORDER[a.feasibility.status] - STATUS_ORDER[b.feasibility.status];
        if (s !== 0) return s;
        return b.feasibility.probability.value - a.feasibility.probability.value;
      });
  }, [effective, steps]);

  const filtered = useMemo(() => {
    const aim = aimFilter.trim().toLowerCase();
    return enriched.filter((e) => {
      if (onlyOpen && e.feasibility.status !== "open") return false;
      if (country && e.program.countryRef !== country) return false;
      if (aim) {
        const haystack = [
          ...e.program.outcomesJobs,
          ...e.program.domains,
          e.program.title,
          e.program.description,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(aim)) return false;
      }
      return true;
    });
  }, [enriched, onlyOpen, country, aimFilter]);

  const stats = useMemo(() => {
    const open = enriched.filter((e) => e.feasibility.status === "open").length;
    const ambre = enriched.filter((e) => e.feasibility.status === "open_with_step").length;
    const closed = enriched.filter((e) => e.feasibility.status === "closed").length;
    return { open, ambre, closed };
  }, [enriched]);

  if (mounted && hydrated && !isComplete) {
    return (
      <PageContainer className="max-w-xl text-center pt-16">
        <Sparkles size={28} className="mx-auto text-[#ee7768] mb-3" />
        <h2 className="text-2xl font-medium tracking-tight">Avant de te montrer le monde…</h2>
        <p className="text-[#1a1d24]/70 mt-2">
          J'ai besoin de te connaître. Construis ton passeport-éducation, ça prend 1 à 2 minutes.
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
          style={{ background: "#ee7768" }}
        >
          Construire mon passeport
        </button>
      </PageContainer>
    );
  }

  const fromLabel = fromOverride?.label ?? passport.currentDiploma?.label ?? "—";
  const fromCode = fromOverride?.code ?? passport.currentDiploma?.code ?? "";
  const isVirtualMode = Boolean(fromOverride) || steps.length > 0;

  return (
    <>
      <TrajectoryBar />
      <PageContainer>
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">
              {isVirtualMode ? "Suite possible" : "Tes possibilités"}
            </h1>
            <p className="text-sm text-[#1a1d24]/70 mt-1">
              <span className="font-semibold text-[#3a6f2c]">{stats.open}</span> ouverts ·{" "}
              <span className="font-semibold text-[#8a5314]">{stats.ambre}</span> avec une étape ·{" "}
              <span className="font-semibold text-[#7e2929]">{stats.closed}</span> fermés
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-black/5 bg-white p-0.5">
              <button
                onClick={() => setView("list")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition"
                style={{
                  background: view === "list" ? "#ee776812" : "transparent",
                  color: view === "list" ? "#ee7768" : "#1a1d24b3",
                }}
                aria-pressed={view === "list"}
              >
                <List size={14} /> Liste
              </button>
              <button
                onClick={() => setView("globe")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition"
                style={{
                  background: view === "globe" ? "#ee776812" : "transparent",
                  color: view === "globe" ? "#ee7768" : "#1a1d24b3",
                }}
                aria-pressed={view === "globe"}
              >
                <GlobeIcon size={14} /> Globe
              </button>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-black/5 rounded-lg">
              <Filter size={14} className="text-[#1a1d24]/50" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="text-sm bg-transparent outline-none"
              >
                <option value="">Tous les pays</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setOnlyOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition"
              style={{
                borderColor: onlyOpen ? "#a3cf91" : "#0000000d",
                background: onlyOpen ? "#a3cf9120" : "#fff",
                color: onlyOpen ? "#3a6f2c" : "#1a1d24",
              }}
            >
              Ouverts uniquement
            </button>
          </div>
        </header>

        <div className="mb-5">
          <FromToSearch
            currentFromLabel={fromLabel}
            currentFromCode={fromCode}
            aimFilter={aimFilter}
            onAimChange={setAimFilter}
          />
        </div>

        <div className="mb-5">
          <JobTargetPanel />
        </div>

        {isVirtualMode ? (
          <div className="mb-4 rounded-xl bg-[#ee776810] border border-[#ee7768]/20 px-4 py-3 text-[12px] text-[#a8463a] flex items-center gap-2">
            <Sparkles size={13} />
            <span>
              <strong>Mode exploration virtuelle.</strong> Ton passeport réel n'est pas modifié. Clique « Continuer
              depuis ici » sur une carte pour ajouter une étape, ou clique une chip dans la barre pour remonter.
            </span>
          </div>
        ) : null}

        {view === "globe" ? (
          <div className="mb-6">
            <Globe height={560} />
            <p className="mt-3 text-[12px] text-[#1a1d24]/60">
              Survole un pays pour voir ses stats. Clique pour ouvrir le détail.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#1a1d24]/60">Aucun programme avec ces filtres.</p>
            ) : null}
            {filtered.map(({ program, feasibility }) => (
              <ProgramCard key={program.id} program={program} feasibility={feasibility} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
