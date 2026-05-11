"use client";

import { useEffect, useState } from "react";
import { usePassportStore } from "../store/passport-store";
import { useParcoursStore } from "../store/parcours-store";
import { usePlanStore } from "../store/plan-store";
import { useDocumentsStore } from "../store/documents-store";
import { useSync } from "../hooks/useSync";

export function RehydrateStores() {
  // On hydrate les stores localStorage AVANT de monter le sync hook — sinon le
  // hook lirait un state vide et le pousserait en DB, écrasant ce qui était
  // pourtant déjà dans le navigateur.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.all([
      usePassportStore.persist.rehydrate(),
      useParcoursStore.persist.rehydrate(),
      usePlanStore.persist.rehydrate(),
      useDocumentsStore.persist.rehydrate(),
    ]).then(() => setHydrated(true));
  }, []);

  return hydrated ? <SyncManager /> : null;
}

/** Composant invisible qui maintient la sync DB ↔ localStorage active. */
function SyncManager() {
  useSync();
  return null;
}
