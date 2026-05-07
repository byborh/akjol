"use client";

import { useMemo, useState } from "react";
import { Coins, Briefcase, AlertTriangle } from "lucide-react";
import type { Program, Passport } from "../types";
import { findCity, totalMonthlyEur, type CostOfLiving } from "../data/costOfLiving";
import { findCountry } from "../data/countries";

type Props = {
  programs: Program[];
  passport: Passport;
  className?: string;
};

const TO_EUR: Record<string, number> = {
  EUR: 1,
  GBP: 1.18,
  USD: 0.92,
  CAD: 0.68,
  SGD: 0.69,
  MYR: 0.21,
  CHF: 1.05,
  default: 1,
};

const TRAVEL_PER_TRIP_EUR: Record<string, number> = {
  FR: 0,
  BE: 50,
  CH: 80,
  DE: 120,
  GB: 150,
  ES: 130,
  US: 700,
  CA: 600,
  SG: 900,
  MY: 950,
};

function travelCostFor(originIso: string, destIso: string, years: number): number {
  if (!originIso || originIso === destIso) return 0;
  const perTrip = TRAVEL_PER_TRIP_EUR[destIso] ?? 200;
  return Math.round(perTrip * 2 * years);
}

function colForProgram(p: Program): CostOfLiving | undefined {
  return findCity(p.school.city);
}

export function BudgetSummary({ programs, passport, className }: Props) {
  const [skipYear, setSkipYear] = useState(false);
  const [paidInternship, setPaidInternship] = useState(false);

  const breakdown = useMemo(() => {
    let tuition = 0;
    let living = 0;
    let travel = 0;
    let years = 0;
    let internshipDiscount = 0;
    let workStudyOffset = 0;

    for (const p of programs) {
      const dur = p.durationYears + (skipYear ? 0.5 : 0);
      years += dur;
      tuition += p.costPerYear * dur;
      const col = colForProgram(p);
      if (col) {
        living += totalMonthlyEur(col) * 12 * dur;
      } else {
        living += 800 * 12 * dur;
      }
      travel += travelCostFor(passport.origin.country, p.countryRef, dur);
      if (paidInternship && p.recommendsInternshipWeeks) {
        internshipDiscount += Math.min(
          p.recommendsInternshipWeeks * 600,
          p.costPerYear * dur,
        );
      }
      if (p.workStudy) {
        workStudyOffset += p.costPerYear * dur;
      }
    }

    const grossLiving = Math.round(living);
    const grossTuition = Math.round(tuition);
    const grossTravel = Math.round(travel);
    const offsets = Math.round(internshipDiscount + workStudyOffset);
    const total = Math.max(0, grossTuition + grossLiving + grossTravel - offsets);

    const maxAnnual = passport.constraints.maxBudgetPerYear ?? 0;
    const userBudget = maxAnnual ? maxAnnual * Math.ceil(years) : 0;

    return {
      years,
      tuition: grossTuition,
      living: grossLiving,
      travel: grossTravel,
      offsets,
      total,
      userBudget,
      stretchVsBudget: userBudget ? total / userBudget : null,
    };
  }, [programs, passport, skipYear, paidInternship]);

  if (programs.length === 0) {
    return (
      <div className={"rounded-xl border border-black/5 bg-white p-4 " + (className ?? "")}>
        <p className="text-sm text-[#1a1d24]/60">Aucun programme dans la sélection.</p>
      </div>
    );
  }

  const segments = [
    { label: "Frais", value: breakdown.tuition, color: "#ee7768" },
    { label: "Vie", value: breakdown.living, color: "#a3cf91" },
    { label: "Transport", value: breakdown.travel, color: "#e6c068" },
  ].filter((s) => s.value > 0);

  const grossTotal = segments.reduce((s, x) => s + x.value, 0);

  return (
    <div className={"rounded-xl border border-black/5 bg-white p-4 " + (className ?? "")}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-medium">
          <Coins size={14} className="text-[#ee7768]" />
          Budget total estimé
        </h3>
        <span className="text-[11px] text-[#1a1d24]/50">
          {breakdown.years.toFixed(1)} année{breakdown.years > 1 ? "s" : ""}
        </span>
      </div>

      <div className="text-3xl font-medium tracking-tight font-mono">
        {breakdown.total.toLocaleString("fr-FR")} €
      </div>
      {breakdown.offsets > 0 ? (
        <div className="text-[12px] text-[#3a6f2c] mt-1">
          - {breakdown.offsets.toLocaleString("fr-FR")} € de revenus (alternance / stage)
        </div>
      ) : null}
      <div className="text-[12px] text-[#1a1d24]/60 mt-0.5">
        ± 15% selon ville et taux de change
      </div>

      {grossTotal > 0 ? (
        <div className="mt-4">
          <div className="flex h-2 rounded-full overflow-hidden bg-[#fafaf7]">
            {segments.map((s) => (
              <div
                key={s.label}
                style={{
                  background: s.color,
                  width: `${(s.value / grossTotal) * 100}%`,
                }}
                title={`${s.label}: ${s.value.toLocaleString("fr-FR")} €`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
            {segments.map((s) => (
              <div key={s.label}>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[#1a1d24]/60">{s.label}</span>
                </div>
                <div className="font-mono font-medium">
                  {s.value.toLocaleString("fr-FR")} €
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {breakdown.stretchVsBudget !== null ? (
        <div
          className={
            "mt-3 rounded-md px-3 py-2 text-[12px] inline-flex items-center gap-1.5 " +
            (breakdown.stretchVsBudget > 1
              ? "bg-[#d9656520] text-[#7e2929]"
              : "bg-[#a3cf9120] text-[#3a6f2c]")
          }
        >
          {breakdown.stretchVsBudget > 1 ? <AlertTriangle size={12} /> : null}
          {breakdown.stretchVsBudget > 1
            ? `Au-dessus de ton budget × années (${Math.round((breakdown.stretchVsBudget - 1) * 100)}% de plus)`
            : `Tient dans ton budget × années (~${Math.round((1 - breakdown.stretchVsBudget) * 100)}% de marge)`}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <Toggle
          label="Si je rate une année"
          icon={<AlertTriangle size={11} />}
          on={skipYear}
          onChange={setSkipYear}
        />
        <Toggle
          label="Avec stage rémunéré"
          icon={<Briefcase size={11} />}
          on={paidInternship}
          onChange={setPaidInternship}
        />
      </div>

      <details className="mt-3 text-[12px]">
        <summary className="cursor-pointer text-[#1a1d24]/60">
          Détail par programme
        </summary>
        <ul className="mt-1.5 space-y-1">
          {programs.map((p) => {
            const col = colForProgram(p);
            const country = findCountry(p.countryRef);
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 py-1 border-b border-black/5 last:border-0">
                <span className="text-[#1a1d24]/80 truncate">
                  {country?.flag} {p.title} — {p.school.city}
                </span>
                <span className="font-mono text-[11px] text-[#1a1d24]/70 whitespace-nowrap">
                  {p.costPerYear === 0 ? "Gratuit" : `${p.costPerYear.toLocaleString("fr-FR")} €/an`}
                  {col ? ` + ~${Math.round(totalMonthlyEur(col))} €/mois vie` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

function Toggle({
  label,
  icon,
  on,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  on: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition w-full text-left"
      style={{
        background: on ? "#ee776812" : "#fafaf7",
        color: on ? "#a8463a" : "#1a1d2480",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
