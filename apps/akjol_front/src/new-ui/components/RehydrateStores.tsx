"use client";

import { useEffect } from "react";
import { usePassportStore } from "../store/passport-store";
import { useLivesStore } from "../store/lives-store";

export function RehydrateStores() {
  useEffect(() => {
    void usePassportStore.persist.rehydrate();
    void useLivesStore.persist.rehydrate();
  }, []);
  return null;
}
