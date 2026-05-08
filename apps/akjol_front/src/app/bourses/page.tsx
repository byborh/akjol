"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Search,
  X,
  Sparkles,
  ExternalLink,
  Calendar,
  Award,
  HeartHandshake,
  Plane,
  GraduationCap,
} from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import {
  SCHOLARSHIPS,
  formatAmount,
  matchScholarship,
  type Scholarship,
  type ScholarshipFunding,
} from "../../data/scholarships";
import { findCountry } from "../../data/countries";
import { usePassportStore } from "../../store/passport-store";
import { useMounted } from "../../hooks/useMounted";

const FUNDING_LABEL: Record<ScholarshipFunding, string> = {
  merit: "Mérite",
  social: "Critères sociaux",
  mobility: "Mobilité internationale",
  research: "Recherche / doctorat",
  mixed: "Mixte",
};

const FUNDING_ICON: Record<ScholarshipFunding, typeof Award> = {
  merit: Award,
  social: HeartHandshake,
  mobility: Plane,
  research: GraduationCap,
  mixed: Coins,
};

export default function BoursesPage() {
  const mounted = useMounted();
  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());

  const [search, setSearch] = useState("");
  const [funding, setFunding] = useState<ScholarshipFunding | "">("");
  const [target, setTarget] = useState("");
  const [onlyForMe, setOnlyForMe] = useState(false);

  const enriched = useMemo(() => {
    return SCHOLARSHIPS.map((s) => ({
      scholarship: s,
      match: mounted && isComplete ? matchScholarship(s, passport) : null,
    }));
  }, [passport, mounted, isComplete]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ scholarship: s, match }) => {
      if (funding && s.fundingType !== funding) return false;
      if (target && !s.targetCountries.includes(target) && s.targetCountries.length > 0)
        return false;
      if (onlyForMe && match && !match.isMatch) return false;
      if (q) {
        const hay = [s.name, s.organism, s.description, s.shortName ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enriched, search, funding, target, onlyForMe]);

  const matchCount = enriched.filter((e) => e.match?.isMatch).length;

  const targetCountries = useMemo(() => {
    const set = new Set<string>();
    SCHOLARSHIPS.forEach((s) => s.targetCountries.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, []);

  return (
    <PageContainer>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-semibold mb-2">
            <Coins size={12} /> Annuaire des bourses
          </div>
          <h1 className="text-3xl font-medium tracking-tight">L'argent qui débloque tout</h1>
          <p className="text-sm text-[#1a1d24]/70 mt-1">
            <span className="font-semibold text-[#1a1d24]">{SCHOLARSHIPS.length}</span> bourses
            curées · sources officielles · auto-matching avec ton passeport.
          </p>
        </div>
        {mounted && isComplete && matchCount > 0 ? (
          <div className="rounded-xl bg-[#a3cf9120] border border-[#a3cf91]/40 px-4 py-3 text-[12px] text-[#3a6f2c]">
            <strong>{matchCount} bourse{matchCount > 1 ? "s" : ""} pour toi</strong> selon ton
            passeport.
          </div>
        ) : null}
      </header>

      <div className="rounded-xl bg-white border border-black/5 p-4 mb-6 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1d24]/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Erasmus, CROUS, Eiffel, Chevening…"
            className="w-full text-sm rounded-md border border-black/10 pl-9 pr-9 py-2 outline-none focus:border-[#ee7768]"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1a1d24]/40 hover:text-[#1a1d24]"
              aria-label="effacer"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={funding === ""} onClick={() => setFunding("")}>
            Tous types
          </FilterChip>
          {(Object.keys(FUNDING_LABEL) as ScholarshipFunding[]).map((f) => (
            <FilterChip key={f} active={funding === f} onClick={() => setFunding(f === funding ? "" : f)}>
              {FUNDING_LABEL[f]}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={target === ""} onClick={() => setTarget("")}>
            Toutes destinations
          </FilterChip>
          {targetCountries.map((iso) => {
            const c = findCountry(iso);
            return (
              <FilterChip
                key={iso}
                active={target === iso}
                onClick={() => setTarget(iso === target ? "" : iso)}
              >
                {c?.flag ?? "🌍"} {c?.name ?? iso}
              </FilterChip>
            );
          })}
          {mounted && isComplete ? (
            <button
              onClick={() => setOnlyForMe((v) => !v)}
              className="ml-auto text-[12px] px-2.5 py-1 rounded-full transition inline-flex items-center gap-1"
              style={{
                background: onlyForMe ? "#a3cf9120" : "#fafaf7",
                color: onlyForMe ? "#3a6f2c" : "#1a1d24cc",
                border: "1px solid " + (onlyForMe ? "#a3cf91" : "transparent"),
              }}
            >
              <Sparkles size={11} /> Pour moi seulement
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#1a1d24]/60">Aucune bourse avec ces filtres.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ scholarship: s, match }) => (
            <ScholarshipCard key={s.id} scholarship={s} match={match} />
          ))}
        </div>
      )}

      {!isComplete && mounted ? (
        <div className="mt-8 rounded-xl bg-[#fff7f5] border border-[#ee7768]/20 p-4 text-[12px] text-[#a8463a] flex items-start gap-2">
          <Sparkles size={13} className="mt-0.5 shrink-0" />
          <span>
            Construis ton passeport pour voir les bourses qui te concernent vraiment (filtre
            "Pour moi seulement").{" "}
            <Link href="/onboarding" className="underline font-medium">
              Commencer
            </Link>
            .
          </span>
        </div>
      ) : null}

      <div className="mt-10 rounded-xl bg-[#fcf6e8] border border-[#e6c068]/30 p-4 text-[12px] text-[#8a5314] flex items-start gap-2">
        <Sparkles size={13} className="mt-0.5 shrink-0" />
        <span>
          <strong>Sourcing.</strong> Toutes les bourses listées sont publiques et sourcées (lien
          officiel + date de vérification). Les fourchettes de montants sont indicatives —
          confirme toujours sur le site officiel avant candidature. Voir{" "}
          <Link href="/methodologie" className="underline">
            méthodologie
          </Link>
          .
        </span>
      </div>
    </PageContainer>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[12px] px-2.5 py-1 rounded-full transition"
      style={{
        background: active ? "#ee776820" : "#fafaf7",
        color: active ? "#a8463a" : "#1a1d24cc",
        border: "1px solid " + (active ? "#ee776840" : "transparent"),
      }}
    >
      {children}
    </button>
  );
}

function ScholarshipCard({
  scholarship: s,
  match,
}: {
  scholarship: Scholarship;
  match: ReturnType<typeof matchScholarship> | null;
}) {
  const Icon = FUNDING_ICON[s.fundingType];
  const isMatch = match?.isMatch ?? false;

  return (
    <article
      className="rounded-xl bg-white border transition p-4"
      style={{
        borderColor: isMatch ? "#a3cf9180" : "#0000000d",
        background: isMatch ? "#fafff5" : "#fff",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: "#ee776815", color: "#a8463a" }}
        >
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-medium text-[#1a1d24] leading-snug">{s.name}</h3>
              <p className="text-[12px] text-[#1a1d24]/60 mt-0.5">{s.organism}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isMatch ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#a3cf9130] text-[#3a6f2c]">
                  <Sparkles size={10} /> Pour toi
                </span>
              ) : null}
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1a1d2408] text-[#1a1d24]/60 font-medium">
                {FUNDING_LABEL[s.fundingType]}
              </span>
            </div>
          </div>

          <p className="text-sm text-[#1a1d24]/80 mt-2">{s.description}</p>

          <div className="grid sm:grid-cols-3 gap-2 mt-3 text-[11px]">
            <div className="rounded-md bg-[#fafaf7] border border-black/5 px-2 py-1.5">
              <div className="text-[10px] text-[#1a1d24]/50 uppercase tracking-wider font-medium">
                Montant
              </div>
              <div className="font-medium font-mono mt-0.5">{formatAmount(s)}</div>
            </div>
            <div className="rounded-md bg-[#fafaf7] border border-black/5 px-2 py-1.5">
              <div className="text-[10px] text-[#1a1d24]/50 uppercase tracking-wider font-medium">
                Destinations
              </div>
              <div className="font-medium mt-0.5 truncate">
                {s.targetCountries.length === 0
                  ? "Monde / Europe"
                  : s.targetCountries
                      .map((c) => findCountry(c)?.flag ?? c)
                      .join(" ")}
              </div>
            </div>
            <div className="rounded-md bg-[#fafaf7] border border-black/5 px-2 py-1.5">
              <div className="text-[10px] text-[#1a1d24]/50 uppercase tracking-wider font-medium inline-flex items-center gap-1">
                <Calendar size={10} /> Candidatures
              </div>
              <div className="font-medium mt-0.5 truncate">
                {s.applicationCloses
                  ? `Clôture ${new Date(s.applicationCloses).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : "Au fil de l'eau"}
              </div>
            </div>
          </div>

          {s.amountNote ? (
            <p className="mt-2 text-[11px] text-[#1a1d24]/60 italic">{s.amountNote}</p>
          ) : null}

          {match && match.reasons.length > 0 ? (
            <details className="mt-2 text-[11px]">
              <summary className="cursor-pointer text-[#1a1d24]/60 hover:text-[#1a1d24]">
                {isMatch ? "Pourquoi ça matche pour toi" : "Pourquoi ça ne matche pas"}
              </summary>
              <ul className="mt-1 space-y-0.5 text-[#1a1d24]/70">
                {match.reasons.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            </details>
          ) : null}

          {s.criteria.note ? (
            <p className="mt-2 text-[11px] text-[#1a1d24]/55">
              <strong className="text-[#1a1d24]/70">Note :</strong> {s.criteria.note}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-black/5 text-[11px]">
            <span className="text-[#1a1d24]/50">
              Source : <span className="text-[#1a1d24]/70">{s.sourceLabel}</span> ·{" "}
              {new Date(s.sourceDate + "-01").toLocaleDateString("fr-FR", {
                month: "short",
                year: "numeric",
              })}
            </span>
            <a
              href={s.applicationUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-[#ee7768] font-medium hover:underline"
            >
              Postuler <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
