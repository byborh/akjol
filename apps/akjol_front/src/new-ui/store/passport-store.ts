"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Passport, Program } from "../types";

const EMPTY_PASSPORT: Passport = {
  origin: { country: "", languages: [] },
  currentDiploma: null,
  certificates: [],
  constraints: {},
  aspiration: { domains: [], jobs: [], openToSurprise: true },
};

type SavedItem = { programId: string; addedAt: string };

type State = {
  passport: Passport;
  hydrated: boolean;
  savedPlan: SavedItem[];
  comparator: string[];
  comparatorSchools: string[];
  setPassport: (p: Passport) => void;
  patchPassport: (patch: (p: Passport) => Passport) => void;
  reset: () => void;
  toggleSaved: (programId: string) => void;
  setSavedPrograms: (ids: string[]) => void;
  toggleCompare: (programId: string) => void;
  toggleCompareSchool: (schoolId: string) => void;
  clearComparator: () => void;
  isComplete: () => boolean;
};

export const usePassportStore = create<State>()(
  persist(
    (set, get) => ({
      passport: EMPTY_PASSPORT,
      hydrated: false,
      savedPlan: [],
      comparator: [],
      comparatorSchools: [],
      setPassport: (p) => set({ passport: p }),
      patchPassport: (patch) => set({ passport: patch(get().passport) }),
      reset: () =>
        set({
          passport: EMPTY_PASSPORT,
          savedPlan: [],
          comparator: [],
          comparatorSchools: [],
        }),
      toggleSaved: (programId) => {
        const list = get().savedPlan;
        const exists = list.find((s) => s.programId === programId);
        set({
          savedPlan: exists
            ? list.filter((s) => s.programId !== programId)
            : [...list, { programId, addedAt: new Date().toISOString() }],
        });
      },
      setSavedPrograms: (ids) => {
        const now = new Date().toISOString();
        set({ savedPlan: ids.map((id) => ({ programId: id, addedAt: now })) });
      },
      toggleCompare: (programId) => {
        const list = get().comparator;
        if (list.includes(programId)) {
          set({ comparator: list.filter((id) => id !== programId) });
        } else if (list.length < 4) {
          set({ comparator: [...list, programId] });
        }
      },
      toggleCompareSchool: (schoolId) => {
        const list = get().comparatorSchools;
        if (list.includes(schoolId)) {
          set({ comparatorSchools: list.filter((id) => id !== schoolId) });
        } else if (list.length < 4) {
          set({ comparatorSchools: [...list, schoolId] });
        }
      },
      clearComparator: () => set({ comparator: [], comparatorSchools: [] }),
      isComplete: () => {
        const p = get().passport;
        return Boolean(
          p.origin.country &&
            p.currentDiploma &&
            p.origin.languages.length > 0,
        );
      },
    }),
    {
      name: "akjol-passport-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export function passportSummary(p: Passport): string {
  const parts: string[] = [];
  if (p.origin.country) parts.push(p.origin.country);
  if (p.currentDiploma) parts.push(p.currentDiploma.label);
  if (p.origin.languages.length) {
    parts.push(p.origin.languages.map((l) => `${l.code}${l.level}`).join("·"));
  }
  return parts.join(" — ");
}

export type ProgramWithFeasibility = {
  program: Program;
  // computed at consume site
};
