"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Trash2, X } from "lucide-react";
import {
  SchoolFormSchema,
  SCHOOL_TYPES,
  emptySchool,
  type SchoolFormInput,
} from "../../../lib/admin/school-schema";

type Props = {
  initial?: SchoolFormInput;
  /** UAI courant si édition. L'UAI n'est pas modifiable (PK), juste affiché. */
  uai?: string;
};

export function SchoolForm({ initial, uai }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<SchoolFormInput>(initial ?? emptySchool());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const isEdit = Boolean(uai);

  function update<K extends keyof SchoolFormInput>(key: K, value: SchoolFormInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    const parsed = SchoolFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join(".")] = issue.message;
      setErrors(next);
      setGlobalError(`${parsed.error.issues.length} champ(s) invalide(s)`);
      return;
    }
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/admin/schools/${encodeURIComponent(uai!)}` : "/api/admin/schools";
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
      router.push("/admin/schools");
      router.refresh();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm(`Supprimer l'établissement "${values.name}" ?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/schools/${encodeURIComponent(uai!)}`, { method: "DELETE" });
      if (!res.ok) {
        setGlobalError(`Erreur ${res.status}`);
        return;
      }
      router.push("/admin/schools");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {globalError}
        </div>
      )}

      <Section title="Identité">
        <Grid2>
          <Field label="UAI" error={errors.uai} required hint="7 chiffres + 1 lettre majuscule (ex: 0750553U)">
            <input
              type="text"
              value={values.uai}
              onChange={(e) => update("uai", e.target.value.toUpperCase())}
              disabled={isEdit}
              maxLength={8}
              placeholder="0750553U"
              className={inputCls(errors.uai) + (isEdit ? " opacity-60 cursor-not-allowed" : "")}
            />
          </Field>
          <Field label="Type" error={errors.type}>
            <select
              value={values.type ?? ""}
              onChange={(e) => update("type", e.target.value)}
              className={inputCls(errors.type)}
            >
              <option value="">— Choisir —</option>
              {SCHOOL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </Grid2>
        <Field label="Nom de l'établissement" error={errors.name} required>
          <input
            type="text"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="IUT Paris-Rives de Seine"
            className={inputCls(errors.name)}
          />
        </Field>
      </Section>

      <Section title="Localisation">
        <Grid2>
          <Field label="Ville" error={errors.city} required>
            <input
              type="text"
              value={values.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Paris"
              className={inputCls(errors.city)}
            />
          </Field>
          <Field label="Code postal" error={errors.postalCode}>
            <input
              type="text"
              value={values.postalCode ?? ""}
              onChange={(e) => update("postalCode", e.target.value)}
              maxLength={5}
              placeholder="75013"
              className={inputCls(errors.postalCode)}
            />
          </Field>
        </Grid2>
        <Field label="Région" error={errors.region}>
          <input
            type="text"
            value={values.region ?? ""}
            onChange={(e) => update("region", e.target.value)}
            placeholder="Île-de-France"
            className={inputCls(errors.region)}
          />
        </Field>
        <Grid2>
          <Field label="Latitude" error={errors.lat} hint="degrés décimaux (ex: 48.8324)">
            <input
              type="number"
              step="0.000001"
              value={values.lat ?? ""}
              onChange={(e) => update("lat", e.target.value === "" ? undefined : Number(e.target.value))}
              className={inputCls(errors.lat)}
            />
          </Field>
          <Field label="Longitude" error={errors.lng}>
            <input
              type="number"
              step="0.000001"
              value={values.lng ?? ""}
              onChange={(e) => update("lng", e.target.value === "" ? undefined : Number(e.target.value))}
              className={inputCls(errors.lng)}
            />
          </Field>
        </Grid2>
      </Section>

      <Section title="Lien">
        <Field label="Site web" error={errors.websiteUrl}>
          <input
            type="url"
            value={values.websiteUrl ?? ""}
            onChange={(e) => update("websiteUrl", e.target.value)}
            placeholder="https://…"
            className={inputCls(errors.websiteUrl)}
          />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-white border-t border-gray-200 flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#ee7768] hover:bg-[#e9614f] disabled:opacity-50 text-white text-sm font-medium rounded-md"
        >
          <Save size={14} />
          {submitting ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer l'établissement"}
        </button>
        <Link href="/admin/schools" className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
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
const baseInput = "w-full px-2.5 py-1.5 bg-gray-50 border rounded text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-500";
function inputCls(error?: unknown) { return `${baseInput} ${error ? "border-red-300" : "border-gray-200"}`; }
