"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/auth-store";
import { usePassportStore } from "../store/passport-store";
import { usePlanStore } from "../store/plan-store";
import { useParcoursStore } from "../store/parcours-store";
import { useDocumentsStore } from "../store/documents-store";

/**
 * Sync localStorage ↔ DB pour les 4 stores user :
 *   - passport-store, plan-store, parcours-store, documents-store
 *
 * Stratégie au premier login (par cookie ou par formulaire) :
 *   1. PULL /api/passport
 *   2a. Si remote vide pour cet user (premier device) → PUSH local (migration silencieuse).
 *       Sinon on écraserait le passeport tout juste construit par /onboarding.
 *   2b. Si remote a des données → on adopte le remote comme source de vérité.
 *       Tradeoff : on écrase d'éventuelles modifs locales non poussées (rare en MVP,
 *       conflict résolu en lastWriteWins-server). Pour un vrai multi-device collab,
 *       il faudrait CRDT — hors scope.
 *
 * Ensuite, à chaque changement local d'un store → PUSH débouncé 1.5s.
 * Le `skipNextPush` ref évite la cascade immédiate après un PULL (sinon on
 * pousse aussitôt ce qu'on vient de recevoir → boucle inutile).
 *
 * Si DB indisponible (503) : on reste en local-only, pas d'erreur fatale.
 */

export type SyncStatus = "idle" | "pulling" | "pushing" | "synced" | "error" | "offline";

export type SyncState = {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  error?: string;
};

const PUSH_DEBOUNCE_MS = 1500;

export function useSync() {
  const user = useAuthStore((s) => s.user);
  const fetched = useAuthStore((s) => s.fetched);

  const [state, setState] = useState<SyncState>({
    status: "idle",
    lastSyncedAt: null,
  });

  // Empêche de re-pull à chaque tick du store auth (lastLoginAt etc.)
  const pulledForUser = useRef<string | null>(null);
  // Marqué juste après un PULL réussi → la première mutation des stores qui
  // suivra ne déclenchera pas un PUSH (puisque c'est nous qui venons d'écrire).
  const skipNextPush = useRef(false);

  // PULL initial
  useEffect(() => {
    if (!fetched) return;
    if (!user) {
      pulledForUser.current = null;
      setState({ status: "idle", lastSyncedAt: null });
      return;
    }
    if (pulledForUser.current === user.userId) return;
    pulledForUser.current = user.userId;

    void (async () => {
      setState((s) => ({ ...s, status: "pulling" }));
      try {
        const r = await fetch("/api/passport", { credentials: "same-origin" });

        if (r.status === 503) {
          setState({ status: "offline", lastSyncedAt: null, error: "DB indisponible" });
          return;
        }
        if (!r.ok) throw new Error(`pull HTTP ${r.status}`);

        const data = (await r.json()) as {
          passport: { data: unknown; updatedAt: string } | null;
          plan: { data: unknown; updatedAt: string } | null;
          parcours: { data: unknown; updatedAt: string } | null;
          documents: { data: unknown; updatedAt: string } | null;
        };

        const remoteEmpty = !data.passport && !data.plan && !data.parcours && !data.documents;

        if (remoteEmpty) {
          // Migration silencieuse : push local comme état initial du compte.
          await pushAll();
          setState({ status: "synced", lastSyncedAt: new Date() });
          return;
        }

        // Remote a des données → on les adopte. skipNextPush évite la cascade.
        skipNextPush.current = true;
        if (data.passport?.data) {
          usePassportStore.setState({ passport: data.passport.data as never });
        }
        if (data.plan?.data && Array.isArray(data.plan.data)) {
          usePlanStore.setState({ items: data.plan.data as never });
        }
        if (data.parcours?.data && Array.isArray(data.parcours.data)) {
          useParcoursStore.setState({ parcours: data.parcours.data as never });
        }
        if (data.documents?.data && typeof data.documents.data === "object") {
          useDocumentsStore.setState({ metas: data.documents.data as never });
        }
        setState({ status: "synced", lastSyncedAt: new Date() });
      } catch (err) {
        setState({
          status: "error",
          lastSyncedAt: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }, [user, fetched]);

  // PUSH débouncé sur mutation des stores
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function schedulePush() {
      if (skipNextPush.current) {
        skipNextPush.current = false;
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        setState((s) => ({ ...s, status: "pushing" }));
        try {
          await pushAll();
          setState({ status: "synced", lastSyncedAt: new Date() });
        } catch (err) {
          setState((s) => ({
            ...s,
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          }));
        }
      }, PUSH_DEBOUNCE_MS);
    }

    const unsubs = [
      usePassportStore.subscribe(schedulePush),
      usePlanStore.subscribe(schedulePush),
      useParcoursStore.subscribe(schedulePush),
      useDocumentsStore.subscribe(schedulePush),
    ];

    return () => {
      if (timer) clearTimeout(timer);
      for (const u of unsubs) u();
    };
  }, [user]);

  return state;
}

async function pushAll(): Promise<void> {
  const body = {
    passport: usePassportStore.getState().passport,
    plan: usePlanStore.getState().items,
    parcours: useParcoursStore.getState().parcours,
    documents: useDocumentsStore.getState().metas,
  };
  const r = await fetch("/api/passport", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  if (!r.ok) throw new Error(`push HTTP ${r.status}`);
}
