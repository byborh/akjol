"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink, GraduationCap, Sparkles, Star, X } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { GaugeCircular } from "../../components/GaugeCircular";
import { StatusBadge } from "../../components/StatusBadge";
import { findProgram } from "../../data/programs";
import { findSchool } from "../../data/schools";
import { findCountry } from "../../data/countries";
import { computeFeasibility } from "../../engine/feasibility";
import { usePassportStore } from "../../store/passport-store";
import { applyTrajectory, useTrajectoryStore } from "../../store/trajectory-store";
import { useMounted } from "../../hooks/useMounted";

export default function ComparePage() {
  const mounted = useMounted();
  const programs = usePassportStore((s) => s.comparator);
  const schools = usePassportStore((s) => s.comparatorSchools);
  const togglePr = usePassportStore((s) => s.toggleCompare);
  const togglSc = usePassportStore((s) => s.toggleCompareSchool);
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);

  const effective = useMemo(
    () => (isComplete ? applyTrajectory(passport, { fromOverride, steps }) : null),
    [passport, fromOverride, steps, isComplete],
  );

  const programItems = programs.map(findProgram).filter(Boolean) as NonNullable<ReturnType<typeof findProgram>>[];
  const schoolItems = schools.map(findSchool).filter(Boolean) as NonNullable<ReturnType<typeof findSchool>>[];

  if (!mounted) return null;
  if (programItems.length === 0 && schoolItems.length === 0) {
    return (
      <PageContainer className="max-w-xl text-center pt-16">
        <Sparkles size={28} className="mx-auto text-[#ee7768] mb-3" />
        <h2 className="text-2xl font-medium tracking-tight">Rien à comparer pour l'instant</h2>
        <p className="text-[#1a1d24]/70 mt-2">
          Ajoute des formations ou des établissements au comparateur depuis leur fiche, ou depuis le catalogue.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 mt-6 font-medium text-white"
          style={{ background: "#ee7768" }}
        >
          Aller au catalogue
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-4"
      >
        <ArrowLeft size={14} /> Retour
      </Link>
      <h1 className="text-3xl font-medium tracking-tight mb-1">Comparateur</h1>
      <p className="text-sm text-[#1a1d24]/60 mb-6">
        Jusqu'à 4 formations et 4 établissements en parallèle. Les meilleures valeurs par ligne sont mises en valeur.
      </p>

      {programItems.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-lg font-medium tracking-tight mb-3 inline-flex items-center gap-2">
            <GraduationCap size={18} /> Formations ({programItems.length})
          </h2>
          <ProgramComparison items={programItems} effective={effective} onRemove={togglePr} />
        </section>
      ) : null}

      {schoolItems.length > 0 ? (
        <section>
          <h2 className="text-lg font-medium tracking-tight mb-3 inline-flex items-center gap-2">
            <Building2 size={18} /> Établissements ({schoolItems.length})
          </h2>
          <SchoolComparison items={schoolItems} effective={effective} onRemove={togglSc} />
        </section>
      ) : null}
    </PageContainer>
  );
}

function ProgramComparison({
  items,
  effective,
  onRemove,
}: {
  items: NonNullable<ReturnType<typeof findProgram>>[];
  effective: ReturnType<typeof applyTrajectory> | null;
  onRemove: (id: string) => void;
}) {
  const fzs = items.map((p) => (effective ? computeFeasibility(effective, p) : null));

  const probValues = fzs.map((f) => f?.probability.value ?? null);
  const bestProb = Math.max(...probValues.filter((v): v is number => v != null), -Infinity);
  const minDuration = Math.min(...items.map((p) => p.durationYears));
  const minCost = Math.min(...items.map((p) => p.costPerYear));

  return (
    <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
      <table className="w-full text-sm" style={{ minWidth: items.length * 220 + 200 }}>
        <thead>
          <tr className="border-b border-black/5">
            <th className="sticky left-0 bg-white px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold w-44">
              Critère
            </th>
            {items.map((p, i) => (
              <th key={p.id} className="px-4 py-3 text-left align-top min-w-[220px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    href={`/program/${p.id}`}
                    className="font-medium text-[#1a1d24] hover:text-[#ee7768] transition leading-tight"
                  >
                    {p.title}
                  </Link>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="text-[#1a1d24]/40 hover:text-[#7e2929] shrink-0"
                    aria-label="retirer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="text-[11px] text-[#1a1d24]/55">
                  {p.school.name} · {findCountry(p.countryRef)?.flag} {p.school.city}
                </div>
                {fzs[i] ? <div className="mt-2"><StatusBadge status={fzs[i]!.status} /></div> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="Probabilité d'admission">
            {items.map((_, i) => {
              const v = probValues[i];
              return (
                <Cell key={i} highlight={v != null && v === bestProb && bestProb >= 0}>
                  {fzs[i] ? (
                    <GaugeCircular
                      value={fzs[i]!.probability.value}
                      ci={fzs[i]!.probability.ci}
                      basedOn={fzs[i]!.probability.basedOn}
                      size={68}
                      showCaption={false}
                    />
                  ) : (
                    <span className="text-[#1a1d24]/40 text-xs">Pas de passeport</span>
                  )}
                </Cell>
              );
            })}
          </Row>
          <Row label="Durée">
            {items.map((p, i) => (
              <Cell key={i} highlight={p.durationYears === minDuration && items.length > 1}>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {p.durationYears} an{p.durationYears > 1 ? "s" : ""}
                </span>
              </Cell>
            ))}
          </Row>
          <Row label="Frais / an">
            {items.map((p, i) => (
              <Cell key={i} highlight={p.costPerYear === minCost && items.length > 1}>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {p.costPerYear === 0 ? "Gratuit" : `${p.costPerYear.toLocaleString("fr-FR")} €`}
                </span>
              </Cell>
            ))}
          </Row>
          <Row label="Coût total estimé">
            {items.map((p, i) => (
              <Cell key={i}>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {p.costPerYear === 0 ? "Gratuit" : `~${(p.costPerYear * p.durationYears).toLocaleString("fr-FR")} €`}
                </span>
              </Cell>
            ))}
          </Row>
          <Row label="Langue requise">
            {items.map((p, i) => (
              <Cell key={i}>
                {p.language.code.toUpperCase()} {p.language.minLevel}
              </Cell>
            ))}
          </Row>
          <Row label="Alternance">
            {items.map((p, i) => (
              <Cell key={i} highlight={p.workStudy && items.some((q) => !q.workStudy)}>
                {p.workStudy ? "Oui" : "Non"}
              </Cell>
            ))}
          </Row>
          <Row label="Plateforme">
            {items.map((p, i) => (
              <Cell key={i}>{p.admissionPlatform}</Cell>
            ))}
          </Row>
          <Row label="Métiers de sortie">
            {items.map((p, i) => (
              <Cell key={i}>
                <div className="flex flex-wrap gap-1">
                  {p.outcomesJobs.slice(0, 3).map((j) => (
                    <span
                      key={j}
                      className="px-1.5 py-0.5 rounded-full bg-[#ee776815] text-[#a8463a] text-[10px]"
                    >
                      {j}
                    </span>
                  ))}
                  {p.outcomesJobs.length > 3 ? (
                    <span className="text-[10px] text-[#1a1d24]/50">+{p.outcomesJobs.length - 3}</span>
                  ) : null}
                  {p.outcomesJobs.length === 0 ? (
                    <span className="text-[10px] text-[#1a1d24]/40">—</span>
                  ) : null}
                </div>
              </Cell>
            ))}
          </Row>
          <Row label="Reconnu dans">
            {items.map((p, i) => (
              <Cell key={i}>
                <div className="flex flex-wrap gap-0.5">
                  {p.internationallyRecognizedIn.slice(0, 8).map((iso) => (
                    <span key={iso}>{findCountry(iso)?.flag ?? iso}</span>
                  ))}
                  {p.internationallyRecognizedIn.length > 8 ? (
                    <span className="text-[10px] text-[#1a1d24]/50">+{p.internationallyRecognizedIn.length - 8}</span>
                  ) : null}
                </div>
              </Cell>
            ))}
          </Row>
        </tbody>
      </table>
    </div>
  );
}

function SchoolComparison({
  items,
  effective,
  onRemove,
}: {
  items: NonNullable<ReturnType<typeof findSchool>>[];
  effective: ReturnType<typeof applyTrajectory> | null;
  onRemove: (id: string) => void;
}) {
  const ratings = items.map((s) => s.rating ?? 0);
  const bestRating = Math.max(...ratings);
  const programCounts = items.map((s) => s.programs.length);
  const maxPrograms = Math.max(...programCounts);
  const matchCounts = items.map((s) =>
    effective ? s.programs.filter((p) => computeFeasibility(effective, p).status === "open").length : 0,
  );
  const maxMatch = Math.max(...matchCounts);

  return (
    <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
      <table className="w-full text-sm" style={{ minWidth: items.length * 220 + 200 }}>
        <thead>
          <tr className="border-b border-black/5">
            <th className="sticky left-0 bg-white px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold w-44">
              Critère
            </th>
            {items.map((s) => (
              <th key={s.id} className="px-4 py-3 text-left align-top min-w-[220px]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    href={`/school/${s.id}`}
                    className="font-medium text-[#1a1d24] hover:text-[#ee7768] transition leading-tight"
                  >
                    {s.name}
                  </Link>
                  <button
                    onClick={() => onRemove(s.id)}
                    className="text-[#1a1d24]/40 hover:text-[#7e2929] shrink-0"
                    aria-label="retirer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="text-[11px] text-[#1a1d24]/55">
                  {findCountry(s.countryRef)?.flag} {s.city}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="Type">
            {items.map((s, i) => (
              <Cell key={i}>{s.type ?? "—"}</Cell>
            ))}
          </Row>
          <Row label="Note">
            {items.map((s, i) => (
              <Cell key={i} highlight={(s.rating ?? 0) === bestRating && items.length > 1 && bestRating > 0}>
                {typeof s.rating === "number" ? (
                  <span className="inline-flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
                    <Star size={11} className="text-[#f5b86a]" fill="currentColor" /> {s.rating.toFixed(1)}
                  </span>
                ) : (
                  "—"
                )}
              </Cell>
            ))}
          </Row>
          <Row label="Formations référencées">
            {items.map((s, i) => (
              <Cell key={i} highlight={programCounts[i] === maxPrograms && items.length > 1}>
                <span style={{ fontFamily: "var(--font-mono)" }}>{programCounts[i]}</span>
              </Cell>
            ))}
          </Row>
          {effective ? (
            <Row label="Match avec ton profil">
              {items.map((_, i) => (
                <Cell key={i} highlight={matchCounts[i] === maxMatch && maxMatch > 0}>
                  <span className="font-semibold text-[#3a6f2c]" style={{ fontFamily: "var(--font-mono)" }}>
                    {matchCounts[i]}
                  </span>{" "}
                  ouvert{matchCounts[i] > 1 ? "s" : ""}
                </Cell>
              ))}
            </Row>
          ) : null}
          <Row label="Liens">
            {items.map((s, i) => (
              <Cell key={i}>
                <div className="flex flex-col gap-1 text-[12px]">
                  {s.websiteUrl ? (
                    <a
                      href={s.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#ee7768] hover:underline"
                    >
                      Site officiel <ExternalLink size={10} />
                    </a>
                  ) : null}
                  {s.jpoUrl ? (
                    <a
                      href={s.jpoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#ee7768] hover:underline"
                    >
                      JPO <ExternalLink size={10} />
                    </a>
                  ) : null}
                </div>
              </Cell>
            ))}
          </Row>
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-black/5 last:border-b-0">
      <td className="sticky left-0 bg-white px-4 py-3 text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold align-top w-44">
        {label}
      </td>
      {children}
    </tr>
  );
}

function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td
      className="px-4 py-3 align-top"
      style={{
        background: highlight ? "#a3cf9118" : undefined,
      }}
    >
      <div className="flex items-start gap-1.5">
        <div className="flex-1">{children}</div>
        {highlight ? (
          <span className="text-[10px] uppercase tracking-wider text-[#3a6f2c] font-semibold">★</span>
        ) : null}
      </div>
    </td>
  );
}
