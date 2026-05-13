"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Plausible Analytics — auto-hébergé, sans cookie, sans empreinte. Respecte
 * Do-Not-Track et un opt-out local (`localStorage.akjol_analytics_optout`).
 *
 * Activé uniquement si NEXT_PUBLIC_PLAUSIBLE_DOMAIN est défini (ex:
 * "akjol.app") ET, optionnellement, NEXT_PUBLIC_PLAUSIBLE_SRC pour pointer
 * vers une instance auto-hébergée (sinon plausible.io). Aucun script chargé
 * en l'absence de ces variables — zéro risque de leak en dev.
 */
const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

export const ANALYTICS_OPTOUT_KEY = "akjol_analytics_optout";

export function PlausibleScript() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!DOMAIN) return;
    if (typeof window === "undefined") return;
    // Do-Not-Track navigateur
    if (navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1") return;
    // Opt-out user explicite
    try {
      if (localStorage.getItem(ANALYTICS_OPTOUT_KEY) === "1") return;
    } catch {
      // localStorage indisponible → on s'abstient
      return;
    }
    setEnabled(true);
  }, []);

  if (!DOMAIN || !enabled) return null;
  return <Script src={SRC} data-domain={DOMAIN} strategy="afterInteractive" defer />;
}
