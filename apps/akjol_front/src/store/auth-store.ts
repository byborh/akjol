"use client";

import { create } from "zustand";

export type AuthUser = { email: string; name: string; since?: number };

type State = {
  user: AuthUser | null;
  loading: boolean;
  fetched: boolean;
  refresh: () => Promise<void>;
  login: (email: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<State>()((set) => ({
  user: null,
  loading: false,
  fetched: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const r = await fetch("/api/me", { credentials: "same-origin" });
      const j = (await r.json()) as { user: AuthUser | null };
      set({ user: j.user, loading: false, fetched: true });
    } catch {
      set({ user: null, loading: false, fetched: true });
    }
  },
  login: async (email, name) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: j.error ?? "Connexion impossible" };
    }
    const j = (await r.json()) as { user: AuthUser };
    set({ user: j.user, fetched: true });
    return { ok: true };
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
