"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, X, Plane, Coins, ScrollText, ExternalLink } from "lucide-react";
import { PageContainer } from "../../../components/PageContainer";
import { ProgramCard } from "../../../components/ProgramCard";
import { Globe } from "../../../components/Globe";
import { findCountry } from "../../../data/countries";
import { PROGRAMS } from "../../../data/programs";
import { findCorridor } from "../../../data/visaCorridors";
import { citiesByCountry, totalMonthly, avgMonthlyEurForCountry } from "../../../data/costOfLiving";
import { computeFeasibility } from "../../../engine/feasibility";
import { usePassportStore } from "../../../store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../../../store/trajectory-store";
import type { FeasibilityStatus } from "../../../types";

const STATUS_ORDER: Record<FeasibilityStatus, number> = {
  open: 0,
  open_with_step: 1,
  closed: 2,
  uncovered: 3,
};

export default function CountryDrawerPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = use(params);
  const iso2 = country.toUpperCase();
  const meta = findCountry(iso2);

  const passport = usePassportStore((s) => s.passport);
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const effective = useMemo(
    () => applyTrajectory(passport, { fromOverride, steps }),
    [passport, fromOverride, steps],
  );

  const [onlyOpen, setOnlyOpen] = useState(false);

  const enriched = useMemo(() => {
    return PROGRAMS.filter((p) => p.countryRef === iso2)
      .map((p) => ({ program: p, feasibility: computeFeasibility(effective, p) }))
      .sort((a, b) => {
        const s = STATUS_ORDER[a.feasibility.status] - STATUS_ORDER[b.feasibility.status];
        if (s !== 0) return s;
        return b.feasibility.probability.value - a.feasibility.probability.value;
      });
  }, [effective, iso2]);

  const stats = useMemo(() => {
    const open = enriched.filter((e) => e.feasibility.status === "open").length;
    const amber = enriched.filter((e) => e.feasibility.status === "open_with_step").length;
    const closed = enriched.filter((e) => e.feasibility.status === "closed").length;
    return { open, amber, closed, total: enriched.length };
  }, [enriched]);

  const visible = onlyOpen
    ? enriched.filter((e) => e.feasibility.status === "open")
    : enriched;

  const openItems = visible.filter((e) => e.feasibility.status === "open");
  const amberItems = visible.filter((e) => e.feasibility.status === "open_with_step");
  const closedItems = visible.filter((e) => e.feasibility.status === "closed");

  const corridor = findCorridor(passport.origin.country || "FR", iso2);
  const cities = citiesByCountry(iso2);
  const avg = avgMonthlyEurForCountry(iso2);

  if (!meta) {
    return (
      <PageContainer className="max-w-xl text-center pt-16">
        <h2 className="text-2xl font-medium tracking-tight">Pays inconnu</h2>
        <p className="text-[#1a1d24]/70 mt-2">Le code pays « {iso2} » n'est pas dans notre base.</p>
        <Link href="/explore" className="mt-6 inline-flex items-center gap-2 text-[#ee7768]">
          <ArrowLeft size={14} /> Retour à l'exploration
        </Link>
      </PageContainer>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-5 py-4">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-3"
      >
        <ArrowLeft size={14} /> Retour au globe
      </Link>

      <div className="grid lg:grid-cols-[1fr_420px] gap-5">
        {/* Globe panel */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <Globe height={620} />
          </div>
        </div>

        {/* Drawer panel */}
        <aside className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <header className="sticky top-0 bg-white z-10 border-b border-black/5 px-5 pt-5 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-3xl mb-1">{meta.flag}</div>
                <h1 className="text-2xl font-medium tracking-tight">{meta.name}</h1>
                <p className="text-sm text-[#1a1d24]/70 mt-1">
                  <span className="font-semibold text-[#3a6f2c]">{stats.open}</span> ouverts ·{" "}
                  <span className="font-semibold text-[#8a5314]">{stats.amber}</span> avec étape ·{" "}
                  <span className="font-semibold text-[#7e2929]">{stats.closed}</span> fermés
                </p>
              </div>
              <Link
                href="/explore"
                className="rounded-full p-2 hover:bg-black/5 transition shrink-0"
                aria-label="Fermer"
              >
                <X size={18} />
              </Link>
            </div>
            <div className="mt-3">
              <button
                onClick={() => setOnlyOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition"
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

          <div className="px-5 py-4 space-y-6">
            {stats.total === 0 ? (
              <p className="text-sm text-[#1a1d24]/60">
                Aucun programme couvert pour ce pays dans notre base actuelle.
              </p>
            ) : null}

            {openItems.length > 0 ? (
              <Section title="Programmes ouverts directement" count={openItems.length}>
                <div className="space-y-3">
                  {openItems.map(({ program, feasibility }) => (
                    <ProgramCard key={program.id} program={program} feasibility={feasibility} />
                  ))}
                </div>
              </Section>
            ) : null}

            {amberItems.length > 0 ? (
              <Section title="Programmes avec une étape" count={amberItems.length}>
                <div className="space-y-3">
                  {amberItems.map(({ program, feasibility }) => (
                    <ProgramCard key={program.id} program={program} feasibility={feasibility} />
                  ))}
                </div>
              </Section>
            ) : null}

            {closedItems.length > 0 && !onlyOpen ? (
              <Section title="Programmes fermés (avec raison)" count={closedItems.length}>
                <div className="space-y-3">
                  {closedItems.map(({ program, feasibility }) => (
                    <div key={program.id} className="rounded-lg border border-black/5 bg-[#fafaf7] p-3">
                      <div className="text-sm font-medium">{program.title}</div>
                      <div className="text-xs text-[#1a1d24]/60 mt-0.5">{program.school.name}</div>
                      {feasibility.blockers.length > 0 ? (
                        <ul className="mt-2 text-[12px] text-[#7e2929] space-y-0.5 list-disc pl-4">
                          {feasibility.blockers.map((b, i) => (
                            <li key={i}>{b.label}</li>
                          ))}
                        </ul>
                      ) : null}
                      <Link
                        href={`/program/${program.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-[12px] text-[#1a1d24]/50 hover:text-[#1a1d24]"
                      >
                        Voir la fiche →
                      </Link>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section title="Démarches visa pour toi" icon={<Plane size={14} />}>
              {corridor ? (
                <div className="rounded-lg border border-black/5 bg-[#fafaf7] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{corridor.visaName}</div>
                    <ComplexityChip complexity={corridor.complexity} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[12px]">
                    <Stat label="Délai" value={`${corridor.processingDays}j`} />
                    <Stat
                      label="Frais"
                      value={
                        corridor.fee === 0
                          ? "—"
                          : `${corridor.fee.toLocaleString("fr-FR")} ${corridor.feeCurrency}`
                      }
                    />
                    <Stat label="Refus" value={`${Math.round(corridor.refusalRate * 100)}%`} />
                  </div>
                  {corridor.requiredDocs.length > 0 ? (
                    <details className="text-[12px]">
                      <summary className="cursor-pointer text-[#1a1d24]/70">
                        {corridor.requiredDocs.length} documents requis
                      </summary>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[#1a1d24]/80">
                        {corridor.requiredDocs.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                  {corridor.sources.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {corridor.sources.map((s) => (
                        <a
                          key={s.url}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#1a1d24]/60 hover:text-[#ee7768]"
                        >
                          {s.label} <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <div className="text-[10px] text-[#1a1d24]/40">
                    Données vérifiées le {corridor.reviewedAt}
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-[#1a1d24]/60">
                  Corridor visa non documenté pour {passport.origin.country || "ton pays"} →{" "}
                  {meta.name}. Ajout en cours.
                </p>
              )}
            </Section>

            <Section title={`Vivre en ${meta.name}`} icon={<Coins size={14} />}>
              {cities.length > 0 ? (
                <div className="space-y-2">
                  {avg !== undefined ? (
                    <p className="text-[12px] text-[#1a1d24]/70">
                      Coût mensuel moyen estimé étudiant :{" "}
                      <span className="font-semibold text-[#1a1d24]">
                        ~{Math.round(avg).toLocaleString("fr-FR")} €
                      </span>
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2">
                    {cities.slice(0, 3).map((c) => {
                      const total = totalMonthly(c);
                      return (
                        <div key={c.city} className="rounded-lg border border-black/5 bg-[#fafaf7] p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">{c.city}</div>
                            <div className="text-xs font-mono text-[#1a1d24]/70">
                              ~{total.toLocaleString("fr-FR")} {c.currency}/mois
                            </div>
                          </div>
                          <div className="mt-1 text-[11px] text-[#1a1d24]/60">
                            Loyer {c.monthlyRent} · Alim. {c.monthlyFood} · Transport {c.monthlyTransport} · Autres {c.monthlyOther}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-[#1a1d24]/60">Données coût de la vie à venir.</p>
              )}
            </Section>

            <Section title="Sources & démarches officielles" icon={<ScrollText size={14} />}>
              <ul className="text-[12px] space-y-1">
                {corridor?.sources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1a1d24]/70 hover:text-[#ee7768]"
                    >
                      {s.label} <ExternalLink size={10} />
                    </a>
                  </li>
                ))}
                {!corridor ? (
                  <li className="text-[#1a1d24]/60">Aucune source liée pour ce corridor.</li>
                ) : null}
              </ul>
            </Section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  icon,
  children,
}: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-medium text-[#1a1d24]/50 mb-2">
        {icon}
        {title}
        {count !== undefined ? <span className="text-[#1a1d24]/30">· {count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white border border-black/5 px-2 py-1.5">
      <div className="text-[10px] text-[#1a1d24]/50 uppercase tracking-wider">{label}</div>
      <div className="text-[12px] font-medium text-[#1a1d24]">{value}</div>
    </div>
  );
}

function ComplexityChip({ complexity }: { complexity: "simple" | "medium" | "complex" }) {
  const map = {
    simple: { bg: "#a3cf9120", fg: "#3a6f2c", label: "Simple" },
    medium: { bg: "#f5b86a25", fg: "#8a5314", label: "Moyen" },
    complex: { bg: "#d9656520", fg: "#7e2929", label: "Complexe" },
  } as const;
  const c = map[complexity];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}
