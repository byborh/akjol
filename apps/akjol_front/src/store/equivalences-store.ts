"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { EquivalenceEdge, EquivalenceKind } from "../data/equivalences";

/**
 * Source de vérité : la table equivalence_edges en DB. Le store ne persiste
 * plus rien en localStorage (Phase 3 du MVP-niveau-2). Au mount du root client
 * on appelle load() pour fetch /api/equivalences ; les mutations sont
 * optimistes (UI mise à jour avant la réponse) avec rollback automatique sur
 * échec.
 *
 * Les composants consommateurs (Globe, Explore, /program/[id], etc.)
 * continuent d'utiliser `(s) => s.edges` — l'interface n'a pas bougé, ils
 * voient juste un tableau vide tant que le fetch initial n'a pas terminé.
 */

export type Revision = {
  id: number;
  edgeId: string;
  action: "create" | "update" | "delete";
  snapshot: EquivalenceEdge | null;
  at: string;
  by: string | null;
};

type ApiError = { error: string; status: number };

type State = {
  edges: EquivalenceEdge[];
  history: Revision[];
  hydrated: boolean;
  loading: boolean;
  loadError: string | null;
  lastError: string | null;

  load: () => Promise<void>;
  loadRevisions: () => Promise<void>;
  add: (e: Omit<EquivalenceEdge, "id">) => Promise<{ ok: boolean; error?: string }>;
  update: (id: string, patch: Partial<EquivalenceEdge>) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>;
  revert: (revisionId: number) => Promise<{ ok: boolean; error?: string }>;
  reset: () => Promise<void>;
};

async function readError(r: Response): Promise<ApiError> {
  let msg = `HTTP ${r.status}`;
  try {
    const j = (await r.json()) as { error?: string };
    if (j.error) msg = j.error;
  } catch {
    // ignore parse error
  }
  return { error: msg, status: r.status };
}

export const useEquivalencesStore = create<State>()((set, get) => ({
  edges: [],
  history: [],
  hydrated: false,
  loading: false,
  loadError: null,
  lastError: null,

  load: async () => {
    set({ loading: true, loadError: null });
    try {
      const r = await fetch("/api/equivalences", { credentials: "same-origin" });
      if (!r.ok) {
        const err = await readError(r);
        set({ loading: false, loadError: err.error, hydrated: true });
        return;
      }
      const j = (await r.json()) as { items: EquivalenceEdge[] };
      set({ edges: j.items, loading: false, hydrated: true, loadError: null });
    } catch (err) {
      set({
        loading: false,
        hydrated: true,
        loadError: err instanceof Error ? err.message : "Network error",
      });
    }
  },

  loadRevisions: async () => {
    try {
      const r = await fetch("/api/equivalences/revisions?limit=50", {
        credentials: "same-origin",
      });
      if (!r.ok) return;
      const j = (await r.json()) as { items: Revision[] };
      set({ history: j.items });
    } catch {
      // silencieux : pas critique
    }
  },

  add: async (e) => {
    const tempId = `tmp_${nanoid(6)}`;
    const optimistic: EquivalenceEdge = { ...e, id: tempId };
    const before = get().edges;
    set({ edges: [...before, optimistic], lastError: null });
    try {
      const r = await fetch("/api/equivalences", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(e),
      });
      if (!r.ok) {
        const err = await readError(r);
        set({ edges: before, lastError: err.error });
        return { ok: false, error: err.error };
      }
      const j = (await r.json()) as { edge: EquivalenceEdge };
      set((s) => ({ edges: s.edges.map((x) => (x.id === tempId ? j.edge : x)) }));
      void get().loadRevisions();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      set({ edges: before, lastError: msg });
      return { ok: false, error: msg };
    }
  },

  update: async (id, patch) => {
    const before = get().edges;
    set({
      edges: before.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      lastError: null,
    });
    try {
      const r = await fetch(`/api/equivalences/${encodeURIComponent(id)}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const err = await readError(r);
        set({ edges: before, lastError: err.error });
        return { ok: false, error: err.error };
      }
      const j = (await r.json()) as { edge: EquivalenceEdge };
      set((s) => ({ edges: s.edges.map((x) => (x.id === id ? j.edge : x)) }));
      void get().loadRevisions();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      set({ edges: before, lastError: msg });
      return { ok: false, error: msg };
    }
  },

  remove: async (id) => {
    const before = get().edges;
    set({ edges: before.filter((x) => x.id !== id), lastError: null });
    try {
      const r = await fetch(`/api/equivalences/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!r.ok) {
        const err = await readError(r);
        set({ edges: before, lastError: err.error });
        return { ok: false, error: err.error };
      }
      void get().loadRevisions();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      set({ edges: before, lastError: msg });
      return { ok: false, error: msg };
    }
  },

  revert: async (revisionId) => {
    try {
      const r = await fetch(`/api/equivalences/revert/${revisionId}`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!r.ok) {
        const err = await readError(r);
        set({ lastError: err.error });
        return { ok: false, error: err.error };
      }
      await get().load();
      void get().loadRevisions();
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      set({ lastError: msg });
      return { ok: false, error: msg };
    }
  },

  reset: async () => {
    // En DB-mode, "reset" ne signifie plus "remettre SEED" — il signifie
    // "re-charger depuis la DB" (purge un éventuel état optimistic corrompu).
    await get().load();
  },
}));

export type { EquivalenceEdge, EquivalenceKind };
