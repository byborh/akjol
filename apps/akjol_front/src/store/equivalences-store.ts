"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { SEED_EQUIVALENCES, type EquivalenceEdge, type EquivalenceKind } from "../data/equivalences";

type Revision = { at: string; edges: EquivalenceEdge[] };

type State = {
  edges: EquivalenceEdge[];
  history: Revision[];
  hydrated: boolean;
  setHydrated: (b: boolean) => void;
  add: (e: Omit<EquivalenceEdge, "id">) => void;
  update: (id: string, patch: Partial<EquivalenceEdge>) => void;
  remove: (id: string) => void;
  reset: () => void;
  revertTo: (index: number) => void;
};

function snapshot(edges: EquivalenceEdge[]): Revision {
  return { at: new Date().toISOString(), edges: edges.map((e) => ({ ...e })) };
}

export const useEquivalencesStore = create<State>()(
  persist(
    (set, get) => ({
      edges: SEED_EQUIVALENCES,
      history: [],
      hydrated: false,
      setHydrated: (b) => set({ hydrated: b }),
      add: (e) =>
        set((s) => {
          const next = [...s.edges, { ...e, id: nanoid(8) }];
          return { edges: next, history: [...s.history, snapshot(s.edges)].slice(-20) };
        }),
      update: (id, patch) =>
        set((s) => {
          const next = s.edges.map((x) => (x.id === id ? { ...x, ...patch } : x));
          return { edges: next, history: [...s.history, snapshot(s.edges)].slice(-20) };
        }),
      remove: (id) =>
        set((s) => {
          const next = s.edges.filter((x) => x.id !== id);
          return { edges: next, history: [...s.history, snapshot(s.edges)].slice(-20) };
        }),
      reset: () =>
        set((s) => ({
          edges: SEED_EQUIVALENCES,
          history: [...s.history, snapshot(s.edges)].slice(-20),
        })),
      revertTo: (index) =>
        set((s) => {
          const rev = s.history[index];
          if (!rev) return s;
          return { edges: rev.edges, history: [...s.history, snapshot(s.edges)].slice(-20) };
        }),
    }),
    {
      name: "akjol-equivalences",
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export type { EquivalenceEdge, EquivalenceKind };
