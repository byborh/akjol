"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Coins, Languages, MapPin } from "lucide-react";
import type { Program, FeasibilityResult } from "../types";
import { GaugeCircular } from "./GaugeCircular";
import { StatusBadge } from "./StatusBadge";
import { findCountry } from "../data/countries";
import { useTrajectoryStore } from "../store/trajectory-store";

type Props = { program: Program; feasibility: FeasibilityResult };

export function ProgramCard({ program, feasibility }: Props) {
  const router = useRouter();
  const country = findCountry(program.countryRef);
  const pushStep = useTrajectoryStore((s) => s.pushStepFromProgramId);

  function continueFromHere(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    pushStep(program.id);
    requestAnimationFrame(() => {
      const top = document.querySelector("main");
      top?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <Link
            href={`/program/${program.id}`}
            className="flex-1 min-w-0 group"
          >
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={feasibility.status} />
              {feasibility.missingStep ? (
                <span className="text-[11px] text-[#8a5314]">+ {feasibility.missingStep}</span>
              ) : null}
            </div>
            <h3 className="font-medium text-[#1a1d24] leading-snug group-hover:text-[#ee7768] transition">
              {program.title}
            </h3>
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
          </Link>
          <Link href={`/program/${program.id}`} className="shrink-0">
            <GaugeCircular
              value={feasibility.probability.value}
              ci={feasibility.probability.ci}
              basedOn={feasibility.probability.basedOn}
              size={72}
              showCaption={false}
            />
          </Link>
        </div>
      </div>
      <div className="border-t border-black/5 px-4 py-2 flex items-center justify-between gap-2">
        <Link
          href={`/program/${program.id}`}
          className="text-[12px] text-[#1a1d24]/50 hover:text-[#1a1d24] transition"
        >
          Voir la fiche →
        </Link>
        {feasibility.status !== "closed" ? (
          <button
            onClick={continueFromHere}
            className="inline-flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full bg-[#ee776812] text-[#a8463a] hover:bg-[#ee776822] transition"
            title="Empile ce diplôme dans le voyage virtuel et recharge la liste comme si tu l'avais obtenu"
          >
            Continuer depuis ici <ArrowRight size={11} />
          </button>
        ) : (
          <span className="text-[11px] text-[#1a1d24]/30 italic">Pas accessible depuis ce point</span>
        )}
      </div>
    </div>
  );
}
