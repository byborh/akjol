"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { findCountry } from "../data/countries";
import { usePassportStore } from "../store/passport-store";
import { useMounted } from "../hooks/useMounted";

export function PassportFloat() {
  const mounted = useMounted();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  if (!mounted || !isComplete) return null;
  const country = findCountry(passport.origin.country);
  return (
    <Link
      href="/passport"
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-3 rounded-xl bg-white border border-black/5 shadow-lg px-4 py-3 hover:border-[#ee7768]/50 transition"
    >
      <span className="text-2xl">{country?.flag ?? "🌍"}</span>
      <div className="flex flex-col text-left">
        <span className="text-[11px] uppercase tracking-wider text-[#1a1d24]/40">Mon passeport</span>
        <span className="text-sm font-medium text-[#1a1d24] truncate max-w-[14rem]">
          {passport.currentDiploma?.label ?? "Profil incomplet"}
        </span>
      </div>
      <Pencil size={14} className="text-[#1a1d24]/40 group-hover:text-[#ee7768]" />
    </Link>
  );
}
