"use client";

import { Plane, ExternalLink } from "lucide-react";
import { findCorridor } from "../data/visaCorridors";
import type { ProgramLevel } from "../types";

type Props = {
  origin: string;
  dest: string;
  level?: ProgramLevel;
  className?: string;
};

export function VisaSection({ origin, dest, level, className }: Props) {
  if (!origin || !dest) return null;
  const c = findCorridor(origin, dest, level);

  return (
    <div className={"rounded-xl border border-black/5 bg-white p-4 " + (className ?? "")}>
      <h3 className="inline-flex items-center gap-2 text-sm font-medium mb-3">
        <Plane size={14} className="text-[#ee7768]" />
        Démarches visa pour toi
      </h3>

      {!c ? (
        <p className="text-[12px] text-[#1a1d24]/60">
          Corridor visa <span className="font-mono">{origin} → {dest}</span> non documenté pour
          l'instant. Vérifie les sites consulat / ambassade.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">{c.visaName}</div>
            <ComplexityChip complexity={c.complexity} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Délai" value={c.processingDays === 0 ? "—" : `${c.processingDays}j`} />
            <Stat
              label="Frais"
              value={c.fee === 0 ? "—" : `${c.fee.toLocaleString("fr-FR")} ${c.feeCurrency}`}
            />
            <Stat label="Refus" value={`${Math.round(c.refusalRate * 100)}%`} />
          </div>

          {c.requiredDocs.length > 0 ? (
            <details>
              <summary className="cursor-pointer text-[12px] text-[#1a1d24]/70">
                {c.requiredDocs.length} documents requis
              </summary>
              <ul className="mt-1.5 list-disc pl-4 space-y-0.5 text-[12px] text-[#1a1d24]/80">
                {c.requiredDocs.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </details>
          ) : null}

          {c.sources.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {c.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#1a1d24]/60 hover:text-[#ee7768]"
                >
                  {s.label} <ExternalLink size={10} />
                </a>
              ))}
            </div>
          ) : null}

          <div className="text-[10px] text-[#1a1d24]/40">
            Données vérifiées le {c.reviewedAt}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#fafaf7] border border-black/5 px-2 py-1.5">
      <div className="text-[10px] text-[#1a1d24]/50 uppercase tracking-wider">{label}</div>
      <div className="text-[12px] font-medium text-[#1a1d24]">{value}</div>
    </div>
  );
}

function ComplexityChip({ complexity }: { complexity: "simple" | "medium" | "complex" }) {
  const map = {
    simple: { bg: "#a3cf9120", fg: "#3a6f2c", label: "Simple" },
    medium: { bg: "#f5b86a25", fg: "#8a5314", label: "Moyen" },
    complex: { bg: "#d9656520", fg: "#7e2929", label: "Complexe" },
  } as const;
  const cc = map[complexity];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: cc.bg, color: cc.fg }}
    >
      {cc.label}
    </span>
  );
}
