import type { AdminProgramRow } from "@akjol/db";

/**
 * Cibles V1 par niveau (total 200 fiches). Si tu ajustes ces nombres,
 * mets aussi à jour docs/dossier_entrepreneuriat.md où ils sont cités.
 */
const TARGETS: Array<{ key: string; label: string; target: number }> = [
  { key: "lycee", label: "BTS (lycée)", target: 40 },
  { key: "bachelor", label: "BUT", target: 30 },
  { key: "licence", label: "Licence", target: 25 },
  { key: "licence_pro", label: "Licence pro", target: 20 },
  { key: "master", label: "Master", target: 30 },
  { key: "ecole_inge", label: "École d'ingé", target: 40 },
];
const BONUS_TARGET = 15; // certif, doctorat, autres

export function ProgressBars({ programs }: { programs: AdminProgramRow[] }) {
  const curated = programs.filter((p) => p.isCurated);
  const countByLevel = new Map<string, number>();
  for (const p of curated) {
    countByLevel.set(p.level, (countByLevel.get(p.level) ?? 0) + 1);
  }
  const bonusCount =
    curated.length -
    TARGETS.reduce((sum, t) => sum + (countByLevel.get(t.key) ?? 0), 0);

  return (
    <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
      {TARGETS.map(({ key, label, target }) => {
        const count = countByLevel.get(key) ?? 0;
        return <Bar key={key} label={label} count={count} target={target} />;
      })}
      <Bar label="Bonus" count={Math.max(0, bonusCount)} target={BONUS_TARGET} muted />
    </div>
  );
}

function Bar({
  label,
  count,
  target,
  muted = false,
}: {
  label: string;
  count: number;
  target: number;
  muted?: boolean;
}) {
  const pct = Math.min(100, Math.round((count / target) * 100));
  const done = count >= target;
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="text-[11px] text-gray-600 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-semibold ${done ? "text-green-700" : "text-gray-900"}`}>
          {count}
        </span>
        <span className="text-xs text-gray-400">/ {target}</span>
      </div>
      <div className="mt-1.5 h-1 bg-gray-200 rounded overflow-hidden">
        <div
          className={`h-full transition-all ${
            done ? "bg-green-600" : muted ? "bg-gray-400" : "bg-[#ee7768]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
