"use client";

import { useMemo, use } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  BookmarkCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Clock,
  ExternalLink,
  Languages,
  MapPin,
  Sparkles,
  XCircle,
} from "lucide-react";
import { PageContainer } from "../../../components/PageContainer";
import { GaugeCircular } from "../../../components/GaugeCircular";
import { StatusBadge } from "../../../components/StatusBadge";
import { TrajectoryBar } from "../../../components/TrajectoryBar";
import { findCountry } from "../../../data/countries";
import { jobsForProgram } from "../../../data/jobs";
import { useProgram, usePrograms } from "../../../hooks/data";
import { computeFeasibility } from "../../../engine/feasibility";
import { usePassportStore } from "../../../store/passport-store";
import { usePlanStore } from "../../../store/plan-store";
import { applyTrajectory, useTrajectoryStore } from "../../../store/trajectory-store";
import { useEquivalencesStore } from "../../../store/equivalences-store";
import { findSchoolByProgram } from "../../../data/schools";
import { useMounted } from "../../../hooks/useMounted";
import { BudgetSummary } from "../../../components/BudgetSummary";
import { VisaSection } from "../../../components/VisaSection";
import { PlanBSection } from "../../../components/PlanBSection";
import type { Program } from "../../../types";

const PLATFORM_LABELS: Record<string, { name: string; url?: string }> = {
  parcoursup: { name: "Parcoursup", url: "https://www.parcoursup.gouv.fr" },
  mon_master: { name: "Mon Master", url: "https://www.monmaster.gouv.fr" },
  ucas: { name: "UCAS", url: "https://www.ucas.com" },
  common_app: { name: "Common App", url: "https://www.commonapp.org" },
  direct: { name: "Candidature directe (école)" },
};

export default function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const mounted = useMounted();
  const { id } = use(params);
  const { data: program, isLoading: programLoading } = useProgram(id);
  const { data: allPrograms = [] } = usePrograms();
  const passport = usePassportStore((s) => s.passport);
  const savedPlan = usePassportStore((s) => s.savedPlan);
  const toggleSaved = usePassportStore((s) => s.toggleSaved);
  const planAdd = usePlanStore((s) => s.add);
  const planRemove = usePlanStore((s) => s.remove);
  const toggleCompare = usePassportStore((s) => s.toggleCompare);
  const comparator = usePassportStore((s) => s.comparator);
  const fromOverride = useTrajectoryStore((s) => s.fromOverride);
  const steps = useTrajectoryStore((s) => s.steps);
  const pushStep = useTrajectoryStore((s) => s.pushStepFromProgramId);
  const equivEdges = useEquivalencesStore((s) => s.edges);

  const effective = useMemo(
    () => applyTrajectory(passport, { fromOverride, steps }),
    [passport, fromOverride, steps],
  );
  const feasibility = useMemo(
    () => (program ? computeFeasibility(effective, program, equivEdges) : null),
    [program, effective, equivEdges],
  );

  const otherSchoolsTeachingThisFormation = useMemo<Program[]>(() => {
    if (!program) return [];
    return allPrograms.filter(
      (p) => p.formationCode === program.formationCode && p.id !== program.id,
    );
  }, [program, allPrograms]);

  if (!mounted || programLoading) return null;
  if (!program || !feasibility) return notFound();

  const country = findCountry(program.countryRef);
  const isSaved = Boolean(savedPlan.find((s) => s.programId === program.id));
  const inCompare = comparator.includes(program.id);
  const platform = PLATFORM_LABELS[program.admissionPlatform];
  const alreadyInTrajectory = steps.some((s) => s.programId === program.id);
  const canContinue = !alreadyInTrajectory && feasibility.status !== "closed";

  function continueFromHere() {
    pushStep(program!.id);
    router.push("/explore");
  }

  return (
    <>
      <TrajectoryBar />
      <PageContainer>
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour à mes possibilités
      </Link>

      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1d24] to-[#2d3039] text-white p-7 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={feasibility.status} />
          <span className="text-xs text-white/60">{country?.flag} {country?.name}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight leading-tight">
          {program.title}
        </h1>
        <div className="text-white/70 text-sm mt-2 inline-flex items-center gap-2">
          <Building2 size={14} />
          <Link
            href={`/school/${findSchoolByProgram(program)?.id ?? ""}`}
            className="hover:text-white hover:underline transition"
          >
            {program.school.name}
          </Link>
          · {program.school.city}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-[13px] text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {program.durationYears} an{program.durationYears > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Languages size={14} /> {program.language.code.toUpperCase()} {program.language.minLevel}
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "var(--font-mono)" }}>
            <Coins size={14} /> {program.costPerYear === 0 ? "Gratuit" : `${program.costPerYear.toLocaleString("fr-FR")} €/an`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} /> {program.workStudy ? "Alternance possible" : "Présentiel"}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6 min-w-0">
          <ForYouSection feasibility={feasibility} />

          <Section title="Comment postuler" icon={<Calendar size={18} />}>
            <div className="space-y-4">
              <Step n={1} title="Plateforme">
                {platform.name}
                {platform.url ? (
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#ee7768] hover:underline ml-2 text-sm"
                  >
                    site officiel <ExternalLink size={11} />
                  </a>
                ) : null}
              </Step>
              <Step n={2} title="Pièces à préparer">
                <ul className="space-y-1.5 mt-1">
                  {program.documents.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-[#1a1d24]/80">
                      <input type="checkbox" className="mt-1 accent-[#ee7768]" /> {d}
                    </li>
                  ))}
                </ul>
              </Step>
              {program.applicationOpens || program.applicationCloses ? (
                <Step n={3} title="Deadlines">
                  <div className="flex gap-3 text-sm">
                    {program.applicationOpens ? (
                      <span className="px-2 py-1 rounded bg-[#a3cf9120] text-[#3a6f2c]">
                        Ouvre {program.applicationOpens}
                      </span>
                    ) : null}
                    {program.applicationCloses ? (
                      <span className="px-2 py-1 rounded bg-[#ee776820] text-[#a8463a]">
                        Ferme {program.applicationCloses}
                      </span>
                    ) : null}
                  </div>
                </Step>
              ) : null}
              {program.applicationFee != null ? (
                <Step n={4} title="Frais de candidature">
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {program.applicationFee === 0 ? "Gratuit" : `${program.applicationFee} €`}
                  </span>
                </Step>
              ) : null}
              {program.optionalSteps?.length ? (
                <Step n={5} title="Étapes optionnelles">
                  <div className="flex flex-wrap gap-2">
                    {program.optionalSteps.map((s) => (
                      <span key={s} className="px-2 py-1 rounded-full bg-black/5 text-[12px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </Step>
              ) : null}
            </div>
          </Section>

          <Section title="Et après ?" icon={<Sparkles size={18} />}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-2">
                  Métiers typiques
                </div>
                <div className="flex flex-wrap gap-2">
                  {program.outcomesJobs.map((label) => {
                    const matched = jobsForProgram([label])[0];
                    return matched ? (
                      <Link
                        key={label}
                        href={`/jobs/${matched.id}`}
                        className="px-2.5 py-1 rounded-full bg-[#ee776815] text-[#a8463a] text-[12px] hover:bg-[#ee776830] transition inline-flex items-center gap-1"
                        title={`Voir la fiche métier "${matched.label}"`}
                      >
                        {label} <ArrowRight size={10} />
                      </Link>
                    ) : (
                      <span
                        key={label}
                        className="px-2.5 py-1 rounded-full bg-[#ee776815] text-[#a8463a] text-[12px]"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-2">
                  Reconnu nativement dans
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {program.internationallyRecognizedIn.map((iso) => {
                    const c = findCountry(iso);
                    return (
                      <span
                        key={iso}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/5 text-[12px]"
                      >
                        {c?.flag ?? iso} {c?.name ?? iso}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="text-sm text-[#1a1d24]/70 mt-4 leading-relaxed">{program.description}</p>
          </Section>

          <Section
            title={`« ${program.formationLabel} » est aussi enseignée par${otherSchoolsTeachingThisFormation.length > 0 ? "" : "..."}`}
            icon={<Building2 size={18} />}
          >
            {otherSchoolsTeachingThisFormation.length === 0 ? (
              <p className="text-[12px] text-[#1a1d24]/55 leading-relaxed">
                Pour l'instant, AkJol ne référence que <strong>{program.school.name}</strong> pour cette
                formation. D'autres établissements la proposent probablement dans la vraie vie — on travaille à
                les ajouter.
              </p>
            ) : (
              <>
                <p className="text-[12px] text-[#1a1d24]/60 mb-3 leading-relaxed">
                  <strong className="text-[#1a1d24]">{otherSchoolsTeachingThisFormation.length}</strong>{" "}
                  autre{otherSchoolsTeachingThisFormation.length > 1 ? "s" : ""} établissement
                  {otherSchoolsTeachingThisFormation.length > 1 ? "s" : ""} référencé
                  {otherSchoolsTeachingThisFormation.length > 1 ? "s" : ""} dans AkJol enseigne
                  {otherSchoolsTeachingThisFormation.length > 1 ? "nt" : ""} la même formation. Compare avant
                  de candidater — frais, ville, durée, taux d'admission peuvent différer.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {otherSchoolsTeachingThisFormation.map((sim) => {
                    const c = findCountry(sim.countryRef);
                    return (
                      <Link
                        key={sim.id}
                        href={`/program/${sim.id}`}
                        className="block rounded-lg border border-black/5 hover:border-[#ee7768]/40 bg-white px-3 py-2.5 transition"
                      >
                        <div className="font-medium text-[13px] text-[#1a1d24] truncate">
                          {sim.school.name}
                        </div>
                        <div className="text-[11px] text-[#1a1d24]/55 mt-0.5 truncate">
                          {c?.flag} {sim.school.city}
                          {typeof sim.school.rating === "number"
                            ? ` · ★ ${sim.school.rating.toFixed(1)}`
                            : ""}
                        </div>
                        <div className="text-[10px] text-[#1a1d24]/45 mt-1 line-clamp-2">{sim.title}</div>
                        <div
                          className="text-[10px] text-[#1a1d24]/55 mt-1"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {sim.durationYears} an{sim.durationYears > 1 ? "s" : ""} ·{" "}
                          {sim.costPerYear === 0
                            ? "Gratuit"
                            : `${sim.costPerYear.toLocaleString("fr-FR")} €/an`}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </Section>

          <BudgetSummary programs={[program]} passport={passport} />

          <VisaSection
            origin={passport.origin.country || "FR"}
            dest={program.countryRef}
            level={program.level}
          />

          <PlanBSection program={program} passport={effective} />
        </div>

        <aside className="lg:sticky lg:top-20 self-start space-y-3">
          <div className="rounded-xl bg-white border border-black/5 p-5 flex flex-col items-center">
            <GaugeCircular
              value={feasibility.probability.value}
              ci={feasibility.probability.ci}
              basedOn={feasibility.probability.basedOn}
              size={120}
            />
          </div>
          {canContinue ? (
            <button
              onClick={continueFromHere}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white shadow-sm hover:shadow-md transition"
              style={{ background: "#ee7768" }}
              title="Empile ce diplôme dans le voyage virtuel et explore la suite"
            >
              Continuer depuis ici <ArrowRight size={16} />
            </button>
          ) : null}
          <button
            onClick={() => {
              const now = isSaved;
              toggleSaved(program.id);
              if (now) planRemove(program.id);
              else planAdd(program);
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-sm border transition"
            style={{
              borderColor: isSaved ? "#a3cf91" : "#0000000d",
              background: isSaved ? "#a3cf9120" : "#fff",
              color: isSaved ? "#3a6f2c" : "#1a1d24",
            }}
          >
            {isSaved ? (
              <>
                <BookmarkCheck size={14} /> Dans mon plan
              </>
            ) : (
              <>
                <BookmarkPlus size={14} /> Ajouter à mon plan
              </>
            )}
          </button>
          <button
            onClick={() => toggleCompare(program.id)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm border transition"
            style={{
              borderColor: inCompare ? "#ee7768" : "#0000000d",
              background: inCompare ? "#ee776810" : "#fff",
              color: inCompare ? "#a8463a" : "#1a1d24",
            }}
          >
            {inCompare ? "Retirer du comparateur" : "Comparer avec…"}
          </button>
          <Link
            href={`/school/${findSchoolByProgram(program)?.id ?? ""}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm border border-black/10 hover:border-[#ee7768] transition"
          >
            <Building2 size={14} /> Visiter {program.school.name}
          </Link>
          <div className="rounded-xl bg-white border border-black/5 p-4 text-[12px] text-[#1a1d24]/70 leading-relaxed">
            <strong className="text-[#1a1d24]">Honnêteté épistémique.</strong> La probabilité affichée est
            calculée à partir de ton passeport (ou du voyage virtuel courant) et de la base AkJol — elle est
            toujours donnée avec son intervalle de confiance et la taille d'échantillon. <em>Pas de promesse.</em>
          </div>
        </aside>
      </div>
      </PageContainer>
    </>
  );
}

function ForYouSection({ feasibility }: { feasibility: ReturnType<typeof computeFeasibility> }) {
  return (
    <div className="rounded-2xl border-2 border-[#ee7768]/30 bg-gradient-to-br from-[#ee776808] to-transparent p-5">
      <div className="text-[11px] uppercase tracking-wider text-[#a8463a] font-semibold mb-3">
        Pour toi · personnalisé à ton passeport
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Block title="Conditions remplies" tint="#a3cf91">
          {feasibility.conditions.met.length === 0 ? (
            <li className="text-sm text-[#1a1d24]/50">Aucune pour l'instant.</li>
          ) : null}
          {feasibility.conditions.met.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#1a1d24]">
              <CheckCircle2 size={14} className="mt-0.5 text-[#3a6f2c] shrink-0" />
              <span>
                <span className="font-medium">{c.label}</span>
                {c.detail ? <span className="block text-[#1a1d24]/60 text-xs">{c.detail}</span> : null}
              </span>
            </li>
          ))}
          {feasibility.conditions.unmet.length > 0 ? (
            <li className="mt-3 pt-3 border-t border-black/5">
              <div className="text-[11px] uppercase tracking-wider text-[#7e2929] font-semibold mb-2">
                Non remplies
              </div>
              {feasibility.conditions.unmet.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-[#1a1d24] mb-1">
                  <XCircle size={14} className="mt-0.5 text-[#7e2929] shrink-0" />
                  <span>
                    <span className="font-medium">{c.label}</span>
                    {c.detail ? (
                      <span className="block text-[#1a1d24]/60 text-xs">{c.detail}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </li>
          ) : null}
        </Block>

        <Block title="Suppositions / risques" tint="#f5b86a">
          {feasibility.assumptions.map((a, i) => (
            <li key={i} className="text-sm text-[#1a1d24]/80 leading-snug">
              {a.label}
            </li>
          ))}
        </Block>

        <Block title="À compléter pour maximiser tes chances" tint="#ee7768">
          {feasibility.toMaximize.map((s, i) => (
            <li key={i} className="text-sm text-[#1a1d24]">
              <span className="font-medium">{s.label}</span>
              {s.gainPct ? (
                <span
                  className="ml-1.5 text-[11px] font-semibold text-[#3a6f2c]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  +{s.gainPct}%
                </span>
              ) : null}
              {s.detail ? <span className="block text-[#1a1d24]/60 text-xs">{s.detail}</span> : null}
            </li>
          ))}
        </Block>
      </div>
    </div>
  );
}

function Block({
  title,
  tint,
  children,
}: {
  title: string;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-4 border border-black/5">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: tint }} />
        <span className="text-[11px] uppercase tracking-wider text-[#1a1d24]/60 font-semibold">
          {title}
        </span>
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#ee7768]/10 text-[#ee7768]">
          {icon}
        </span>
        <h2 className="font-medium text-[#1a1d24]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div
        className="shrink-0 w-7 h-7 rounded-full bg-[#ee7768]/10 text-[#a8463a] flex items-center justify-center text-xs font-semibold"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium">
          {title}
        </div>
        <div className="text-[#1a1d24] mt-0.5">{children}</div>
      </div>
    </div>
  );
}
