"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { FromOverride, Passport, TrajectoryStep } from "../types";

export type Life = {
  id: string;
  name: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
  passport: Passport;
  trajectory: { fromOverride: FromOverride | null; steps: TrajectoryStep[] };
  savedPrograms: string[];
};

type State = {
  lives: Life[];
  activeLifeId: string | null;
  hydrated: boolean;
  saveCurrentAsLife: (input: {
    name: string;
    emoji?: string;
    passport: Passport;
    trajectory: { fromOverride: FromOverride | null; steps: TrajectoryStep[] };
    savedPrograms: string[];
  }) => string;
  updateLife: (
    id: string,
    patch: Partial<Pick<Life, "name" | "emoji">> & {
      passport?: Passport;
      trajectory?: { fromOverride: FromOverride | null; steps: TrajectoryStep[] };
      savedPrograms?: string[];
    },
  ) => void;
  deleteLife: (id: string) => void;
  duplicateLife: (id: string) => string | null;
  setActiveLifeId: (id: string | null) => void;
  exportLifeAsToken: (id: string) => string | null;
  importLifeFromToken: (token: string) => string | null;
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

export const useLivesStore = create<State>()(
  persist(
    (set, get) => ({
      lives: [],
      activeLifeId: null,
      hydrated: false,
      saveCurrentAsLife: ({ name, emoji, passport, trajectory, savedPrograms }) => {
        const id = nanoid(8);
        const now = new Date().toISOString();
        const life: Life = {
          id,
          name: name.trim() || "Vie sans nom",
          emoji,
          createdAt: now,
          updatedAt: now,
          passport,
          trajectory,
          savedPrograms,
        };
        set({ lives: [life, ...get().lives], activeLifeId: id });
        return id;
      },
      updateLife: (id, patch) => {
        set({
          lives: get().lives.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l,
          ),
        });
      },
      deleteLife: (id) => {
        const { lives, activeLifeId } = get();
        set({
          lives: lives.filter((l) => l.id !== id),
          activeLifeId: activeLifeId === id ? null : activeLifeId,
        });
      },
      duplicateLife: (id) => {
        const original = get().lives.find((l) => l.id === id);
        if (!original) return null;
        const newId = nanoid(8);
        const now = new Date().toISOString();
        set({
          lives: [
            { ...original, id: newId, name: `${original.name} (copie)`, createdAt: now, updatedAt: now },
            ...get().lives,
          ],
        });
        return newId;
      },
      setActiveLifeId: (id) => set({ activeLifeId: id }),
      exportLifeAsToken: (id) => {
        const life = get().lives.find((l) => l.id === id);
        if (!life) return null;
        return encode(life);
      },
      importLifeFromToken: (token) => {
        const cleaned = token.trim();
        if (!cleaned) return null;
        const life = decode<Life>(cleaned);
        if (!life || !life.passport) return null;
        const id = nanoid(8);
        const now = new Date().toISOString();
        const incoming: Life = {
          ...life,
          id,
          name: `${life.name} (importée)`,
          createdAt: now,
          updatedAt: now,
        };
        set({ lives: [incoming, ...get().lives], activeLifeId: id });
        return id;
      },
    }),
    {
      name: "akjol-lives-v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
