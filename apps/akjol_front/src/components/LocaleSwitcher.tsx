"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Languages } from "lucide-react";
import { LOCALES, type Locale } from "../i18n/config";

export function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchTo(loc: Locale) {
    if (loc === current || busy) return;
    setBusy(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: loc }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="inline-flex items-center gap-1 text-[11px] text-[#1a1d24]/60">
      <Languages size={12} />
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className="px-1.5 py-0.5 rounded transition uppercase"
          style={{
            color: current === l ? "#ee7768" : "#1a1d2470",
            background: current === l ? "#ee776812" : "transparent",
            fontWeight: current === l ? 600 : 400,
          }}
          aria-pressed={current === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
