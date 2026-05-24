"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, CheckCircle2, Circle, Pencil, Copy } from "lucide-react";
import type { AdminProgramRow } from "@akjol/db";

const LEVEL_LABELS: Record<string, string> = {
  lycee: "BTS",
  bachelor: "BUT",
  licence: "Licence",
  licence_pro: "LP",
  master: "Master",
  ecole_inge: "Ingé",
  doctorat: "Doctorat",
  certif: "Certif",
};

const PAGE_SIZE = 50;

type StatusFilter = "all" | "curated" | "raw";

export function ProgramsTable({ programs }: { programs: AdminProgramRow[] }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (level !== "all" && p.level !== level) return false;
      if (status === "curated" && !p.isCurated) return false;
      if (status === "raw" && p.isCurated) return false;
      if (q) {
        const hay = `${p.title} ${p.school.name} ${p.school.city} ${p.formationLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [programs, search, level, status]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(offset, offset + PAGE_SIZE);

  // Reset to page 1 when filters change
  function setFilterAndReset<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 bg-white">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (titre, école, ville…)"
            value={search}
            onChange={(e) => setFilterAndReset(setSearch, e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
          />
        </div>
        <select
          value={level}
          onChange={(e) => setFilterAndReset(setLevel, e.target.value)}
          className="px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-gray-500"
        >
          <option value="all">Tous niveaux</option>
          {Object.entries(LEVEL_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex rounded border border-gray-200 overflow-hidden">
          {(["all", "curated", "raw"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterAndReset(setStatus, s)}
              className={`px-2.5 py-1.5 text-xs transition-colors ${
                status === s
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "Tout" : s === "curated" ? "Curées" : "Brutes"}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {total.toLocaleString()} résultat{total > 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-3 py-2 text-left w-8">
                <span className="sr-only">Statut</span>
              </th>
              <th scope="col" className="px-3 py-2 text-left">Titre</th>
              <th scope="col" className="px-3 py-2 text-left">École</th>
              <th scope="col" className="px-3 py-2 text-left">Ville</th>
              <th scope="col" className="px-3 py-2 text-left w-20">Niveau</th>
              <th scope="col" className="px-3 py-2 text-left w-24">Source</th>
              <th scope="col" className="px-3 py-2 text-right w-16">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-sm">
                  Aucun program ne matche les filtres.
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr
                key={p.id}
                className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2">
                  {p.isCurated ? (
                    <CheckCircle2 size={14} className="text-green-700" aria-label="Curée" />
                  ) : (
                    <Circle size={14} className="text-gray-300" aria-label="Brute" />
                  )}
                </td>
                <td className="px-3 py-2 text-gray-900">{p.title}</td>
                <td className="px-3 py-2 text-gray-700">{p.school.name || "—"}</td>
                <td className="px-3 py-2 text-gray-700">{p.school.city || "—"}</td>
                <td className="px-3 py-2 text-gray-700 text-xs">
                  {LEVEL_LABELS[p.level] ?? p.level}
                </td>
                <td className="px-3 py-2 text-gray-500 text-xs font-mono">{p.source}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/programs/new?from=${encodeURIComponent(p.id)}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title="Dupliquer cette fiche"
                    >
                      <Copy size={12} />
                    </Link>
                    <Link
                      href={`/admin/programs/${encodeURIComponent(p.id)}/edit`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title="Éditer"
                    >
                      <Pencil size={12} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-gray-200 text-sm text-gray-600">
          <span>
            Page {safePage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
