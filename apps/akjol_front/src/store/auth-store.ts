"use client";

import { create } from "zustand";

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role?: "student" | "curator" | "admin";
  since?: number;
};

type LoginResult = { ok: true; requiresOnboarding?: boolean } | { ok: false; error: string };

type State = {
  user: AuthUser | null;
  loading: boolean;
  fetched: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, name?: string) => Promise<LoginResult>;
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
  login: async (email, password) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: j.error ?? "Connexion impossible" };
    }
    const j = (await r.json()) as { user: AuthUser };
    set({ user: j.user, fetched: true });
    return { ok: true };
  },
  signup: async (email, password, name) => {
    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: j.error ?? "Inscription impossible" };
    }
    const j = (await r.json()) as { user: AuthUser; requiresOnboarding?: boolean };
    set({ user: j.user, fetched: true });
    return { ok: true, requiresOnboarding: j.requiresOnboarding };
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
