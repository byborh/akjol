"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Sparkles } from "lucide-react";
import { PageContainer } from "../../../new-ui/components/PageContainer";
import { ProgramCard } from "../../../new-ui/components/ProgramCard";
import { PROGRAMS } from "../../../new-ui/data/programs";
import { COUNTRIES } from "../../../new-ui/data/countries";
import { computeFeasibility } from "../../../new-ui/engine/feasibility";
import { usePassportStore } from "../../../new-ui/store/passport-store";
import type { FeasibilityStatus } from "../../../new-ui/types";

const STATUS_ORDER: Record<FeasibilityStatus, number> = {
  open: 0,
  open_with_step: 1,
  closed: 2,
  uncovered: 3,
};

export default function ExplorePage() {
  const router = useRouter();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const hydrated = usePassportStore((s) => s.hydrated);

  const [onlyOpen, setOnlyOpen] = useState(false);
  const [country, setCountry] = useState<string>("");

  const enriched = useMemo(() => {
    return PROGRAMS.map((p) => ({ program: p, feasibility: computeFeasibility(passport, p) }))
      .sort((a, b) => {
        const s = STATUS_ORDER[a.feasibility.status] - STATUS_ORDER[b.feasibility.status];
        if (s !== 0) return s;
        return b.feasibility.probability.value - a.feasibility.probability.value;
      });
  }, [passport]);

  const filtered = useMemo(() => {
    return enriched.filter((e) => {
      if (onlyOpen && e.feasibility.status !== "open") return false;
      if (country && e.program.countryRef !== country) return false;
      return true;
    });
  }, [enriched, onlyOpen, country]);

  const stats = useMemo(() => {
    const open = enriched.filter((e) => e.feasibility.status === "open").length;
    const ambre = enriched.filter((e) => e.feasibility.status === "open_with_step").length;
    const closed = enriched.filter((e) => e.feasibility.status === "closed").length;
    return { open, ambre, closed };
  }, [enriched]);

  if (hydrated && !isComplete) {
    return (
      <PageContainer className="max-w-xl text-center pt-16">
        <Sparkles size={28} className="mx-auto text-[#ee7768] mb-3" />
        <h2 className="text-2xl font-medium tracking-tight">Avant de te montrer le monde…</h2>
        <p className="text-[#1a1d24]/70 mt-2">
          J'ai besoin de te connaître. Construis ton passeport-éducation, ça prend 1 à 2 minutes.
        </p>
        <button
          onClick={() => router.push("/new-ui/onboarding")}
          className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
          style={{ background: "#ee7768" }}
        >
          Construire mon passeport
        </button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Tes possibilités</h1>
          <p className="text-sm text-[#1a1d24]/70 mt-1">
            <span className="font-semibold text-[#3a6f2c]">{stats.open}</span> ouverts ·{" "}
            <span className="font-semibold text-[#8a5314]">{stats.ambre}</span> avec une étape ·{" "}
            <span className="font-semibold text-[#7e2929]">{stats.closed}</span> fermés
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      <div className="mb-4 rounded-xl bg-white border border-black/5 px-4 py-3 text-[12px] text-[#1a1d24]/70">
        <strong className="text-[#1a1d24]">Phase 0</strong> — la liste remplace temporairement le globe-routeur.
        Le globe 3D + le drawer pays arrivent en Phase 1 (cf. <Link href="/" className="underline">doc</Link>).
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-[#1a1d24]/60">Aucun programme avec ces filtres.</p>
        ) : null}
        {filtered.map(({ program, feasibility }) => (
          <ProgramCard key={program.id} program={program} feasibility={feasibility} />
        ))}
      </div>
    </PageContainer>
  );
}
