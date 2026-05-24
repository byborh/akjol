"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { StepBar } from "../../components/StepBar";
import { COUNTRIES } from "../../data/countries";
import { CEFR_LEVELS, LANGUAGES, CERTIFICATES } from "../../data/languages";
import { getDiplomasForCountry } from "../../data/diplomas";
import { usePassportStore } from "../../store/passport-store";
import type { CEFR, Passport } from "../../types";

const EMPTY_PASSPORT: Passport = {
  origin: { country: "", languages: [] },
  currentDiploma: null,
  certificates: [],
  constraints: {},
  aspiration: { domains: [], jobs: [], openToSurprise: true },
};

const TOTAL_STEPS = 5;

const DOMAINS = [
  "Tech",
  "Santé",
  "Droit",
  "Arts",
  "Affaires",
  "Sciences",
  "Sciences humaines",
  "Industrie",
];

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setPassport = usePassportStore((s) => s.setPassport);
  const reset = usePassportStore((s) => s.reset);
  const initial = usePassportStore((s) => s.passport);
  const isNewUser = params.get("newUser") === "1";

  // Nouveau compte (signup Google ou password) : on wipe d'éventuelles
  // données persona laissées en localStorage par une session anonyme
  // précédente (ex: l'user avait cliqué « Tester comme Léa » avant de
  // créer son compte).
  useEffect(() => {
    if (isNewUser) {
      reset();
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Passport>(isNewUser ? EMPTY_PASSPORT : initial);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(draft.origin.country);
    if (step === 2) return Boolean(draft.currentDiploma);
    if (step === 3) return draft.origin.languages.length > 0;
    return true;
  }, [step, draft]);

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else finish();
  }
  function back() {
    if (step > 1) setStep(step - 1);
    else router.push("/");
  }
  function finish() {
    setPassport(draft);
    router.push("/explore");
  }

  function loadLeaPreset() {
    setDraft({
      origin: {
        country: "FR",
        languages: [
          { code: "fr", level: "C2" },
          { code: "en", level: "B2" },
        ],
      },
      currentDiploma: {
        countryRef: "FR",
        code: "BTS_SIO_SISR",
        label: "BTS SIO option SISR",
        status: "in_progress",
        yearExpected: 2026,
        grade: { value: 13.4, scaleMax: 20 },
      },
      certificates: [],
      constraints: { maxBudgetPerYear: 10000, workStudyPreferred: true },
      aspiration: { domains: ["Tech"], jobs: [], openToSurprise: false },
    });
  }

  function loadLanaPreset() {
    setDraft({
      origin: {
        country: "MY",
        languages: [
          { code: "ms", level: "C2" },
          { code: "en", level: "C1" },
          { code: "fr", level: "B1" },
        ],
      },
      currentDiploma: {
        countryRef: "MY",
        code: "STPM",
        label: "Sijil Tinggi Persekolahan Malaysia",
        status: "in_progress",
        yearExpected: 2026,
        grade: { value: 3.6, scaleMax: 4 },
      },
      certificates: [],
      constraints: { maxBudgetPerYear: 25000, needsScholarship: true },
      aspiration: { domains: ["Santé", "Sciences"], jobs: [], openToSurprise: false },
    });
  }

  return (
    <PageContainer className="max-w-xl pt-6">
      <h1 className="sr-only">Construire ton passeport-éducation</h1>
      {step === 1 ? (
        <div className="mb-6 rounded-xl bg-[#ee776810] border border-[#ee7768]/20 px-4 py-3">
          <p className="text-sm text-[#1a1d24] leading-relaxed">
            <strong className="text-[#a8463a]">Le passeport</strong>, c'est ton point de départ :
            d'où tu viens, où tu en es, ce que tu veux. AkJol te montre les chemins possibles à
            partir de là.
          </p>
        </div>
      ) : null}

      <StepBar current={step} total={TOTAL_STEPS} />
      <div className="mt-2 flex items-center justify-between text-xs gap-3">
        <span className="text-[#1a1d24]/50">Étape {step} sur {TOTAL_STEPS}</span>
        {step === 1 ? (
          <div className="inline-flex items-center gap-3">
            <span className="text-[#1a1d24]/40">Démo :</span>
            <button
              onClick={loadLeaPreset}
              className="inline-flex items-center gap-1 text-[#ee7768] hover:underline font-medium"
            >
              <Sparkles size={12} /> 🇫🇷 Léa
            </button>
            <button
              onClick={loadLanaPreset}
              className="inline-flex items-center gap-1 text-[#ee7768] hover:underline font-medium"
            >
              <Sparkles size={12} /> 🇲🇾 Lana
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        {step === 1 ? (
          <StepCountry draft={draft} setDraft={setDraft} />
        ) : step === 2 ? (
          <StepDiploma draft={draft} setDraft={setDraft} />
        ) : step === 3 ? (
          <StepLanguages draft={draft} setDraft={setDraft} />
        ) : step === 4 ? (
          <StepConstraints draft={draft} setDraft={setDraft} />
        ) : (
          <StepAspiration draft={draft} setDraft={setDraft} />
        )}
      </div>

      <div className="flex items-center justify-between mt-10">
        <button
          onClick={back}
          className="inline-flex items-center gap-1 text-[#1a1d24]/60 hover:text-[#1a1d24] text-sm"
        >
          <ArrowLeft size={14} /> Retour
        </button>
        <button
          onClick={next}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "#ee7768" }}
        >
          {step < TOTAL_STEPS ? "Continuer" : "Voir mes possibilités"}
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push("/explore")}
          className="text-[12px] text-[#1a1d24]/45 hover:text-[#1a1d24]/70 hover:underline"
        >
          Passer pour l'instant — explorer sans passeport
        </button>
      </div>
    </PageContainer>
  );
}

function StepCountry({ draft, setDraft }: { draft: Passport; setDraft: (p: Passport) => void }) {
  return (
    <Card title="D'où tu pars ?" hint="On t'évitera de chercher des programmes incompatibles avec ton diplôme actuel.">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COUNTRIES.map((c) => {
          const active = draft.origin.country === c.code;
          return (
            <button
              key={c.code}
              onClick={() => setDraft({ ...draft, origin: { ...draft.origin, country: c.code } })}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition"
              style={{
                borderColor: active ? "#ee7768" : "#0000000d",
                background: active ? "#ee776810" : "#fff",
              }}
            >
              <span className="text-xl">{c.flag}</span>
              <span className="text-sm font-medium">{c.name}</span>
              {active ? <Check size={14} className="ml-auto text-[#ee7768]" /> : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function StepDiploma({ draft, setDraft }: { draft: Passport; setDraft: (p: Passport) => void }) {
  const country = draft.origin.country;
  const list = getDiplomasForCountry(country);
  return (
    <Card title="Où tu en es dans tes études ?" hint="Sélectionne ton diplôme actuel ou en cours.">
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-[#1a1d24]/60">Pas encore de diplômes modélisés pour ce pays.</p>
        ) : null}
        {list.map((d) => {
          const active = draft.currentDiploma?.code === d.code;
          return (
            <button
              key={d.code}
              onClick={() =>
                setDraft({
                  ...draft,
                  currentDiploma: {
                    countryRef: country,
                    code: d.code,
                    label: d.nativeName,
                    status: draft.currentDiploma?.status ?? "in_progress",
                    yearExpected: draft.currentDiploma?.yearExpected ?? 2026,
                    grade: draft.currentDiploma?.grade,
                  },
                })
              }
              className="block w-full px-4 py-3 rounded-lg border text-left transition"
              style={{
                borderColor: active ? "#ee7768" : "#0000000d",
                background: active ? "#ee776810" : "#fff",
              }}
            >
              <div className="font-medium text-[#1a1d24]">{d.nativeName}</div>
              <div className="text-xs text-[#1a1d24]/60">{d.translated}</div>
            </button>
          );
        })}
      </div>

      {draft.currentDiploma ? (
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <div>
            <Label>Statut</Label>
            <select
              value={draft.currentDiploma.status}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  currentDiploma: {
                    ...draft.currentDiploma!,
                    status: e.target.value as "in_progress" | "obtained",
                  },
                })
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm"
            >
              <option value="in_progress">En cours</option>
              <option value="obtained">Obtenu</option>
            </select>
          </div>
          <div>
            <Label>Année (réelle ou prévue)</Label>
            <input
              type="number"
              value={draft.currentDiploma.yearExpected ?? new Date().getFullYear()}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  currentDiploma: { ...draft.currentDiploma!, yearExpected: Number(e.target.value) },
                })
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
          <div>
            <Label>Moyenne (optionnel)</Label>
            <input
              type="number"
              step="0.1"
              placeholder="ex: 13.4"
              value={draft.currentDiploma.grade?.value ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? undefined : Number(e.target.value);
                const scale = draft.currentDiploma!.grade?.scaleMax ?? 20;
                setDraft({
                  ...draft,
                  currentDiploma: {
                    ...draft.currentDiploma!,
                    grade: v == null ? undefined : { value: v, scaleMax: scale },
                  },
                });
              }}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <div className="text-[10px] text-[#1a1d24]/50 mt-1">
              Échelle locale ({draft.currentDiploma.grade?.scaleMax ?? 20})
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function StepLanguages({ draft, setDraft }: { draft: Passport; setDraft: (p: Passport) => void }) {
  function toggleLang(code: string) {
    const list = draft.origin.languages;
    if (list.find((l) => l.code === code)) {
      setDraft({
        ...draft,
        origin: { ...draft.origin, languages: list.filter((l) => l.code !== code) },
      });
    } else {
      setDraft({
        ...draft,
        origin: { ...draft.origin, languages: [...list, { code, level: "B1" }] },
      });
    }
  }
  function setLevel(code: string, level: CEFR) {
    setDraft({
      ...draft,
      origin: {
        ...draft.origin,
        languages: draft.origin.languages.map((l) => (l.code === code ? { ...l, level } : l)),
      },
    });
  }

  return (
    <Card title="Tu parles quoi, à quel niveau ?" hint="Le niveau CECRL conditionne l'accès aux programmes étrangers.">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {LANGUAGES.map((l) => {
          const sel = draft.origin.languages.find((x) => x.code === l.code);
          const active = Boolean(sel);
          return (
            <button
              key={l.code}
              onClick={() => toggleLang(l.code)}
              className="px-3 py-2 rounded-lg border text-left text-sm transition"
              style={{
                borderColor: active ? "#ee7768" : "#0000000d",
                background: active ? "#ee776810" : "#fff",
              }}
            >
              {l.name}
            </button>
          );
        })}
      </div>
      {draft.origin.languages.length > 0 ? (
        <div className="space-y-2">
          {draft.origin.languages.map((l) => (
            <div key={l.code} className="flex items-center gap-3 rounded-lg bg-white border border-black/5 px-3 py-2">
              <span className="text-sm font-medium flex-1">
                {LANGUAGES.find((lang) => lang.code === l.code)?.name}
              </span>
              <div className="flex gap-1">
                {CEFR_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(l.code, lvl)}
                    className="px-2 py-1 rounded text-[11px] font-medium transition"
                    style={{
                      background: l.level === lvl ? "#ee7768" : "#0000000d",
                      color: l.level === lvl ? "#fff" : "#1a1d24",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <Label>Certificat (optionnel)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {CERTIFICATES.map((cert) => {
            const existing = draft.certificates.find((c) => c.code === cert.code);
            return (
              <div
                key={cert.code}
                className="flex items-center gap-2 rounded-lg border border-black/5 bg-white px-2 py-1.5"
              >
                <span className="text-xs flex-1">{cert.label}</span>
                <input
                  type="number"
                  placeholder="Score"
                  value={existing?.score ?? ""}
                  onChange={(e) => {
                    const score = Number(e.target.value);
                    const without = draft.certificates.filter((c) => c.code !== cert.code);
                    setDraft({
                      ...draft,
                      certificates: e.target.value === "" ? without : [...without, { code: cert.code, score }],
                    });
                  }}
                  className="w-16 px-1.5 py-1 rounded border border-black/10 text-[11px]"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function StepConstraints({ draft, setDraft }: { draft: Passport; setDraft: (p: Passport) => void }) {
  const c = draft.constraints;
  return (
    <Card
      title="Qu'est-ce qui pourrait te freiner ?"
      hint="Tout est optionnel — tu peux passer cette étape si tu n'as pas de contraintes fortes."
    >
      <div className="space-y-5">
        <div>
          <Label>Budget annuel max (frais scolarité)</Label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min={0}
              max={50000}
              step={500}
              value={c.maxBudgetPerYear ?? 0}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  constraints: { ...c, maxBudgetPerYear: Number(e.target.value) || undefined },
                })
              }
              className="flex-1 accent-[#ee7768]"
            />
            <span
              className="text-sm font-medium tabular-nums w-24 text-right"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {c.maxBudgetPerYear ? `${c.maxBudgetPerYear.toLocaleString("fr-FR")} €` : "Aucun"}
            </span>
          </div>
        </div>

        <div>
          <Label>Durée maximale d'études (années)</Label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min={1}
              max={8}
              value={c.maxDurationYears ?? 8}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  constraints: { ...c, maxDurationYears: Number(e.target.value) },
                })
              }
              className="flex-1 accent-[#ee7768]"
            />
            <span
              className="text-sm font-medium tabular-nums w-24 text-right"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {c.maxDurationYears ?? 8} an{(c.maxDurationYears ?? 8) > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <Toggle
          label="Je préfère l'alternance (rémunérée)"
          checked={c.workStudyPreferred ?? false}
          onChange={(v) => setDraft({ ...draft, constraints: { ...c, workStudyPreferred: v } })}
        />
        <Toggle
          label="J'ai besoin d'une bourse pour partir"
          checked={c.needsScholarship ?? false}
          onChange={(v) => setDraft({ ...draft, constraints: { ...c, needsScholarship: v } })}
        />
      </div>
    </Card>
  );
}

function StepAspiration({ draft, setDraft }: { draft: Passport; setDraft: (p: Passport) => void }) {
  const open = draft.aspiration.openToSurprise;
  return (
    <Card
      title="Tu vises quoi (même approximativement) ?"
      hint="Si tu ne sais pas encore, c'est normal — choisis ‘Surprends-moi’."
    >
      <button
        onClick={() =>
          setDraft({
            ...draft,
            aspiration: { ...draft.aspiration, openToSurprise: !open },
          })
        }
        className="w-full px-4 py-3 rounded-xl text-left transition"
        style={{
          background: open ? "#ee7768" : "#fff",
          color: open ? "#fff" : "#1a1d24",
          border: open ? "none" : "1px solid #0000000d",
        }}
      >
        <div className="text-sm font-medium">Je ne sais pas, surprends-moi ✨</div>
        <div className={`text-xs ${open ? "text-white/80" : "text-[#1a1d24]/60"} mt-0.5`}>
          AkJol va te montrer une variété de trajectoires inattendues.
        </div>
      </button>

      <div className="mt-5">
        <Label>Domaines qui t'intéressent</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {DOMAINS.map((d) => {
            const active = draft.aspiration.domains.includes(d);
            return (
              <button
                key={d}
                onClick={() =>
                  setDraft({
                    ...draft,
                    aspiration: {
                      ...draft.aspiration,
                      domains: active
                        ? draft.aspiration.domains.filter((x) => x !== d)
                        : [...draft.aspiration.domains, d],
                    },
                  })
                }
                className="px-3 py-1.5 rounded-full text-sm transition"
                style={{
                  background: active ? "#ee7768" : "#0000000a",
                  color: active ? "#fff" : "#1a1d24",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium text-[#1a1d24] tracking-tight">{title}</h2>
      {hint ? <p className="text-sm text-[#1a1d24]/60 mt-1">{hint}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium">
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border bg-white"
      style={{ borderColor: checked ? "#ee7768" : "#0000000d" }}
    >
      <span className="text-sm text-[#1a1d24]">{label}</span>
      <span
        className="inline-block w-9 h-5 rounded-full relative transition-colors"
        style={{ background: checked ? "#ee7768" : "#0000001a" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "18px" : "2px" }}
        />
      </span>
    </button>
  );
}
