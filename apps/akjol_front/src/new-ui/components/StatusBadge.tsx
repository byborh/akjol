import type { FeasibilityStatus } from "../types";

const MAP: Record<FeasibilityStatus, { bg: string; fg: string; label: string }> = {
  open: { bg: "#a3cf9120", fg: "#3a6f2c", label: "Ouvert" },
  open_with_step: { bg: "#f5b86a25", fg: "#8a5314", label: "Avec une étape" },
  closed: { bg: "#d9656520", fg: "#7e2929", label: "Fermé" },
  uncovered: { bg: "#1a1d2410", fg: "#1a1d2470", label: "Non couvert" },
};

export function StatusBadge({ status }: { status: FeasibilityStatus }) {
  const cfg = MAP[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}
