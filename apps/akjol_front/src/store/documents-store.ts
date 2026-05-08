"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Métadonnées par document, indexées par NOM (pas id) — c'est ce que les
 * programmes listent dans leur champ `documents: string[]`. Un document
 * "Bulletins BTS S1-S4" est partagé entre N candidatures : tu ne le scannes
 * qu'une fois.
 *
 * On ne persiste QUE les méta éditables (status, date d'expiration, notes).
 * La liste des documents requis est dérivée à la volée depuis les programmes
 * du plan + parcours sauvegardés (cf. lib/documents.ts).
 */

export type DocStatus = "todo" | "requested" | "received" | "sent" | "expired";

export type DocumentMeta = {
  status: DocStatus;
  expiresAt?: string; // YYYY-MM-DD
  notes?: string;
  updatedAt: string;
};

type State = {
  /** Clé = nom du document. */
  metas: Record<string, DocumentMeta>;
  hydrated: boolean;
  setStatus: (name: string, status: DocStatus) => void;
  setExpiresAt: (name: string, iso: string | undefined) => void;
  setNotes: (name: string, notes: string | undefined) => void;
  remove: (name: string) => void;
};

export const useDocumentsStore = create<State>()(
  persist(
    (set, get) => ({
      metas: {},
      hydrated: false,
      setStatus: (name, status) => {
        const cur = get().metas[name] ?? { status: "todo", updatedAt: "" };
        set({
          metas: {
            ...get().metas,
            [name]: { ...cur, status, updatedAt: new Date().toISOString() },
          },
        });
      },
      setExpiresAt: (name, iso) => {
        const cur = get().metas[name] ?? { status: "todo", updatedAt: "" };
        set({
          metas: {
            ...get().metas,
            [name]: { ...cur, expiresAt: iso, updatedAt: new Date().toISOString() },
          },
        });
      },
      setNotes: (name, notes) => {
        const cur = get().metas[name] ?? { status: "todo", updatedAt: "" };
        set({
          metas: {
            ...get().metas,
            [name]: { ...cur, notes, updatedAt: new Date().toISOString() },
          },
        });
      },
      remove: (name) => {
        const next = { ...get().metas };
        delete next[name];
        set({ metas: next });
      },
    }),
    {
      name: "akjol-documents-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Date d'expiration < 6 mois → warning UI. Sert de seuil documenté. */
export const EXPIRY_WARNING_DAYS = 180;

export function expiryDaysLeft(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const d = new Date(expiresAt);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}
