"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Program } from "../types";

export type StepStatus = "todo" | "in_progress" | "done" | "skipped";

export type PlanStepKind =
  | "platform_signup"
  | "motivation_letter"
  | "complete_dossier"
  | "interview"
  | "school_response"
  | "custom";

export type PlanStep = {
  id: string;
  programId: string;
  kind: PlanStepKind;
  label: string;
  status: StepStatus;
  dueAt: string | null;
  notes?: string;
};

export type PlanItem = {
  programId: string;
  addedAt: string;
  applicationStatus: "draft" | "submitted" | "under_review" | "interview" | "admitted" | "rejected" | "withdrawn" | "deferred";
  steps: PlanStep[];
  statusHistory: { status: PlanItem["applicationStatus"]; at: string }[];
};

type State = {
  items: PlanItem[];
  hydrated: boolean;
  add: (program: Program) => void;
  remove: (programId: string) => void;
  toggleStep: (programId: string, stepId: string) => void;
  setApplicationStatus: (programId: string, s: PlanItem["applicationStatus"]) => void;
  patchStep: (programId: string, stepId: string, patch: Partial<PlanStep>) => void;
  addCustomStep: (programId: string, label: string) => void;
};

function offsetDateIso(base: string | undefined, days: number): string | null {
  if (!base) return null;
  const d = new Date(base);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildSteps(programId: string, p: Program): PlanStep[] {
  const open = p.applicationOpens;
  const close = p.applicationCloses;
  const steps: PlanStep[] = [];
  steps.push({
    id: nanoid(8),
    programId,
    kind: "platform_signup",
    label: "Inscription plateforme",
    status: "todo",
    dueAt: open ?? null,
  });
  steps.push({
    id: nanoid(8),
    programId,
    kind: "motivation_letter",
    label: "Lettre de motivation",
    status: "todo",
    dueAt: offsetDateIso(close, -14),
  });
  steps.push({
    id: nanoid(8),
    programId,
    kind: "complete_dossier",
    label: "Dossier complet",
    status: "todo",
    dueAt: close ?? null,
  });
  if (p.optionalSteps?.some((s) => s.toLowerCase().includes("entretien"))) {
    steps.push({
      id: nanoid(8),
      programId,
      kind: "interview",
      label: "Entretien (si convoqué·e)",
      status: "todo",
      dueAt: offsetDateIso(close, 30),
    });
  }
  steps.push({
    id: nanoid(8),
    programId,
    kind: "school_response",
    label: "Réponse école",
    status: "todo",
    dueAt: offsetDateIso(close, 60),
  });
  return steps;
}

export const usePlanStore = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      add: (p) => {
        const list = get().items;
        if (list.some((i) => i.programId === p.id)) return;
        set({
          items: [
            ...list,
            {
              programId: p.id,
              addedAt: new Date().toISOString(),
              applicationStatus: "draft",
              steps: buildSteps(p.id, p),
              statusHistory: [{ status: "draft", at: new Date().toISOString() }],
            },
          ],
        });
      },
      remove: (programId) =>
        set({ items: get().items.filter((i) => i.programId !== programId) }),
      toggleStep: (programId, stepId) =>
        set({
          items: get().items.map((i) =>
            i.programId === programId
              ? {
                  ...i,
                  steps: i.steps.map((s) =>
                    s.id === stepId
                      ? { ...s, status: s.status === "done" ? "todo" : "done" }
                      : s,
                  ),
                }
              : i,
          ),
        }),
      patchStep: (programId, stepId, patch) =>
        set({
          items: get().items.map((i) =>
            i.programId === programId
              ? { ...i, steps: i.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }
              : i,
          ),
        }),
      setApplicationStatus: (programId, s) =>
        set({
          items: get().items.map((i) =>
            i.programId === programId
              ? {
                  ...i,
                  applicationStatus: s,
                  statusHistory: [...i.statusHistory, { status: s, at: new Date().toISOString() }],
                }
              : i,
          ),
        }),
      addCustomStep: (programId, label) =>
        set({
          items: get().items.map((i) =>
            i.programId === programId
              ? {
                  ...i,
                  steps: [
                    ...i.steps,
                    {
                      id: nanoid(8),
                      programId,
                      kind: "custom",
                      label,
                      status: "todo",
                      dueAt: null,
                    },
                  ],
                }
              : i,
          ),
        }),
    }),
    {
      name: "akjol-plan-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export function nextActionFor(item: PlanItem): { step: PlanStep; daysUntil: number | null } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = item.steps
    .filter((s) => s.status !== "done" && s.status !== "skipped")
    .map((s) => {
      const due = s.dueAt ? new Date(s.dueAt) : null;
      const days = due ? Math.ceil((due.getTime() - today.getTime()) / 86400000) : null;
      return { step: s, daysUntil: days };
    })
    .sort((a, b) => {
      if (a.daysUntil === null) return 1;
      if (b.daysUntil === null) return -1;
      return a.daysUntil - b.daysUntil;
    });
  return upcoming[0] ?? null;
}
