"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useTrajectoryStore } from "../store/trajectory-store";
import { DIPLOMAS } from "../data/diplomas";
import { findCountry } from "../data/countries";

const AIM_TAGS = [
  "Ingénieur logiciel",
  "Médecin",
  "Data scientist",
  "Architecte",
  "Pentester",
  "ML Engineer",
  "Chercheur en IA",
  "Entrepreneur",
];

type Props = {
  currentFromLabel: string;
  currentFromCode: string;
  aimFilter: string;
  onAimChange: (aim: string) => void;
};

export function FromToSearch({ currentFromLabel, currentFromCode, aimFilter, onAimChange }: Props) {
  const setFromDiplomaCode = useTrajectoryStore((s) => s.setFromDiplomaCode);
  const [openFrom, setOpenFrom] = useState(false);
  const [aim, setAim] = useState<string>(aimFilter);

  function applyAim() {
    onAimChange(aim.trim());
  }
  function clearAim() {
    setAim("");
    onAimChange("");
  }

  return (
    <div className="rounded-2xl bg-white border border-black/5 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#1a1d24]/40 font-semibold mb-3">
        <Sparkles size={11} /> Test rapide — change ton point de départ ou choisis une cible
      </div>
      <div className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-stretch">
        <div className="relative">
          <label className="block text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-1">
            Je pars de
          </label>
          <button
            onClick={() => setOpenFrom((v) => !v)}
            className="w-full flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-left hover:border-[#ee7768] transition"
          >
            <span className="font-medium truncate">{currentFromLabel}</span>
            <span className="ml-auto text-[#1a1d24]/40 text-xs">▾</span>
          </button>
          {openFrom ? (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-72 overflow-y-auto rounded-lg border border-black/10 bg-white shadow-xl">
              {DIPLOMAS.map((d) => {
                const c = findCountry(d.countryRef);
                const active = currentFromCode === d.code;
                return (
                  <button
                    key={d.code}
                    onClick={() => {
                      setFromDiplomaCode(d.code);
                      setOpenFrom(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-black/5 flex items-center gap-2 text-sm"
                    style={{ background: active ? "#ee776815" : undefined }}
                  >
                    <span>{c?.flag ?? "🌍"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#1a1d24] truncate">{d.nativeName}</div>
                      <div className="text-[11px] text-[#1a1d24]/55 truncate">{d.translated}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="hidden sm:flex items-end justify-center pb-3">
          <ArrowRight size={16} className="text-[#1a1d24]/30" />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-1">
            Je veux atteindre <span className="normal-case opacity-60">(métier visé)</span>
          </label>
          <div className="relative">
            <input
              value={aim}
              onChange={(e) => setAim(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyAim()}
              placeholder="ex: Médecin, Ingénieur logiciel, Pentester…"
              className="w-full rounded-lg border border-black/10 bg-white px-3 pr-8 py-2.5 text-sm focus:outline-none focus:border-[#ee7768]"
            />
            {aim || aimFilter ? (
              <button
                onClick={clearAim}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1a1d24]/40 hover:text-[#1a1d24]"
                aria-label="effacer le filtre métier"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={applyAim}
            disabled={!aim.trim() && !aimFilter}
            className="w-full sm:w-auto rounded-lg px-4 py-2.5 font-medium text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{ background: "#ee7768" }}
            title="Filtre la liste sur les programmes menant à ce métier"
          >
            Calculer
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {AIM_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setAim(tag);
              onAimChange(tag);
            }}
            className="px-2.5 py-1 rounded-full text-[11px] bg-black/5 text-[#1a1d24]/70 hover:bg-[#ee776815] hover:text-[#a8463a] transition"
            style={{
              background: aimFilter === tag ? "#ee7768" : undefined,
              color: aimFilter === tag ? "#fff" : undefined,
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {aimFilter ? (
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ee776815] text-[#a8463a] text-[12px]">
          <Sparkles size={11} />
          <span>
            Filtre actif : programmes menant à <strong>« {aimFilter} »</strong>
          </span>
          <button onClick={clearAim} className="hover:text-[#7e2929]" aria-label="retirer le filtre">
            <X size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
