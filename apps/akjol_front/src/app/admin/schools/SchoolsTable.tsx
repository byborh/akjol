"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import type { AdminSchoolRow } from "@akjol/db";
import { SCHOOL_TYPES } from "../../../lib/admin/school-schema";

const PAGE_SIZE = 50;

export function SchoolsTable({ schools }: { schools: AdminSchoolRow[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (q) {
        const hay = `${s.name} ${s.city} ${s.uai} ${s.region ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [schools, search, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, ville, UAI, région…)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
          />
        </div>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-gray-500"
        >
          <option value="all">Tous types</option>
          {SCHOOL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-gray-500">
          {filtered.length.toLocaleString()} résultat{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left w-28">UAI</th>
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-left">Ville</th>
              <th className="px-3 py-2 text-left w-24">Type</th>
              <th className="px-3 py-2 text-left w-40">Région</th>
              <th className="px-3 py-2 text-right w-16"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  Aucun établissement ne matche les filtres.
                </td>
              </tr>
            )}
            {visible.map((s) => (
              <tr key={s.uai} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{s.uai}</td>
                <td className="px-3 py-2 text-gray-900">{s.name}</td>
                <td className="px-3 py-2 text-gray-700">{s.city}</td>
                <td className="px-3 py-2 text-gray-600 text-xs">{s.type ?? "—"}</td>
                <td className="px-3 py-2 text-gray-600 text-xs">{s.region ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/schools/${encodeURIComponent(s.uai)}/edit`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    title="Éditer"
                  >
                    <Pencil size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-gray-200 text-sm text-gray-600">
          <span>
            Page {safePage} / {totalPages.toLocaleString()}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
