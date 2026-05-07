"use client";

import { useEffect } from "react";
import { usePassportStore } from "../store/passport-store";
import { useParcoursStore } from "../store/parcours-store";
import { usePlanStore } from "../store/plan-store";

export function RehydrateStores() {
  useEffect(() => {
    void usePassportStore.persist.rehydrate();
    void useParcoursStore.persist.rehydrate();
    void usePlanStore.persist.rehydrate();
  }, []);
  return null;
}
