"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Alias historique : /passport est devenu /account#passport (fusion compte +
 * passeport, cf. feedback-mini-test bloc 1.3). On garde l'URL pour ne pas
 * casser les bookmarks externes — redirect côté client (pas server) pour
 * préserver le hash dans l'URL bar.
 */
export default function PassportRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account#passport");
  }, [router]);
  return null;
}
