"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Globe2,
  GitFork,
  ListChecks,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { SourcedNumber } from "../components/SourcedNumber";
import { usePassportStore } from "../store/passport-store";
import { useParcoursStore } from "../store/parcours-store";
import { useMounted } from "../hooks/useMounted";
import { LEA_PERSONA, LANA_PERSONA } from "../data/personas";
import { COUNTRIES } from "../data/countries";
import type { Passport } from "../types";

const PREVIEW_COUNTRY_CODES = ["FR", "GB", "DE", "MY", "US"];

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingInner />
    </Suspense>
  );
}

function LandingInner() {
  const t = useTranslations("home");
  const mounted = useMounted();
  const isComplete = usePassportStore((s) => s.isComplete());
  const setPassport = usePassportStore((s) => s.setPassport);
  const importFromToken = useParcoursStore((s) => s.importFromToken);
  const params = useSearchParams();
  const router = useRouter();
  const [imported, setImported] = useState<string | null>(null);
  const showExploreCTA = mounted && isComplete;

  useEffect(() => {
    const token = params.get("import");
    if (token) {
      const id = importFromToken(token);
      if (id) {
        router.replace(`/parcours/${id}`, { scroll: false });
      } else {
        setImported(t("importedError"));
        router.replace("/", { scroll: false });
      }
    }
  }, [params, importFromToken, router, t]);

  const previewCountries = PREVIEW_COUNTRY_CODES
    .map((c) => COUNTRIES.find((co) => co.code === c))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const applyPersona = (persona: Passport) => {
    if (mounted && isComplete) {
      const ok = window.confirm(t("personasOverwriteConfirm"));
      if (!ok) return;
    }
    setPassport(persona);
    router.push("/explore");
  };

  return (
    <PageContainer className="pt-12">
      {imported ? (
        <div className="mb-6 rounded-xl bg-[#a3cf9120] border border-[#a3cf91]/40 px-4 py-3 text-sm text-[#3a6f2c]">
          {imported}
        </div>
      ) : null}

      {/* Hero */}
      <section className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ee7768]/10 text-[#a8463a] text-xs font-medium mb-6">
          <Compass size={13} /> {t("previewBadge")}
        </div>
        <h1
          className="text-[2.6rem] sm:text-5xl leading-[1.05] font-medium text-[#1a1d24] tracking-tight"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {t.rich("heroTitle", {
            accent: (chunks) => <span style={{ color: "#ee7768" }}>{chunks}</span>,
          })}
        </h1>
        <p className="text-lg text-[#1a1d24]/70 mt-5 leading-relaxed">{t("heroSubtitle")}</p>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href={showExploreCTA ? "/explore" : "/onboarding"}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
            style={{ background: "#ee7768" }}
          >
            {showExploreCTA ? t("ctaSeePossibilities") : t("ctaCreatePassport")}{" "}
            <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={() => applyPersona(LEA_PERSONA)}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-[#1a1d24] border border-black/10 hover:border-[#ee7768] transition"
          >
            <Sparkles size={15} /> {t("ctaTestAsLea")}
          </button>
          <Link
            href="/methodologie"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-[#1a1d24]/70 hover:text-[#ee7768] transition"
          >
            <BookOpen size={15} /> {t("ctaMethodology")}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20">
        <h2 className="text-2xl font-medium tracking-tight mb-6">{t("howTitle")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <HowStep
            n={1}
            icon={<MapPin size={18} />}
            title={t("howStep1Title")}
            body={t("howStep1Body")}
          />
          <HowStep
            n={2}
            icon={<Compass size={18} />}
            title={t("howStep2Title")}
            body={t("howStep2Body")}
          />
          <HowStep
            n={3}
            icon={<ListChecks size={18} />}
            title={t("howStep3Title")}
            body={t("howStep3Body")}
          />
        </div>
      </section>

      {/* Covered countries */}
      <section className="mt-20">
        <h2 className="text-2xl font-medium tracking-tight">{t("countriesTitle")}</h2>
        <p className="text-sm text-[#1a1d24]/60 mt-1 mb-6">{t("countriesSubtitle")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {previewCountries.map((c) => (
            <Link
              key={c.code}
              href={`/explore/${c.code}`}
              className="flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 hover:border-[#ee7768]/40 hover:shadow-sm transition"
            >
              <span className="text-2xl">{c.flag}</span>
              <span className="font-medium text-[#1a1d24]">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Personas */}
      <section className="mt-20">
        <h2 className="text-2xl font-medium tracking-tight">{t("personasTitle")}</h2>
        <p className="text-sm text-[#1a1d24]/60 mt-1 mb-6">{t("personasSubtitle")}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <PersonaCard
            flag="🇫🇷"
            title={t("personasLeaTitle")}
            body={t("personasLeaBody")}
            ctaLabel={t("personasTestThis")}
            onClick={() => applyPersona(LEA_PERSONA)}
          />
          <PersonaCard
            flag="🇲🇾"
            title={t("personasLanaTitle")}
            body={t("personasLanaBody")}
            ctaLabel={t("personasTestThis")}
            onClick={() => applyPersona(LANA_PERSONA)}
          />
        </div>
      </section>

      {/* Key numbers */}
      <section className="mt-20">
        <h2 className="text-2xl font-medium tracking-tight mb-6">{t("numbersTitle")}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberCard
            value={
              <SourcedNumber
                value="5 800+"
                source={{ label: t("numbersFormationsSource"), url: "/data", date: "2026-05-13" }}
              />
            }
            label={t("numbersFormationsLabel")}
          />
          <NumberCard
            value={
              <SourcedNumber
                value={String(PREVIEW_COUNTRY_CODES.length)}
                source={{ label: t("numbersCountriesSource"), url: "/methodologie", date: "2026-05-13" }}
              />
            }
            label={t("numbersCountriesLabel")}
          />
          <NumberCard
            value={
              <SourcedNumber
                value={t("numbersFree")}
                source={{ label: t("numbersFreeSource"), url: "/data" }}
              />
            }
            label={t("numbersFreeLabel")}
          />
        </div>
      </section>

      {/* Trust */}
      <section className="mt-20">
        <h2 className="text-2xl font-medium tracking-tight mb-6">{t("trustTitle")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TrustCard
            icon={<GitFork size={18} />}
            title={t("trustOpenSource")}
            body={t("trustOpenSourceBody")}
            href="https://github.com"
            external
          />
          <TrustCard
            icon={<BookOpen size={18} />}
            title={t("trustMethodology")}
            body={t("trustMethodologyBody")}
            href="/methodologie"
          />
          <TrustCard
            icon={<Shield size={18} />}
            title={t("trustNoAds")}
            body={t("trustNoAdsBody")}
            href="/methodologie"
          />
          <TrustCard
            icon={<ShieldCheck size={18} />}
            title={t("trustGdpr")}
            body={t("trustGdprBody")}
            href="/privacy"
          />
        </div>
      </section>

      {/* Trailing CTA strip */}
      <section className="mt-20 mb-4 rounded-2xl border border-black/5 bg-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="text-xl font-medium tracking-tight text-[#1a1d24]">
            <Globe2 size={18} className="inline mr-2 text-[#ee7768]" />
            {t("ctaCreatePassport")}
          </h3>
          <p className="text-sm text-[#1a1d24]/70 mt-1">{t("heroSubtitle")}</p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
          style={{ background: "#ee7768" }}
        >
          {t("ctaCreatePassport")} <ArrowRight size={16} />
        </Link>
      </section>
    </PageContainer>
  );
}

function HowStep({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const t = useTranslations("home");
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#ee7768]/10 text-[#ee7768]">
          {icon}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[#1a1d24]/40 font-medium">
          {t("howStepLabel", { n })}
        </span>
      </div>
      <h3 className="font-medium text-[#1a1d24]">{title}</h3>
      <p className="text-sm text-[#1a1d24]/70 mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function PersonaCard({
  flag,
  title,
  body,
  ctaLabel,
  onClick,
}: {
  flag: string;
  title: string;
  body: string;
  ctaLabel: string;
  onClick: () => void;
}) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-5 flex flex-col">
      <div className="text-[#1a1d24] font-medium inline-flex items-center gap-2">
        <span className="text-xl">{flag}</span> {title}
      </div>
      <p className="text-sm text-[#1a1d24]/70 mt-2 leading-relaxed flex-1">{body}</p>
      <button
        type="button"
        onClick={onClick}
        className="self-start inline-flex items-center gap-1 mt-3 text-[#ee7768] hover:underline text-sm font-medium"
      >
        {ctaLabel} <ArrowRight size={14} />
      </button>
    </article>
  );
}

function NumberCard({ value, label }: { value: React.ReactNode; label?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5">
      <div
        className="text-3xl font-medium text-[#1a1d24]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {value}
      </div>
      {label ? <div className="text-sm text-[#1a1d24]/60 mt-2">{label}</div> : null}
    </div>
  );
}

function TrustCard({
  icon,
  title,
  body,
  href,
  external,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  external?: boolean;
}) {
  const inner = (
    <div className="rounded-xl border border-black/5 bg-white p-5 h-full hover:border-[#ee7768]/40 transition">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#ee7768]/10 text-[#ee7768] mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-[#1a1d24]">{title}</h3>
      <p className="text-sm text-[#1a1d24]/70 mt-1 leading-relaxed">{body}</p>
    </div>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block h-full">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  );
}
