"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, RotateCcw, X, Lock, Sparkles } from "lucide-react";
import { useTrajectoryStore } from "../store/trajectory-store";
import { usePassportStore } from "../store/passport-store";
import { findCountry } from "../data/countries";
import { findProgram } from "../data/programs";
import { DIPLOMAS, getDiplomasForCountry } from "../data/diplomas";
import { useMounted } from "../hooks/useMounted";

export function TrajectoryBar() {
  const mounted = useMounted();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const clearAfter = useTrajectoryStore((s) => s.clearAfter);
  const popStep = useTrajectoryStore((s) => s.popStep);
  const reset = useTrajectoryStore((s) => s.resetTrajectory);
  const setFromDiplomaCode = useTrajectoryStore((s) => s.setFromDiplomaCode);
  const setFromOverride = useTrajectoryStore((s) => s.setFromOverride);

  const [openSwap, setOpenSwap] = useState(false);
  const swapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!swapRef.current) return;
      if (!swapRef.current.contains(e.target as Node)) setOpenSwap(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!mounted || !isComplete) return null;

  const country = findCountry(fromOverride?.countryRef ?? passport.origin.country);
  const startLabel = fromOverride
    ? fromOverride.label
    : passport.currentDiploma?.label ?? "Profil incomplet";
  const isVirtual = Boolean(fromOverride);

  const swapDiplomas = fromOverride
    ? DIPLOMAS
    : getDiplomasForCountry(passport.origin.country).length
      ? getDiplomasForCountry(passport.origin.country)
      : DIPLOMAS;

  const hasTrajectory = steps.length > 0 || isVirtual;

  return (
    <div
      className="sticky z-20 bg-[#FAFAF7]/90 backdrop-blur-md border-b border-black/5 scroll-mt-14"
      style={{ top: 57 }}
    >
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-2 overflow-x-auto">
        <div className="relative shrink-0" ref={swapRef}>
          <button
            onClick={() => setOpenSwap((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition border"
            style={{
              borderColor: isVirtual ? "#ee7768" : "#0000000d",
              background: isVirtual ? "#ee776810" : "#fff",
            }}
            title="Cliquer pour changer le point de départ virtuel"
          >
            <span className="text-base">{country?.flag ?? "🌍"}</span>
            <span className="font-medium text-[#1a1d24] truncate max-w-[16rem]">{startLabel}</span>
            {isVirtual ? (
              <span
                className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                style={{ background: "#ee776825", color: "#a8463a" }}
              >
                virtuel
              </span>
            ) : (
              <span
                className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded text-[#1a1d24]/50 inline-flex items-center gap-1"
                style={{ background: "#1a1d2410" }}
              >
                <Lock size={9} /> réel
              </span>
            )}
          </button>

          {openSwap ? (
            <div className="absolute top-full left-0 mt-1 z-30 w-72 rounded-xl bg-white border border-black/10 shadow-xl p-2 max-h-80 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold px-2 py-1.5 flex items-center gap-1">
                <Sparkles size={10} /> Quick swap — sans toucher ton passeport
              </div>
              {isVirtual ? (
                <button
                  onClick={() => {
                    setFromOverride(null);
                    setOpenSwap(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-sm text-[#a8463a] hover:bg-[#ee776810] flex items-center gap-2"
                >
                  <RotateCcw size={12} /> Revenir à mon vrai diplôme
                </button>
              ) : null}
              {swapDiplomas.map((d) => {
                const c = findCountry(d.countryRef);
                const active = (fromOverride?.code ?? passport.currentDiploma?.code) === d.code;
                return (
                  <button
                    key={d.code}
                    onClick={() => {
                      setFromDiplomaCode(d.code);
                      setOpenSwap(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-black/5 flex items-center gap-2"
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

        {steps.map((step, i) => {
          const program = findProgram(step.programId);
          return (
            <div key={step.programId} className="flex items-center gap-2 shrink-0">
              <ChevronRight size={14} className="text-[#1a1d24]/30 shrink-0" />
              <button
                onClick={() => clearAfter(i)}
                className="group relative flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm bg-[#ee776812] hover:bg-[#ee776822] transition border border-[#ee7768]/20"
                title={`Remonter à : ${step.resultingDiplomaLabel}`}
              >
                <span className="font-medium text-[#a8463a] truncate max-w-[14rem]">
                  {step.resultingDiplomaLabel}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (i === steps.length - 1) popStep();
                    else useTrajectoryStore.getState().clearAfter(i - 1);
                  }}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[#a8463a]/50 hover:text-[#a8463a] hover:bg-white/60"
                  role="button"
                  aria-label="retirer cette étape"
                >
                  <X size={11} />
                </span>
              </button>
              {program ? (
                <span
                  className="text-[10px] text-[#1a1d24]/40 truncate max-w-[10rem]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  via {program.school.name}
                </span>
              ) : null}
            </div>
          );
        })}

        {hasTrajectory ? (
          <button
            onClick={reset}
            className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs text-[#1a1d24]/50 hover:text-[#1a1d24] transition"
            title="Effacer toute la trajectoire virtuelle"
          >
            <RotateCcw size={12} /> Reset
          </button>
        ) : (
          <span className="ml-auto shrink-0 text-xs text-[#1a1d24]/40 italic">
            Clique « Continuer depuis ici → » sur n'importe quelle carte pour empiler des étapes
          </span>
        )}
      </div>
    </div>
  );
}
