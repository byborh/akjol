"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { FromOverride, TrajectoryStep } from "../types";

export type Parcours = {
  id: string;
  name: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
  fromOverride: FromOverride | null;
  steps: TrajectoryStep[];
  note?: string;
};

type State = {
  parcours: Parcours[];
  activeParcoursId: string | null;
  hydrated: boolean;
  saveCurrentTrajectory: (input: {
    name: string;
    emoji?: string;
    fromOverride: FromOverride | null;
    steps: TrajectoryStep[];
    note?: string;
  }) => string;
  updateParcours: (id: string, patch: Partial<Pick<Parcours, "name" | "emoji" | "note">>) => void;
  deleteParcours: (id: string) => void;
  duplicateParcours: (id: string) => string | null;
  setActiveParcoursId: (id: string | null) => void;
  exportAsToken: (id: string) => string | null;
  importFromToken: (token: string) => string | null;
};

function encode(obj: unknown): string {
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}
function decode<T>(token: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    return JSON.parse(decodeURIComponent(escape(atob(token)))) as T;
  } catch {
    return null;
  }
}

export const useParcoursStore = create<State>()(
  persist(
    (set, get) => ({
      parcours: [],
      activeParcoursId: null,
      hydrated: false,
      saveCurrentTrajectory: ({ name, emoji, fromOverride, steps, note }) => {
        const id = nanoid(8);
        const now = new Date().toISOString();
        const item: Parcours = {
          id,
          name: name.trim() || "Parcours sans nom",
          emoji,
          createdAt: now,
          updatedAt: now,
          fromOverride,
          steps,
          note,
        };
        set({ parcours: [item, ...get().parcours], activeParcoursId: id });
        return id;
      },
      updateParcours: (id, patch) => {
        set({
          parcours: get().parcours.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        });
      },
      deleteParcours: (id) => {
        const { parcours, activeParcoursId } = get();
        set({
          parcours: parcours.filter((p) => p.id !== id),
          activeParcoursId: activeParcoursId === id ? null : activeParcoursId,
        });
      },
      duplicateParcours: (id) => {
        const original = get().parcours.find((p) => p.id === id);
        if (!original) return null;
        const newId = nanoid(8);
        const now = new Date().toISOString();
        set({
          parcours: [
            { ...original, id: newId, name: `${original.name} (copie)`, createdAt: now, updatedAt: now },
            ...get().parcours,
          ],
        });
        return newId;
      },
      setActiveParcoursId: (id) => set({ activeParcoursId: id }),
      exportAsToken: (id) => {
        const item = get().parcours.find((p) => p.id === id);
        if (!item) return null;
        // we strip the id and dates so the token is portable; receiver gets fresh ones on import
        const portable = {
          name: item.name,
          emoji: item.emoji,
          fromOverride: item.fromOverride,
          steps: item.steps,
          note: item.note,
        };
        return encode(portable);
      },
      importFromToken: (token) => {
        const cleaned = token.trim();
        if (!cleaned) return null;
        const data = decode<Pick<Parcours, "name" | "emoji" | "fromOverride" | "steps" | "note">>(cleaned);
        if (!data || !Array.isArray(data.steps)) return null;
        const id = nanoid(8);
        const now = new Date().toISOString();
        const incoming: Parcours = {
          id,
          name: `${data.name ?? "Parcours importé"} (importé)`,
          emoji: data.emoji,
          fromOverride: data.fromOverride ?? null,
          steps: data.steps,
          note: data.note,
          createdAt: now,
          updatedAt: now,
        };
        set({ parcours: [incoming, ...get().parcours], activeParcoursId: id });
        return id;
      },
    }),
    {
      name: "akjol-parcours-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
