"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Coins, Pencil, Sparkles, Trash2 } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { findCountry } from "../../data/countries";
import { usePassportStore } from "../../store/passport-store";
import { useParcoursStore } from "../../store/parcours-store";
import { useMounted } from "../../hooks/useMounted";
import { PlanTimeline } from "../../components/PlanTimeline";
import { scholarshipsForPassport, formatAmount } from "../../data/scholarships";

const TABS = ["Mon profil", "Mon plan", "Mes parcours"] as const;
type Tab = (typeof TABS)[number];

export default function PassportPage() {
  const mounted = useMounted();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const reset = usePassportStore((s) => s.reset);

  const [tab, setTab] = useState<Tab>("Mon profil");
  const country = findCountry(passport.origin.country);
  const matchingScholarships = mounted && passport.origin.country
    ? scholarshipsForPassport(passport).filter((m) => m.isMatch).slice(0, 3)
    : [];

  if (!mounted) return null;
  if (!isComplete) {
    return (
      <PageContainer className="max-w-xl text-center pt-16">
        <h2 className="text-2xl font-medium tracking-tight">Pas encore de passeport</h2>
        <p className="text-[#1a1d24]/70 mt-2">
          Construis ton passeport-éducation pour personnaliser tes recommandations.
        </p>
        <Link
          href="/onboarding"
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
                href="/onboarding"
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

            {matchingScholarships.length > 0 ? (
              <div className="sm:col-span-2 rounded-xl bg-[#fafff5] border border-[#a3cf91]/40 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium inline-flex items-center gap-2">
                    <Sparkles size={14} className="text-[#3a6f2c]" /> Bourses pour toi
                  </h3>
                  <Link
                    href="/bourses"
                    className="text-[12px] text-[#3a6f2c] hover:underline font-medium"
                  >
                    Voir les {scholarshipsForPassport(passport).filter((m) => m.isMatch).length} bourses →
                  </Link>
                </div>
                <ul className="space-y-1.5">
                  {matchingScholarships.map(({ scholarship: s }) => (
                    <li key={s.id} className="flex items-center gap-2 text-[12px]">
                      <Coins size={11} className="text-[#3a6f2c] shrink-0" />
                      <span className="font-medium text-[#1a1d24]">{s.shortName ?? s.name}</span>
                      <span className="text-[#1a1d24]/60">·</span>
                      <span className="font-mono text-[#1a1d24]/80">{formatAmount(s)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "Mon plan" ? <PlanTimeline /> : null}

        {tab === "Mes parcours" ? <ParcoursList /> : null}
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

function ParcoursList() {
  const parcours = useParcoursStore((s) => s.parcours);
  const remove = useParcoursStore((s) => s.deleteParcours);

  if (parcours.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-black/5 p-6 text-center">
        <Bookmark size={20} className="mx-auto text-[#1a1d24]/40 mb-2" />
        <h3 className="font-medium text-[#1a1d24]">Aucun parcours sauvegardé</h3>
        <p className="text-sm text-[#1a1d24]/60 mt-1">
          Sur <Link href="/explore" className="text-[#ee7768] hover:underline">/explore</Link>, empile
          des étapes via « Continuer depuis ici » puis sauve la trajectoire dans « Mes parcours »
          (icône en haut à droite).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {parcours.map((p) => (
        <Link
          key={p.id}
          href={`/parcours/${p.id}`}
          className="block rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition p-4 group"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">{p.emoji ?? "🎯"}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[#1a1d24] group-hover:text-[#ee7768] transition">
                {p.name}
              </h3>
              <div className="text-[11px] text-[#1a1d24]/55 mt-0.5">
                {p.steps.length} étape{p.steps.length > 1 ? "s" : ""} ·{" "}
                {new Date(p.updatedAt).toLocaleDateString("fr-FR")}
              </div>
              {p.note ? (
                <p className="text-[12px] text-[#1a1d24]/70 mt-1 line-clamp-2">{p.note}</p>
              ) : null}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (confirm(`Supprimer le parcours "${p.name}" ?`)) remove(p.id);
              }}
              className="text-[#1a1d24]/30 hover:text-[#7e2929] transition shrink-0"
              title="Supprimer ce parcours"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}
