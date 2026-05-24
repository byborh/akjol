"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { AdminProgramRow } from "@akjol/db";
import {
  ProgramFormSchema,
  PROGRAM_LEVELS,
  ADMISSION_PLATFORMS,
  type ProgramFormInput,
} from "../../../../lib/admin/program-schema";

const PAGE_SIZE = 30;
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const LEVEL_LABELS: Record<string, string> = {
  lycee: "BTS",
  bachelor: "BUT",
  licence: "Lic.",
  licence_pro: "LP",
  master: "Mast.",
  ecole_inge: "Ingé",
  doctorat: "Doct.",
  certif: "Cert.",
};

type DirtyMap = Map<string, Partial<AdminProgramRow>>;
type RowStatus = "clean" | "dirty" | "saving" | "saved" | "error";

export function BatchEditTable({ programs }: { programs: AdminProgramRow[] }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "curated" | "raw">("all");
  const [page, setPage] = useState(1);

  // État local : map id → patch en cours
  const [dirty, setDirty] = useState<DirtyMap>(new Map());
  const [rowStatus, setRowStatus] = useState<Map<string, RowStatus>>(new Map());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (level !== "all" && p.level !== level) return false;
      if (status === "curated" && !p.isCurated) return false;
      if (status === "raw" && p.isCurated) return false;
      if (q) {
        const hay = `${p.title} ${p.school.name} ${p.school.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [programs, search, level, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(offset, offset + PAGE_SIZE);

  /** Récupère la valeur courante (avec override dirty si modifié) */
  function getValue<K extends keyof AdminProgramRow>(p: AdminProgramRow, key: K): AdminProgramRow[K] {
    const patch = dirty.get(p.id);
    if (patch && key in patch) return patch[key] as AdminProgramRow[K];
    return p[key];
  }
  function getSchoolName(p: AdminProgramRow): string {
    const patch = dirty.get(p.id);
    if (patch && "school" in patch && patch.school) return patch.school.name;
    return p.school.name;
  }
  function getSchoolCity(p: AdminProgramRow): string {
    const patch = dirty.get(p.id);
    if (patch && "school" in patch && patch.school) return patch.school.city;
    return p.school.city;
  }
  function getLanguageMinLevel(p: AdminProgramRow): string {
    const patch = dirty.get(p.id);
    if (patch && "language" in patch && patch.language) return patch.language.minLevel;
    return p.language.minLevel;
  }

  function updateField(id: string, field: keyof AdminProgramRow, value: AdminProgramRow[keyof AdminProgramRow]) {
    setDirty((prev) => {
      const next = new Map(prev);
      const patch = next.get(id) ?? {};
      next.set(id, { ...patch, [field]: value });
      return next;
    });
    setRowStatus((prev) => new Map(prev).set(id, "dirty"));
  }
  function updateSchool(id: string, key: "name" | "city", value: string) {
    setDirty((prev) => {
      const next = new Map(prev);
      const p = programs.find((x) => x.id === id);
      const current = next.get(id) ?? {};
      const baseSchool = current.school ?? p?.school ?? { name: "", city: "" };
      next.set(id, { ...current, school: { ...baseSchool, [key]: value } });
      return next;
    });
    setRowStatus((prev) => new Map(prev).set(id, "dirty"));
  }
  function updateLanguageMinLevel(id: string, value: string) {
    setDirty((prev) => {
      const next = new Map(prev);
      const p = programs.find((x) => x.id === id);
      const current = next.get(id) ?? {};
      const baseLanguage = current.language ?? p?.language ?? { code: "fr", minLevel: "B2" };
      next.set(id, { ...current, language: { ...baseLanguage, minLevel: value } });
      return next;
    });
    setRowStatus((prev) => new Map(prev).set(id, "dirty"));
  }

  async function saveRow(id: string) {
    const original = programs.find((p) => p.id === id);
    if (!original) return;
    const patch = dirty.get(id) ?? {};
    // Construit le payload complet (ProgramFormSchema attend tous les champs)
    const merged: AdminProgramRow = { ...original, ...patch };
    const payload = adminRowToFormInput(merged);

    // Validation Zod côté client avant fetch
    const parsed = ProgramFormSchema.safeParse(payload);
    if (!parsed.success) {
      console.error("Validation failed for row", id, parsed.error.issues);
      setRowStatus((prev) => new Map(prev).set(id, "error"));
      return;
    }

    setRowStatus((prev) => new Map(prev).set(id, "saving"));
    try {
      const res = await fetch(`/api/admin/programs/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[batch save]", id, res.status, body);
        setRowStatus((prev) => new Map(prev).set(id, "error"));
        return;
      }
      // Succès : on retire le patch du dirty, on note "saved"
      setDirty((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setRowStatus((prev) => new Map(prev).set(id, "saved"));
      // Reflète le nouvel état sur l'objet local (immutable pattern : on patch)
      Object.assign(original, patch);
    } catch (e) {
      console.error("[batch save fetch]", id, e);
      setRowStatus((prev) => new Map(prev).set(id, "error"));
    }
  }

  const dirtyCount = dirty.size;

  async function saveAll() {
    const ids = Array.from(dirty.keys());
    for (const id of ids) {
      await saveRow(id);
    }
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (titre, école, ville…)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
          />
        </div>
        <select
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(1);
          }}
          className="px-2 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-gray-500"
        >
          <option value="all">Tous niveaux</option>
          {PROGRAM_LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABELS[l] ?? l}
            </option>
          ))}
        </select>
        <div className="flex rounded border border-gray-300 overflow-hidden">
          {(["all", "curated", "raw"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-2.5 py-1.5 text-xs transition-colors ${
                status === s
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {s === "all" ? "Tout" : s === "curated" ? "Curées" : "Brutes"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          {dirtyCount > 0 && (
            <button
              onClick={saveAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ee7768] hover:bg-[#e9614f] text-white text-xs font-medium rounded transition-colors"
            >
              <Save size={12} />
              Tout sauvegarder ({dirtyCount})
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider sticky top-0">
            <tr>
              <th scope="col" className="px-2 py-2 text-left w-10">
                <span className="sr-only">Sélection</span>
              </th>
              <th scope="col" className="px-2 py-2 text-left min-w-[200px]">Titre</th>
              <th scope="col" className="px-2 py-2 text-left w-20">Niveau</th>
              <th scope="col" className="px-2 py-2 text-left min-w-[160px]">École</th>
              <th scope="col" className="px-2 py-2 text-left min-w-[120px]">Ville</th>
              <th scope="col" className="px-2 py-2 text-left w-16">Durée</th>
              <th scope="col" className="px-2 py-2 text-left w-20">Coût/an</th>
              <th scope="col" className="px-2 py-2 text-left w-20">CECRL</th>
              <th scope="col" className="px-2 py-2 text-left w-32">Plateforme</th>
              <th scope="col" className="px-2 py-2 text-center w-16">Curée</th>
              <th scope="col" className="px-2 py-2 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-gray-400 text-sm">
                  Aucun program ne matche les filtres.
                </td>
              </tr>
            )}
            {visible.map((p) => {
              const st = rowStatus.get(p.id) ?? "clean";
              return (
                <tr
                  key={p.id}
                  className={`border-t border-gray-100 ${
                    st === "dirty"
                      ? "bg-orange-50"
                      : st === "saved"
                      ? "bg-green-50"
                      : st === "error"
                      ? "bg-red-50"
                      : ""
                  }`}
                >
                  <td className="px-2 py-1">
                    <StatusBadge status={st} />
                  </td>
                  <td className="px-2 py-1">
                    <EditableCell
                      type="text"
                      value={getValue(p, "title") as string}
                      onSave={(v) => updateField(p.id, "title", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={getValue(p, "level") as string}
                      onChange={(e) => updateField(p.id, "level", e.target.value)}
                      className="w-full px-1 py-0.5 bg-transparent text-sm text-gray-900 border-0 focus:outline-none focus:bg-white focus:border focus:border-gray-300 rounded"
                    >
                      {PROGRAM_LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {LEVEL_LABELS[l] ?? l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <EditableCell
                      type="text"
                      value={getSchoolName(p)}
                      onSave={(v) => updateSchool(p.id, "name", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <EditableCell
                      type="text"
                      value={getSchoolCity(p)}
                      onSave={(v) => updateSchool(p.id, "city", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <EditableCell
                      type="number"
                      value={String(getValue(p, "durationYears") ?? "")}
                      onSave={(v) => updateField(p.id, "durationYears", Number(v) || 1)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <EditableCell
                      type="number"
                      value={String(getValue(p, "costPerYear") ?? "0")}
                      onSave={(v) => updateField(p.id, "costPerYear", Number(v) || 0)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={getLanguageMinLevel(p)}
                      onChange={(e) => updateLanguageMinLevel(p.id, e.target.value)}
                      className="w-full px-1 py-0.5 bg-transparent text-sm text-gray-900 border-0 focus:outline-none focus:bg-white focus:border focus:border-gray-300 rounded"
                    >
                      {CEFR.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={getValue(p, "admissionPlatform") as string}
                      onChange={(e) => updateField(p.id, "admissionPlatform", e.target.value)}
                      className="w-full px-1 py-0.5 bg-transparent text-sm text-gray-900 border-0 focus:outline-none focus:bg-white focus:border focus:border-gray-300 rounded"
                    >
                      {ADMISSION_PLATFORMS.map((ap) => (
                        <option key={ap} value={ap}>
                          {ap}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={getValue(p, "isCurated") as boolean}
                      onChange={(e) => updateField(p.id, "isCurated", e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <div className="inline-flex items-center gap-1">
                      {dirty.has(p.id) && (
                        <button
                          onClick={() => saveRow(p.id)}
                          disabled={st === "saving"}
                          className="px-1.5 py-1 text-xs text-[#ee7768] hover:bg-orange-100 rounded"
                          title="Sauvegarder cette ligne (Ctrl+S coming soon)"
                        >
                          <Save size={12} />
                        </button>
                      )}
                      <Link
                        href={`/admin/programs/${encodeURIComponent(p.id)}/edit`}
                        className="px-1.5 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                        title="Éditer en mode complet (listes, certificats…)"
                      >
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
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

// ─────────── Cellule éditable ───────────

function EditableCell({
  type,
  value,
  onSave,
}: {
  type: "text" | "number";
  value: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  // Sync si la prop change (ex: après save)
  if (value !== local && document.activeElement?.tagName !== "INPUT") {
    setLocal(value);
  }
  return (
    <input
      type={type}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onSave(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setLocal(value);
          e.currentTarget.blur();
        }
      }}
      className="w-full px-1 py-0.5 bg-transparent text-sm text-gray-900 border-0 focus:outline-none focus:bg-white focus:border focus:border-gray-300 rounded"
    />
  );
}

function StatusBadge({ status }: { status: RowStatus }) {
  switch (status) {
    case "dirty":
      return (
        <span className="inline-flex items-center text-[#ee7768]" title="Modifications non sauvegardées">
          <AlertCircle size={14} />
        </span>
      );
    case "saving":
      return (
        <span className="inline-flex items-center text-gray-500 animate-spin" title="Enregistrement…">
          <Loader2 size={14} />
        </span>
      );
    case "saved":
      return (
        <span className="inline-flex items-center text-green-700" title="Sauvegardé">
          <CheckCircle2 size={14} />
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center text-red-700" title="Erreur — voir console">
          <AlertCircle size={14} />
        </span>
      );
    default:
      return <span className="inline-block w-3.5 h-3.5" />;
  }
}

// ─────────── AdminProgramRow → ProgramFormInput (pour le PATCH) ───────────

function adminRowToFormInput(row: AdminProgramRow): ProgramFormInput {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.sourceId,
    sourceUrl: row.sourceUrl ?? "",
    countryRef: row.countryRef,
    formationCode: row.formationCode,
    formationLabel: row.formationLabel,
    title: row.title,
    level: row.level as ProgramFormInput["level"],
    durationYears: row.durationYears,
    description: row.description,
    schoolName: row.school.name,
    schoolCity: row.school.city,
    schoolType: row.school.type ?? "",
    schoolWebsiteUrl: row.school.websiteUrl ?? "",
    schoolUai: row.schoolUai ?? "",
    languageCode: row.language.code,
    languageMinLevel: row.language.minLevel as ProgramFormInput["languageMinLevel"],
    costPerYear: row.costPerYear,
    admissionPlatform: row.admissionPlatform as ProgramFormInput["admissionPlatform"],
    applicationOpens: row.applicationOpens ?? "",
    applicationCloses: row.applicationCloses ?? "",
    applicationFee: row.applicationFee,
    workStudy: row.workStudy,
    resultingDiplomaCode: row.resultingDiplomaCode,
    resultingDiplomaLabel: row.resultingDiplomaLabel,
    minGrade: row.minGrade,
    acceptedDiplomas: row.acceptedDiplomas,
    domains: row.domains,
    outcomesJobs: row.outcomesJobs,
    outcomesNextLevels: row.outcomesNextLevels,
    internationallyRecognizedIn: row.internationallyRecognizedIn,
    documents: row.documents,
    optionalSteps: row.optionalSteps ?? [],
    recommendsCertificate: row.recommendsCertificate,
    recommendsInternshipWeeks: row.recommendsInternshipWeeks,
    isCurated: row.isCurated,
  };
}
