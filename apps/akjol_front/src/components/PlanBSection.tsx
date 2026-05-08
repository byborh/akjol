"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Program, Passport } from "../types";
import { planBFor } from "../engine/planB";
import { findCountry } from "../data/countries";
import { useEquivalencesStore } from "../store/equivalences-store";

export function PlanBSection({ program, passport }: { program: Program; passport: Passport }) {
  const equivEdges = useEquivalencesStore((s) => s.edges);
  const branches = planBFor(program, passport, equivEdges);
  if (branches.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#e6c068]/30 bg-[#fcf6e8] p-4">
      <h3 className="inline-flex items-center gap-2 text-sm font-medium text-[#8a5314]">
        <AlertTriangle size={14} />
        Et si ça ne marche pas ?
      </h3>
      <p className="text-[12px] text-[#8a5314]/80 mt-1">
        Toute candidature peut échouer. Voici tes plans B factuels — pas anxiogènes, pratiques.
      </p>

      <div className="mt-4 space-y-4">
        {branches.map((b, i) => (
          <div key={i}>
            <div className="text-[12px] font-medium text-[#1a1d24]/80">{b.trigger}</div>
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {b.alternatives.map((a) => {
                const country = findCountry(a.countryRef);
                return (
                  <Link
                    key={a.programId}
                    href={`/program/${a.programId}`}
                    className="rounded-lg border border-black/5 bg-white p-2.5 hover:border-[#ee7768]/40 transition group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-[#1a1d24] group-hover:text-[#ee7768] truncate">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-[#1a1d24]/60 mt-0.5 truncate">
                          {country?.flag} {a.schoolName} · {a.city}
                        </div>
                        <div className="text-[10px] text-[#1a1d24]/50 mt-1">{a.rationale}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-medium text-[#3a6f2c]">
                          {a.probability}%
                        </div>
                        <ArrowRight
                          size={11}
                          className="text-[#1a1d24]/30 group-hover:text-[#ee7768] mt-1 ml-auto"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
