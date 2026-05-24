"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Trash2, X } from "lucide-react";
import { JobFormSchema, emptyJob, type JobFormInput } from "../../../lib/admin/job-schema";

type Props = {
  initial?: JobFormInput;
  jobId?: string;
};

export function JobForm({ initial, jobId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<JobFormInput>(initial ?? emptyJob());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const isEdit = Boolean(jobId);

  function update<K extends keyof JobFormInput>(key: K, value: JobFormInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  // Salary handlers (first entry only, simplified for V1)
  function updateSalaryFR(field: "median" | "currency", v: string | number) {
    const list = values.salary ?? [];
    const first = list[0] ?? { country: "FR", median: 0, currency: "EUR" };
    const newFirst = { ...first, [field]: field === "median" ? Number(v) : v };
    setValues((s) => ({ ...s, salary: [newFirst, ...list.slice(1)] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    const parsed = JobFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] = issue.message;
      setErrors(next);
      setGlobalError(`${parsed.error.issues.length} champ(s) invalide(s)`);
      return;
    }
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/admin/jobs/${encodeURIComponent(jobId!)}` : "/api/admin/jobs";
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
      router.push("/admin/jobs");
      router.refresh();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm(`Supprimer le métier "${values.label}" ?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/jobs/${encodeURIComponent(jobId!)}`, { method: "DELETE" });
      if (!res.ok) {
        setGlobalError(`Erreur ${res.status}`);
        return;
      }
      router.push("/admin/jobs");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const salaryFR = values.salary?.[0] ?? { country: "FR", median: 0, currency: "EUR" };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {globalError}
        </div>
      )}

      <Section title="Identité">
        <Grid2>
          <Field label="Code" error={errors.code} required hint="ROME France Travail ou interne">
            <input
              type="text"
              value={values.code}
              onChange={(e) => update("code", e.target.value)}
              placeholder="M1805-FRONTEND"
              className={inputCls(errors.code)}
            />
          </Field>
          <Field label="Libellé" error={errors.label} required>
            <input
              type="text"
              value={values.label}
              onChange={(e) => update("label", e.target.value)}
              placeholder="Développeur frontend"
              className={inputCls(errors.label)}
            />
          </Field>
        </Grid2>
        <Field label="Risque d'automatisation IA (0-100)" error={errors.riskAutomation} hint="estimation prospective à 5 ans">
          <input
            type="number"
            min={0}
            max={100}
            value={values.riskAutomation}
            onChange={(e) => update("riskAutomation", Number(e.target.value))}
            className={inputCls(errors.riskAutomation)}
          />
        </Field>
      </Section>

      <Section title="Salaire médian France (junior)">
        <Grid3>
          <Field label="Médian" error={errors["salary.0.median"]}>
            <input
              type="number"
              min={0}
              value={salaryFR.median}
              onChange={(e) => updateSalaryFR("median", e.target.value)}
              className={inputCls()}
            />
          </Field>
          <Field label="Devise">
            <input
              type="text"
              value={salaryFR.currency}
              onChange={(e) => updateSalaryFR("currency", e.target.value)}
              placeholder="EUR"
              className={inputCls()}
            />
          </Field>
          <Field label="Pays" hint="ISO2/3">
            <input
              type="text"
              value={salaryFR.country}
              onChange={(e) => {
                const list = values.salary ?? [];
                const first = list[0] ?? { country: "FR", median: 0, currency: "EUR" };
                setValues((s) => ({ ...s, salary: [{ ...first, country: e.target.value }, ...list.slice(1)] }));
              }}
              className={inputCls()}
            />
          </Field>
        </Grid3>
      </Section>

      <Section title="Listes structurées">
        <TagInput label="Domaines" values={values.domains ?? []} onChange={(v) => update("domains", v)} hint="ex: Tech, Cyber, Data" />
        <TagInput label="Régions top hiring" values={values.regionsTopHiring ?? []} onChange={(v) => update("regionsTopHiring", v)} hint="ex: Île-de-France" />
        <TagInput label="Tâches quotidiennes" values={values.dailyTasks ?? []} onChange={(v) => update("dailyTasks", v)} />
        <TagInput label="Diplômes requis" values={values.requiresDiplomas ?? []} onChange={(v) => update("requiresDiplomas", v)} hint="codes diplômes : DUT_INFO, MASTER_IA…" />
        <TagInput label="Mots-clés (reverse-routing)" values={values.matchKeywords ?? []} onChange={(v) => update("matchKeywords", v)} hint="ex: react, node, typescript" />
      </Section>

      <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-white border-t border-gray-200 flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#ee7768] hover:bg-[#e9614f] disabled:opacity-50 text-white text-sm font-medium rounded-md"
        >
          <Save size={14} />
          {submitting ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le métier"}
        </button>
        <Link href="/admin/jobs" className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
          <X size={14} /> Annuler
        </Link>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:text-red-800 hover:bg-red-50 rounded-md"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>
    </form>
  );
}

// ─────────── UI primitives (réutilisables, copiées du ProgramForm) ───────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{title}</h2>
      {children}
    </section>
  );
}
function Field({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-700">{label} {required && <span className="text-red-500">*</span>}</span>
        {hint && !error && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-[11px] text-red-700">{error}</div>}
    </label>
  );
}
function Grid2({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>; }
function Grid3({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>; }
const baseInput = "w-full px-2.5 py-1.5 bg-gray-50 border rounded text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-500";
function inputCls(error?: string) { return `${baseInput} ${error ? "border-red-300" : "border-gray-200"}`; }

function TagInput({ label, values, onChange, hint }: { label: string; values: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v || values.includes(v)) { setDraft(""); return; }
    onChange([...values, v]); setDraft("");
  }
  function remove(i: number) { onChange(values.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-700">{label}</span>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-xs text-gray-900 rounded">
            {v}
            <button type="button" onClick={() => remove(i)} className="text-gray-500 hover:text-gray-900"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Tape puis Entrée…"
          className={baseInput + " border-gray-200"}
        />
        <button type="button" onClick={add} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-900">+ Ajouter</button>
      </div>
    </div>
  );
}
