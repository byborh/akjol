"use client";

import { create } from "zustand";
import type { FromOverride, Passport, TrajectoryStep } from "../types";
import { findProgram } from "../data/programs";
import { findDiploma } from "../data/diplomas";

type State = {
  fromOverride: FromOverride | null;
  steps: TrajectoryStep[];
  pushStepFromProgramId: (programId: string) => void;
  popStep: () => void;
  clearAfter: (index: number) => void;
  resetTrajectory: () => void;
  setFromOverride: (o: FromOverride | null) => void;
  setFromDiplomaCode: (code: string) => void;
  loadFromUrl: (params: { from?: string | null; via?: string | null }) => void;
  toUrlParams: () => { from?: string; via?: string };
};

const MAX_STEPS = 8;

export const useTrajectoryStore = create<State>()((set, get) => ({
  fromOverride: null,
  steps: [],
  pushStepFromProgramId: (programId) => {
    const program = findProgram(programId);
    if (!program) return;
    const list = get().steps;
    if (list.find((s) => s.programId === programId)) return;
    if (list.length >= MAX_STEPS) return;
    set({
      steps: [
        ...list,
        {
          programId,
          resultingDiplomaCode: program.resultingDiplomaCode,
          resultingDiplomaLabel: program.resultingDiplomaLabel,
          resultingLevel: program.level,
          countryRef: program.countryRef,
          yearsAdded: program.durationYears,
        },
      ],
    });
  },
  popStep: () => {
    const list = get().steps;
    set({ steps: list.slice(0, Math.max(0, list.length - 1)) });
  },
  clearAfter: (index) => {
    set({ steps: get().steps.slice(0, index + 1) });
  },
  resetTrajectory: () => set({ steps: [], fromOverride: null }),
  setFromOverride: (o) => set({ fromOverride: o, steps: [] }),
  setFromDiplomaCode: (code) => {
    const dip = findDiploma(code);
    if (!dip) return;
    set({
      fromOverride: { code: dip.code, label: dip.nativeName, countryRef: dip.countryRef },
      steps: [],
    });
  },
  loadFromUrl: ({ from, via }) => {
    let fromOverride: FromOverride | null = null;
    if (from) {
      const dip = findDiploma(from);
      if (dip) {
        fromOverride = { code: dip.code, label: dip.nativeName, countryRef: dip.countryRef };
      }
    }
    const steps: TrajectoryStep[] = [];
    if (via) {
      for (const id of via.split(",").filter(Boolean)) {
        const program = findProgram(id);
        if (!program) continue;
        if (steps.length >= MAX_STEPS) break;
        steps.push({
          programId: program.id,
          resultingDiplomaCode: program.resultingDiplomaCode,
          resultingDiplomaLabel: program.resultingDiplomaLabel,
          resultingLevel: program.level,
          countryRef: program.countryRef,
          yearsAdded: program.durationYears,
        });
      }
    }
    set({ fromOverride, steps });
  },
  toUrlParams: () => {
    const { fromOverride, steps } = get();
    const out: { from?: string; via?: string } = {};
    if (fromOverride) out.from = fromOverride.code;
    if (steps.length) out.via = steps.map((s) => s.programId).join(",");
    return out;
  },
}));

export function applyTrajectory(real: Passport, opts: { fromOverride: FromOverride | null; steps: TrajectoryStep[] }): Passport {
  const { fromOverride, steps } = opts;
  let effectiveDiploma = real.currentDiploma;
  let effectiveCountry = real.origin.country;

  if (fromOverride) {
    const dip = findDiploma(fromOverride.code);
    effectiveDiploma = {
      countryRef: fromOverride.countryRef,
      code: fromOverride.code,
      label: fromOverride.label,
      status: "obtained",
      yearObtained: new Date().getFullYear(),
      grade: dip ? { value: Math.round(dip.scaleMax * 0.7 * 10) / 10, scaleMax: dip.scaleMax } : undefined,
    };
    effectiveCountry = fromOverride.countryRef;
  }

  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    effectiveDiploma = {
      countryRef: last.countryRef,
      code: last.resultingDiplomaCode,
      label: last.resultingDiplomaLabel,
      status: "obtained",
      yearObtained: new Date().getFullYear() + steps.reduce((sum, s) => sum + s.yearsAdded, 0),
      grade: undefined,
    };
  }

  return {
    ...real,
    origin: { ...real.origin, country: effectiveCountry },
    currentDiploma: effectiveDiploma,
  };
}
