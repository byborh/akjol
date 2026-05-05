"use client";

import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, X } from "lucide-react";
import { usePassportStore } from "../store/passport-store";
import { findProgram } from "../data/programs";
import { findSchool } from "../data/schools";
import { useMounted } from "../hooks/useMounted";

export function CompareDrawer() {
  const mounted = useMounted();
  const programs = usePassportStore((s) => s.comparator);
  const schools = usePassportStore((s) => s.comparatorSchools);
  const togglePr = usePassportStore((s) => s.toggleCompare);
  const togglSc = usePassportStore((s) => s.toggleCompareSchool);
  const clear = usePassportStore((s) => s.clearComparator);

  const total = programs.length + schools.length;
  if (!mounted || total === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)]">
      <div className="rounded-2xl bg-[#1a1d24] text-white shadow-2xl border border-white/10 px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <span
            className="text-[10px] uppercase tracking-wider text-white/50 font-semibold whitespace-nowrap"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Comparer
          </span>
          <span className="text-xs font-semibold text-white">{total}/8</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto max-w-[60vw]">
          {programs.map((id) => {
            const p = findProgram(id);
            if (!p) return null;
            return (
              <Chip
                key={`p-${id}`}
                icon={<GraduationCap size={12} />}
                label={p.title}
                color="#ee7768"
                onRemove={() => togglePr(id)}
              />
            );
          })}
          {schools.map((id) => {
            const s = findSchool(id);
            if (!s) return null;
            return (
              <Chip
                key={`s-${id}`}
                icon={<Building2 size={12} />}
                label={s.name}
                color="#a3cf91"
                onRemove={() => togglSc(id)}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
          <button
            onClick={clear}
            className="text-[11px] text-white/50 hover:text-white px-2 py-1 transition"
          >
            Vider
          </button>
          <Link
            href="/compare"
            className="inline-flex items-center gap-1 text-[12px] font-semibold rounded-lg px-3 py-1.5 text-white transition"
            style={{ background: "#ee7768" }}
          >
            Voir la comparaison <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Chip({
  icon,
  label,
  color,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-[11px] whitespace-nowrap"
      style={{ background: `${color}25`, color: color }}
    >
      {icon}
      <span className="max-w-[160px] truncate font-medium">{label}</span>
      <button
        onClick={onRemove}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/10"
        aria-label="retirer du comparateur"
      >
        <X size={10} />
      </button>
    </span>
  );
}
