"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Briefcase, Search, X, MapPin, Coins, Activity, Sparkles } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { findCountry } from "../../data/countries";
import type { Job } from "../../data/jobs";
import type { Program } from "../../types";
import { useJobs, usePrograms } from "../../hooks/data";

const DOMAIN_VALUES = [
  "Tech",
  "Santé",
  "Sciences",
  "Industrie",
  "Affaires",
  "Arts",
  "Droit",
  "Sciences humaines",
  "Design",
  "Conseil",
  "Management",
];

const DOMAIN_KEY: Record<string, string> = {
  Tech: "domainTech",
  "Santé": "domainSante",
  Sciences: "domainSciences",
  Industrie: "domainIndustrie",
  Affaires: "domainAffaires",
  Arts: "domainArts",
  Droit: "domainDroit",
  "Sciences humaines": "domainSh",
  Design: "domainDesign",
  Conseil: "domainConseil",
  Management: "domainManagement",
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function programsLeadingTo(job: Job, programs: Program[]): number {
  return programs.filter((p) =>
    p.outcomesJobs.some((label) => {
      const lc = normalize(label);
      const jl = normalize(job.label);
      return (
        lc.includes(jl) ||
        jl.includes(lc) ||
        job.matchKeywords.some((k) => lc.includes(normalize(k)))
      );
    }),
  ).length;
}

function formatSalary(s: { country: string; median: number; currency: string }): string {
  const sym = s.currency === "EUR" ? "€" : s.currency === "GBP" ? "£" : s.currency === "USD" ? "$" : s.currency;
  return `${(s.median / 1000).toFixed(0)}k ${sym}`;
}

export default function JobsPage() {
  const t = useTranslations("jobs");
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");

  const { data: jobs = [] } = useJobs();
  const { data: programs = [] } = usePrograms();

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return jobs.filter((j) => {
      if (domain && !j.domains.includes(domain)) return false;
      if (!q) return true;
      const hay = normalize(
        [j.label, ...j.matchKeywords, ...j.domains, ...j.dailyTasks].join(" "),
      );
      return hay.includes(q);
    });
  }, [jobs, search, domain]);

  return (
    <PageContainer>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-2">
            <Briefcase size={12} /> {t("tag")}
          </div>
          <h1 className="text-3xl font-medium tracking-tight">{t("title")}</h1>
          <p className="text-sm text-[#1a1d24]/70 mt-1">
            {t.rich("subtitle", {
              n: jobs.length,
              count: (chunks) => <span className="font-semibold text-[#1a1d24]">{chunks}</span>,
              em: (chunks) => <em>{chunks}</em>,
            })}
          </p>
        </div>
      </header>

      <div className="rounded-xl bg-white border border-black/5 p-4 mb-6 space-y-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1d24]/40"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full text-sm rounded-md border border-black/10 pl-9 pr-9 py-2 outline-none focus:border-[#ee7768]"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1a1d24]/40 hover:text-[#1a1d24]"
              aria-label={t("clearSearch")}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setDomain("")}
            className="text-[12px] px-2.5 py-1 rounded-full transition"
            style={{
              background: domain === "" ? "#ee776820" : "#fafaf7",
              color: domain === "" ? "#a8463a" : "#1a1d24cc",
              border: "1px solid " + (domain === "" ? "#ee776840" : "transparent"),
            }}
          >
            {t("allDomains")}
          </button>
          {DOMAIN_VALUES.map((d) => (
            <button
              key={d}
              onClick={() => setDomain(d === domain ? "" : d)}
              className="text-[12px] px-2.5 py-1 rounded-full transition"
              style={{
                background: domain === d ? "#ee776820" : "#fafaf7",
                color: domain === d ? "#a8463a" : "#1a1d24cc",
                border: "1px solid " + (domain === d ? "#ee776840" : "transparent"),
              }}
            >
              {t(DOMAIN_KEY[d])}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#1a1d24]/60">{t("noJobs")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} programs={programs} />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl bg-[#fcf6e8] border border-[#e6c068]/30 p-4 text-[12px] text-[#8a5314] flex items-start gap-2">
        <Sparkles size={13} className="mt-0.5 shrink-0" />
        <span>
          {t.rich("methodNote", {
            strong: (chunks) => <strong>{chunks}</strong>,
            link: (chunks) => (
              <Link href="/methodologie" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </div>
    </PageContainer>
  );
}

function JobCard({ job, programs }: { job: Job; programs: Program[] }) {
  const t = useTranslations("jobs");
  const frSalary = job.salary.find((s) => s.country === "FR");
  const otherSalaries = job.salary.filter((s) => s.country !== "FR");
  const programsCount = programsLeadingTo(job, programs);
  const automationPct = Math.round(job.riskAutomation * 100);
  const automationLabel =
    automationPct < 20
      ? t("automationVeryLow")
      : automationPct < 40
        ? t("automationLow")
        : automationPct < 60
          ? t("automationModerate")
          : t("automationHigh");

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-xl bg-white border border-black/5 hover:border-[#ee7768]/40 hover:shadow-md transition p-4 group"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#1a1d24] leading-snug group-hover:text-[#ee7768] transition">
            {job.label}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {job.domains.map((d) => (
              <span
                key={d}
                className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1a1d2408] text-[#1a1d24]/60 font-medium"
              >
                {DOMAIN_KEY[d] ? t(DOMAIN_KEY[d]) : d}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
        <div className="rounded-md bg-[#fafaf7] border border-black/5 px-2 py-1.5">
          <div className="text-[10px] text-[#1a1d24]/50 inline-flex items-center gap-1">
            <Coins size={10} /> {t("salaryFR")}
          </div>
          <div className="font-medium font-mono mt-0.5">
            {frSalary ? formatSalary(frSalary) : "—"}
          </div>
          {otherSalaries.length > 0 ? (
            <div className="text-[10px] text-[#1a1d24]/50 mt-0.5 truncate">
              {otherSalaries.map((s) => `${findCountry(s.country)?.flag ?? s.country} ${formatSalary(s)}`).join(" · ")}
            </div>
          ) : null}
        </div>
        <div className="rounded-md bg-[#fafaf7] border border-black/5 px-2 py-1.5">
          <div className="text-[10px] text-[#1a1d24]/50 inline-flex items-center gap-1">
            <Activity size={10} /> {t("automation")}
          </div>
          <div className="font-medium mt-0.5">
            {automationPct}%
            <span className="ml-1 text-[10px] text-[#1a1d24]/50">{automationLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-black/5 text-[11px]">
        <span className="inline-flex items-center gap-1 text-[#1a1d24]/60">
          <MapPin size={11} /> {job.regionsTopHiring.slice(0, 2).join(", ")}
          {job.regionsTopHiring.length > 2 ? "…" : ""}
        </span>
        <span className="text-[#a8463a] font-medium">
          {programsCount > 0 ? t("programsCountSuffix", { count: programsCount }) : t("viewRoutes")}
        </span>
      </div>
    </Link>
  );
}
