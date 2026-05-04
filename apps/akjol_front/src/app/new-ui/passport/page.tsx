"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { PageContainer } from "../../../new-ui/components/PageContainer";
import { findCountry } from "../../../new-ui/data/countries";
import { findProgram } from "../../../new-ui/data/programs";
import { usePassportStore } from "../../../new-ui/store/passport-store";

const TABS = ["Mon profil", "Mon plan", "Historique"] as const;
type Tab = (typeof TABS)[number];

export default function PassportPage() {
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const savedPlan = usePassportStore((s) => s.savedPlan);
  const reset = usePassportStore((s) => s.reset);
  const toggleSaved = usePassportStore((s) => s.toggleSaved);

  const [tab, setTab] = useState<Tab>("Mon profil");
  const country = findCountry(passport.origin.country);

  if (!isComplete) {
    return (
      <PageContainer className="max-w-xl text-center pt-16">
        <h2 className="text-2xl font-medium tracking-tight">Pas encore de passeport</h2>
        <p className="text-[#1a1d24]/70 mt-2">
          Construis ton passeport-éducation pour personnaliser tes recommandations.
        </p>
        <Link
          href="/new-ui/onboarding"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 mt-6 font-medium text-white"
          style={{ background: "#ee7768" }}
        >
          Construire mon passeport
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-3xl font-medium tracking-tight">Mon passeport</h1>
      <p className="text-sm text-[#1a1d24]/60 mt-1">
        Édite ton profil, suis ton plan, retrouve ton historique.
      </p>

      <div className="flex gap-1 mt-6 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium relative transition"
            style={{
              color: tab === t ? "#ee7768" : "#1a1d2480",
            }}
          >
            {t}
            {tab === t ? (
              <span
                className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full"
                style={{ background: "#ee7768" }}
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Mon profil" ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Pays d'origine">
              <span className="text-2xl mr-2">{country?.flag}</span>
              {country?.name ?? passport.origin.country}
            </Field>
            <Field label="Diplôme actuel">
              <div className="font-medium">{passport.currentDiploma?.label}</div>
              <div className="text-xs text-[#1a1d24]/60 mt-0.5">
                {passport.currentDiploma?.status === "in_progress" ? "En cours" : "Obtenu"}
                {passport.currentDiploma?.yearExpected ? ` · ${passport.currentDiploma.yearExpected}` : ""}
                {passport.currentDiploma?.grade
                  ? ` · ${passport.currentDiploma.grade.value}/${passport.currentDiploma.grade.scaleMax}`
                  : ""}
              </div>
            </Field>
            <Field label="Langues">
              <div className="flex flex-wrap gap-1.5">
                {passport.origin.languages.map((l) => (
                  <span
                    key={l.code}
                    className="px-2 py-0.5 rounded bg-black/5 text-[12px]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {l.code.toUpperCase()} · {l.level}
                  </span>
                ))}
              </div>
            </Field>
            <Field label="Contraintes">
              <ul className="text-sm space-y-0.5">
                {passport.constraints.maxBudgetPerYear ? (
                  <li>Budget ≤ {passport.constraints.maxBudgetPerYear.toLocaleString("fr-FR")} €/an</li>
                ) : null}
                {passport.constraints.maxDurationYears ? (
                  <li>Durée ≤ {passport.constraints.maxDurationYears} ans</li>
                ) : null}
                {passport.constraints.workStudyPreferred ? <li>Préfère l'alternance</li> : null}
                {passport.constraints.needsScholarship ? <li>Bourse nécessaire</li> : null}
              </ul>
            </Field>
            {passport.aspiration.domains.length ? (
              <Field label="Domaines visés">
                <div className="flex flex-wrap gap-1.5">
                  {passport.aspiration.domains.map((d) => (
                    <span key={d} className="px-2 py-0.5 rounded-full bg-[#ee776815] text-[#a8463a] text-[12px]">
                      {d}
                    </span>
                  ))}
                </div>
              </Field>
            ) : null}

            <div className="sm:col-span-2 flex gap-2 mt-4">
              <Link
                href="/new-ui/onboarding"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border border-black/10 hover:border-[#ee7768] transition"
              >
                <Pencil size={14} /> Modifier mon profil
              </Link>
              <button
                onClick={() => {
                  if (confirm("Réinitialiser ton passeport ? Cette action est irréversible.")) reset();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border border-[#d96565]/30 text-[#7e2929] hover:bg-[#d9656510] transition"
              >
                <Trash2 size={14} /> Tout réinitialiser
              </button>
            </div>
          </div>
        ) : null}

        {tab === "Mon plan" ? (
          <div>
            {savedPlan.length === 0 ? (
              <p className="text-sm text-[#1a1d24]/60">
                Aucun programme sauvegardé. Ajoute-en depuis une fiche programme.
              </p>
            ) : (
              <div className="space-y-2">
                {savedPlan.map((s) => {
                  const program = findProgram(s.programId);
                  if (!program) return null;
                  return (
                    <div
                      key={s.programId}
                      className="flex items-center gap-3 rounded-lg bg-white border border-black/5 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/new-ui/program/${program.id}`}
                          className="font-medium text-[#1a1d24] hover:text-[#ee7768] truncate block"
                        >
                          {program.title}
                        </Link>
                        <div className="text-xs text-[#1a1d24]/60">
                          {program.school.name} · ajouté le {new Date(s.addedAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSaved(program.id)}
                        className="text-[#7e2929] hover:bg-[#d9656510] rounded p-1.5"
                        title="Retirer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {tab === "Historique" ? (
          <p className="text-sm text-[#1a1d24]/60">
            Bientôt : recherches passées, comparaisons sauvegardées, parcours explorés.
          </p>
        ) : null}
      </div>
    </PageContainer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-black/5 p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-1">
        {label}
      </div>
      <div className="text-[#1a1d24]">{children}</div>
    </div>
  );
}
