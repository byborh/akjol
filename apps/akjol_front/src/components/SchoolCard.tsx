"use client";

import Link from "next/link";
import { MapPin, Star, Building2 } from "lucide-react";
import type { SchoolEntry } from "../data/schools";
import { findCountry } from "../data/countries";

const TYPE_LABEL: Record<string, string> = {
  université: "Université",
  "grande école": "Grande école",
  lycée: "Lycée (prépa)",
  IUT: "IUT",
  "école privée": "École privée",
  autre: "Autre",
};

export function SchoolCard({
  school,
  matchCount,
}: {
  school: SchoolEntry;
  matchCount?: number;
}) {
  const country = findCountry(school.countryRef);
  return (
    <Link
      href={`/school/${school.id}`}
      className="block rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-black/5 text-[#1a1d24]/70 inline-flex items-center gap-1">
              <Building2 size={11} /> {school.type ? TYPE_LABEL[school.type] ?? school.type : "École"}
            </span>
            {matchCount && matchCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-[#a3cf9120] text-[#3a6f2c] font-medium">
                {matchCount} match avec ton profil
              </span>
            ) : null}
          </div>
          <h3 className="font-medium text-[#1a1d24] leading-snug truncate">{school.name}</h3>
          <div className="text-sm text-[#1a1d24]/60 mt-0.5 inline-flex items-center gap-1">
            <MapPin size={12} /> {country?.flag} {school.city}
          </div>
        </div>
        {typeof school.rating === "number" ? (
          <div
            className="shrink-0 inline-flex items-center gap-1 text-[#8a5314] bg-[#f5b86a25] rounded-md px-2 py-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Star size={12} fill="currentColor" />
            {school.rating.toFixed(1)}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-[12px] text-[#1a1d24]/55 mt-3">
        <span>
          <strong className="text-[#1a1d24]">{school.programs.length}</strong> formation
          {school.programs.length > 1 ? "s" : ""}
        </span>
        <span className="text-[#ee7768] group-hover:underline">Visiter →</span>
      </div>
    </Link>
  );
}
