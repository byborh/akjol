"use client";

import { useId, useState, type ReactNode } from "react";
import { Info } from "lucide-react";

/**
 * Affiche un chiffre + icône ⓘ qui révèle au survol/focus la source du
 * chiffre (label, URL, date). Pattern §16 du doc ui-idea-2 : *aucun chiffre
 * sans source*. Utilisable inline dans un span de texte.
 *
 * Si la source est interne (modèle AkJol), passer `url="/methodologie"` et
 * `label="Modèle AkJol v1.5"` pour pointer vers la page méthodologie.
 */
export type Source = {
  label: string;
  url?: string;
  /** ISO date string YYYY-MM-DD ; null si non datée (ex: source live). */
  date?: string | null;
};

export function SourcedNumber({
  value,
  source,
  children,
  className = "",
}: {
  /** Le chiffre formaté à afficher (ex: "78%", "32k€", "1 100€/mois"). Ignored si `children`. */
  value?: ReactNode;
  source: Source;
  /** Alternative à `value` : permet de wrapper un contenu plus riche. */
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const display = children ?? value;
  const human = humanDate(source.date);

  return (
    <span className={`relative inline-flex items-baseline gap-1 ${className}`}>
      <span>{display}</span>
      <button
        type="button"
        aria-label={`Source : ${source.label}`}
        aria-describedby={open ? popoverId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center justify-center text-[#1a1d24]/40 hover:text-[#1a1d24]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee7768]/60 rounded"
      >
        <Info size={11} aria-hidden="true" />
      </button>
      {open ? (
        <span
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full mt-1 z-50 w-64 bg-white border border-black/10 shadow-lg rounded-md p-2.5 text-[11px] leading-snug text-[#1a1d24]/85 font-normal"
        >
          <span className="font-medium text-[#1a1d24] block">{source.label}</span>
          {human ? <span className="text-[#1a1d24]/60 block">{human}</span> : null}
          {source.url ? (
            <a
              href={source.url}
              target={source.url.startsWith("/") ? undefined : "_blank"}
              rel="noreferrer"
              className="text-[#ee7768] hover:underline block mt-1"
            >
              Voir la source →
            </a>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function humanDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

/** Source canonique du moteur de feasibility — réutilisable partout. */
export const AKJOL_MODEL_SOURCE: Source = {
  label: "Modèle AkJol v1.5",
  url: "/methodologie",
  date: "2026-05-13",
};
