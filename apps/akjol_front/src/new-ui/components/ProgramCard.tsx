"use client";

import Link from "next/link";
import { Clock, Coins, Languages, MapPin } from "lucide-react";
import type { Program } from "../types";
import type { FeasibilityResult } from "../types";
import { GaugeCircular } from "./GaugeCircular";
import { StatusBadge } from "./StatusBadge";
import { findCountry } from "../data/countries";

type Props = { program: Program; feasibility: FeasibilityResult };

export function ProgramCard({ program, feasibility }: Props) {
  const country = findCountry(program.countryRef);
  return (
    <Link
      href={`/new-ui/program/${program.id}`}
      className="block rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition p-4"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={feasibility.status} />
            {feasibility.missingStep ? (
              <span className="text-[11px] text-[#8a5314]">+ {feasibility.missingStep}</span>
            ) : null}
          </div>
          <h3 className="font-medium text-[#1a1d24] leading-snug">{program.title}</h3>
          <p className="text-sm text-[#1a1d24]/60 mt-0.5">{program.school.name}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px] text-[#1a1d24]/70">
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} /> {country?.flag} {program.school.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {program.durationYears} an{program.durationYears > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Languages size={13} /> {program.language.code.toUpperCase()} {program.language.minLevel}
            </span>
            <span className="inline-flex items-center gap-1" style={{ fontFamily: "var(--font-mono)" }}>
              <Coins size={13} /> {program.costPerYear === 0 ? "Gratuit" : `${program.costPerYear.toLocaleString("fr-FR")} €/an`}
            </span>
          </div>
        </div>
        <GaugeCircular
          value={feasibility.probability.value}
          ci={feasibility.probability.ci}
          basedOn={feasibility.probability.basedOn}
          size={72}
          showCaption={false}
        />
      </div>
    </Link>
  );
}
