"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Trash2, X, Copy } from "lucide-react";
import {
  ProgramFormSchema,
  PROGRAM_LEVELS,
  ADMISSION_PLATFORMS,
  emptyProgram,
  type ProgramFormInput,
} from "../../../lib/admin/program-schema";
import { OnisepPrefill, type OnisepRaw } from "./OnisepPrefill";
import { SchoolAutocomplete, type SchoolSuggestion } from "./SchoolAutocomplete";
import { DIPLOMAS } from "../../../data/diplomas";

const VALID_LEVELS = new Set(PROGRAM_LEVELS);
function asLevel(s: string): ProgramFormInput["level"] {
  return VALID_LEVELS.has(s as ProgramFormInput["level"])
    ? (s as ProgramFormInput["level"])
    : "bachelor";
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

type Props = {
  initial?: ProgramFormInput;
  programId?: string;
};

export function ProgramForm({ initial, programId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ProgramFormInput>(initial ?? emptyProgram());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const isEdit = Boolean(programId);
  const formRef = useRef<HTMLFormElement>(null);

  // Raccourcis clavier (critère #4) : Ctrl+S = save, Ctrl+Enter = save,
  // Ctrl+D = dupliquer (mode edit uniquement). Mac : Cmd équivalent.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "s" || (key === "enter" && !e.shiftKey)) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      } else if (key === "d" && isEdit && programId) {
        e.preventDefault();
        router.push(`/admin/programs/new?from=${encodeURIComponent(programId)}`);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isEdit, programId, router]);

  function update<K extends keyof ProgramFormInput>(key: K, value: ProgramFormInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const parsed = ProgramFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        next[path] = issue.message;
      }
      setErrors(next);
      setGlobalError(`${parsed.error.issues.length} champ(s) invalide(s) — corrige ci-dessous.`);
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/programs/${encodeURIComponent(programId!)}`
        : "/api/admin/programs";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setGlobalError(body.error ?? `Erreur HTTP ${res.status}`);
        return;
      }
      router.push("/admin/programs");
      router.refresh();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm(`Supprimer définitivement la fiche "${values.title}" ?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/programs/${encodeURIComponent(programId!)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setGlobalError(`Erreur ${res.status}`);
        return;
      }
      router.push("/admin/programs");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  // Suggestions dynamiques (chargées au mount)
  const [jobLabels, setJobLabels] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/admin/jobs")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items: Array<{ label: string }> } | null) => {
        if (data?.items) setJobLabels(data.items.map((j) => j.label).sort());
      })
      .catch(() => {
        /* offline OK */
      });
  }, []);

  const diplomaCodes = DIPLOMAS.map((d) => d.code);
  const nextLevelOptions = [...PROGRAM_LEVELS];

  function pickSchool(s: SchoolSuggestion) {
    setValues((v) => ({
      ...v,
      schoolName: s.name,
      schoolCity: s.city,
      schoolUai: s.uai,
      schoolType: s.type ?? v.schoolType,
      schoolWebsiteUrl: s.websiteUrl ?? v.schoolWebsiteUrl,
    }));
  }
  function clearSchool() {
    setValues((v) => ({ ...v, schoolUai: "" }));
  }

  function prefillFromOnisep(raw: OnisepRaw) {
    setValues((v) => ({
      ...v,
      title: raw.title,
      level: asLevel(raw.level),
      formationCode: raw.formationCode,
      formationLabel: raw.formationLabel,
      durationYears: raw.durationYears || v.durationYears,
      description: raw.description || v.description,
      source: "onisep",
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl ?? "",
    }));
    setErrors({});
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {globalError}
        </div>
      )}

      {!isEdit && <OnisepPrefill onSelect={prefillFromOnisep} />}

      <Section title="Identité">
        <Field label="Titre" error={errors.title} required>
          <input
            type="text"
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="ex: BTS SIO option SISR — Lycée Magendie"
            className={inputCls(errors.title)}
          />
        </Field>
        <Grid2>
          <Field label="Code formation" error={errors.formationCode} required>
            <input
              type="text"
              value={values.formationCode}
              onChange={(e) => update("formationCode", e.target.value)}
              placeholder="BTS_SIO_SISR"
              className={inputCls(errors.formationCode)}
            />
          </Field>
          <Field label="Libellé formation" error={errors.formationLabel} required>
            <input
              type="text"
              value={values.formationLabel}
              onChange={(e) => update("formationLabel", e.target.value)}
              placeholder="BTS Services Informatiques aux Organisations"
              className={inputCls(errors.formationLabel)}
            />
          </Field>
        </Grid2>
        <Grid3>
          <Field label="Niveau" error={errors.level} required>
            <select
              value={values.level}
              onChange={(e) => update("level", e.target.value as ProgramFormInput["level"])}
              className={selectCls(errors.level)}
            >
              {PROGRAM_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Durée (années)" error={errors.durationYears} required>
            <input
              type="number"
              min={1}
              max={10}
              value={values.durationYears}
              onChange={(e) => update("durationYears", Number(e.target.value))}
              className={inputCls(errors.durationYears)}
            />
          </Field>
          <Field label="Pays (ISO2)" error={errors.countryRef}>
            <input
              type="text"
              maxLength={2}
              value={values.countryRef}
              onChange={(e) => update("countryRef", e.target.value.toUpperCase())}
              className={inputCls(errors.countryRef)}
            />
          </Field>
        </Grid3>
        <Field label="Description" error={errors.description}>
          <textarea
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className={`${inputCls(errors.description)} resize-y`}
          />
        </Field>
      </Section>

      <Section title="École">
        <SchoolAutocomplete
          name={values.schoolName}
          city={values.schoolCity}
          uai={values.schoolUai ?? ""}
          onPick={pickSchool}
          onClear={clearSchool}
        />
        <Grid2>
          <Field label="Nom de l'école" error={errors.schoolName} required>
            <input
              type="text"
              value={values.schoolName}
              onChange={(e) => update("schoolName", e.target.value)}
              placeholder="Lycée Magendie"
              className={inputCls(errors.schoolName)}
            />
          </Field>
          <Field label="Ville" error={errors.schoolCity} required>
            <input
              type="text"
              value={values.schoolCity}
              onChange={(e) => update("schoolCity", e.target.value)}
              placeholder="Bordeaux"
              className={inputCls(errors.schoolCity)}
            />
          </Field>
        </Grid2>
        <Grid3>
          <Field label="Type" error={errors.schoolType}>
            <input
              type="text"
              value={values.schoolType ?? ""}
              onChange={(e) => update("schoolType", e.target.value)}
              placeholder="lycée, IUT, école d'ingé…"
              className={inputCls(errors.schoolType)}
            />
          </Field>
          <Field label="UAI" error={errors.schoolUai} hint="ex: 0750553U">
            <input
              type="text"
              value={values.schoolUai ?? ""}
              onChange={(e) => update("schoolUai", e.target.value.toUpperCase())}
              maxLength={8}
              className={inputCls(errors.schoolUai)}
            />
          </Field>
          <Field label="Site web" error={errors.schoolWebsiteUrl}>
            <input
              type="url"
              value={values.schoolWebsiteUrl ?? ""}
              onChange={(e) => update("schoolWebsiteUrl", e.target.value)}
              placeholder="https://…"
              className={inputCls(errors.schoolWebsiteUrl)}
            />
          </Field>
        </Grid3>
      </Section>

      <Section title="Langue · coût · admission">
        <Grid3>
          <Field label="Langue d'enseignement" error={errors.languageCode}>
            <input
              type="text"
              value={values.languageCode}
              onChange={(e) => update("languageCode", e.target.value.toLowerCase())}
              placeholder="fr"
              className={inputCls(errors.languageCode)}
            />
          </Field>
          <Field label="Niveau CECRL requis" error={errors.languageMinLevel}>
            <select
              value={values.languageMinLevel}
              onChange={(e) => update("languageMinLevel", e.target.value as ProgramFormInput["languageMinLevel"])}
              className={selectCls(errors.languageMinLevel)}
            >
              {CEFR_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Coût/an (€)" error={errors.costPerYear}>
            <input
              type="number"
              min={0}
              value={values.costPerYear}
              onChange={(e) => update("costPerYear", Number(e.target.value))}
              className={inputCls(errors.costPerYear)}
            />
          </Field>
        </Grid3>
        <Grid3>
          <Field label="Plateforme d'admission" error={errors.admissionPlatform}>
            <select
              value={values.admissionPlatform}
              onChange={(e) => update("admissionPlatform", e.target.value as ProgramFormInput["admissionPlatform"])}
              className={selectCls(errors.admissionPlatform)}
            >
              {ADMISSION_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ouverture candidatures" error={errors.applicationOpens} hint="YYYY-MM-DD">
            <input
              type="text"
              value={values.applicationOpens ?? ""}
              onChange={(e) => update("applicationOpens", e.target.value)}
              placeholder="2026-01-15"
              className={inputCls(errors.applicationOpens)}
            />
          </Field>
          <Field label="Clôture candidatures" error={errors.applicationCloses} hint="YYYY-MM-DD">
            <input
              type="text"
              value={values.applicationCloses ?? ""}
              onChange={(e) => update("applicationCloses", e.target.value)}
              placeholder="2026-03-31"
              className={inputCls(errors.applicationCloses)}
            />
          </Field>
        </Grid3>
        <Grid2>
          <Field label="Frais de dossier (€)" error={errors.applicationFee}>
            <input
              type="number"
              min={0}
              value={values.applicationFee ?? ""}
              onChange={(e) =>
                update("applicationFee", e.target.value === "" ? undefined : Number(e.target.value))
              }
              className={inputCls(errors.applicationFee)}
            />
          </Field>
          <Field label="Alternance possible" error={errors.workStudy}>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={values.workStudy}
                onChange={(e) => update("workStudy", e.target.checked)}
              />
              Oui, ce programme accepte l'alternance
            </label>
          </Field>
        </Grid2>
      </Section>

      <Section title="Diplôme délivré">
        <Grid2>
          <Field label="Code diplôme" error={errors.resultingDiplomaCode} required>
            <input
              type="text"
              value={values.resultingDiplomaCode}
              onChange={(e) => update("resultingDiplomaCode", e.target.value)}
              placeholder="BTS_SIO_SISR"
              className={inputCls(errors.resultingDiplomaCode)}
            />
          </Field>
          <Field label="Libellé diplôme" error={errors.resultingDiplomaLabel} required>
            <input
              type="text"
              value={values.resultingDiplomaLabel}
              onChange={(e) => update("resultingDiplomaLabel", e.target.value)}
              placeholder="BTS Services Informatiques aux Organisations"
              className={inputCls(errors.resultingDiplomaLabel)}
            />
          </Field>
        </Grid2>
      </Section>

      <Section title="Listes structurées">
        <TagInput
          label="Diplômes acceptés en entrée"
          values={values.acceptedDiplomas ?? []}
          onChange={(v) => update("acceptedDiplomas", v)}
          suggestions={diplomaCodes}
          hint="autocomplete depuis le référentiel DIPLOMAS"
        />
        <TagInput
          label="Domaines"
          values={values.domains ?? []}
          onChange={(v) => update("domains", v)}
          hint="ex: Tech, Cyber, Data"
        />
        <TagInput
          label="Métiers de sortie"
          values={values.outcomesJobs ?? []}
          onChange={(v) => update("outcomesJobs", v)}
          suggestions={jobLabels}
          hint="autocomplete depuis la table jobs"
        />
        <TagInput
          label="Poursuite d'études possibles"
          values={values.outcomesNextLevels ?? []}
          onChange={(v) => update("outcomesNextLevels", v)}
          suggestions={nextLevelOptions}
          hint="niveaux ProgramLevel"
        />
        <TagInput
          label="Reconnaissance internationale (ISO2)"
          values={values.internationallyRecognizedIn ?? []}
          onChange={(v) => update("internationallyRecognizedIn", v)}
          hint="ex: FR, BE, CH, CA"
        />
        <TagInput
          label="Documents requis"
          values={values.documents ?? []}
          onChange={(v) => update("documents", v)}
          hint="ex: CV, Lettre de motivation, Bulletins"
        />
        <TagInput
          label="Étapes optionnelles"
          values={values.optionalSteps ?? []}
          onChange={(v) => update("optionalSteps", v)}
          hint="ex: Entretien de motivation"
        />
      </Section>

      <Section title="Curation">
        <Field label="Statut">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={values.isCurated}
              onChange={(e) => update("isCurated", e.target.checked)}
            />
            Cette fiche est <strong>curée</strong> (visible par les utilisateurs)
          </label>
        </Field>
      </Section>

      {/* Action bar */}
      <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-white border-t border-gray-200 flex flex-wrap items-center gap-2">
        <div className="hidden md:flex items-center gap-3 text-[10px] text-gray-400 mr-2">
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-600">Ctrl+S</kbd>{" "}
            enregistrer
          </span>
          {isEdit && (
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-600">Ctrl+D</kbd>{" "}
              dupliquer
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#ee7768] hover:bg-[#e9614f] disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Save size={14} />
          {submitting ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer la fiche"}
        </button>
        <Link
          href="/admin/programs"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <X size={14} />
          Annuler
        </Link>
        {isEdit && (
          <>
            <Link
              href={`/admin/programs/new?from=${encodeURIComponent(programId!)}`}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Copy size={14} />
              Dupliquer
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </>
        )}
      </div>
    </form>
  );
}

// ─────────── UI primitives ───────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-700">
          {label} {required && <span className="text-red-400">*</span>}
        </span>
        {hint && !error && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-[11px] text-red-300">{error}</div>}
    </label>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>;
}

const baseInput =
  "w-full px-2.5 py-1.5 bg-gray-50 border rounded text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-500";
function inputCls(error?: string) {
  return `${baseInput} ${error ? "border-red-500/50" : "border-gray-200"}`;
}
function selectCls(error?: string) {
  return `${inputCls(error)}`;
}

function TagInput({
  label,
  values,
  onChange,
  hint,
  suggestions,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  function addValue(v: string) {
    const trimmed = v.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      setDraft("");
      setOpen(false);
      return;
    }
    onChange([...values, trimmed]);
    setDraft("");
    setOpen(false);
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  const filtered = (() => {
    if (!suggestions || !suggestions.length) return [];
    const q = draft.trim().toLowerCase();
    const pool = suggestions.filter((s) => !values.includes(s));
    if (!q) return pool.slice(0, 8);
    return pool.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  })();

  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-700">{label}</span>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-xs text-gray-900 rounded"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-500 hover:text-gray-900"
              aria-label={`Retirer ${v}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue(draft);
            }
          }}
          placeholder="Tape pour chercher / Entrée pour ajouter…"
          className={baseInput + " border-gray-200"}
        />
        <button
          type="button"
          onClick={() => addValue(draft)}
          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-900"
        >
          + Ajouter
        </button>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 max-h-[200px] overflow-y-auto bg-[#1a1d24] border border-gray-300 rounded-md shadow-xl z-10">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addValue(s);
              }}
              className="block w-full text-left px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
