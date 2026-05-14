"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Coins,
  Download,
  IdCard,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { PlanTimeline } from "../../components/PlanTimeline";
import { DocumentsChecklist } from "../../components/DocumentsChecklist";
import { useAuthStore } from "../../store/auth-store";
import { usePassportStore } from "../../store/passport-store";
import { usePlanStore } from "../../store/plan-store";
import { useParcoursStore } from "../../store/parcours-store";
import { useDocumentsStore } from "../../store/documents-store";
import { useMounted } from "../../hooks/useMounted";
import { useSync } from "../../hooks/useSync";
import { findCountry } from "../../data/countries";
import { scholarshipsForPassport, formatAmount } from "../../data/scholarships";

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountInner />
    </Suspense>
  );
}

function AccountInner() {
  const router = useRouter();
  const params = useSearchParams();
  const mounted = useMounted();

  const user = useAuthStore((s) => s.user);
  const fetched = useAuthStore((s) => s.fetched);
  const refresh = useAuthStore((s) => s.refresh);
  const logout = useAuthStore((s) => s.logout);

  const passport = usePassportStore((s) => s.passport);
  const isComplete = usePassportStore((s) => s.isComplete());
  const savedPlan = usePassportStore((s) => s.savedPlan);
  const resetPassport = usePassportStore((s) => s.reset);
  const planItems = usePlanStore((s) => s.items);
  const parcours = useParcoursStore((s) => s.parcours);
  const documentsMetas = useDocumentsStore((s) => s.metas);
  const sync = useSync();

  const fromGoogle = params.get("from") === "google";

  useEffect(() => {
    if (!fetched) void refresh();
  }, [fetched, refresh]);

  // Post-OAuth Google : si la session est là mais le passeport vide → /onboarding.
  useEffect(() => {
    if (fromGoogle && mounted && user && !isComplete) {
      router.replace("/onboarding");
    }
  }, [fromGoogle, mounted, user, isComplete, router]);

  // Pas connecté : on pousse vers /login (avec next=/account pour revenir).
  useEffect(() => {
    if (fetched && !user) router.replace("/login?next=/account");
  }, [fetched, user, router]);

  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            user,
            passport,
            savedPlan,
            planItems,
            parcours,
            documentsMetas,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `akjol-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    const c1 = confirm(
      "Confirmer la suppression de toutes tes données (compte + passeport + plan + parcours + documents) ?",
    );
    if (!c1) return;
    const c2 = confirm("Vraiment ? Cette action est irréversible.");
    if (!c2) return;
    const c3 = prompt("Tape 'SUPPRIMER' pour confirmer définitivement.");
    if (c3 !== "SUPPRIMER") return;

    if (user) {
      try {
        const r = await fetch("/api/account", { method: "DELETE", credentials: "same-origin" });
        if (!r.ok && r.status !== 401) {
          alert(`Erreur serveur (${r.status}). Suppression locale uniquement.`);
        }
      } catch {
        alert("Réseau injoignable. Suppression locale uniquement.");
      }
    }

    resetPassport();
    localStorage.removeItem("akjol-plan-v1");
    localStorage.removeItem("akjol-parcours-v1");
    localStorage.removeItem("akjol-documents-v1");
    localStorage.removeItem("akjol-equivalences");
    if (user) void logout();
    alert("Toutes tes données sont effacées (DB + local).");
    router.push("/");
  }

  if (!mounted || !fetched) {
    return (
      <PageContainer className="max-w-3xl py-6">
        <p className="text-sm text-[#1a1d24]/50">Chargement…</p>
      </PageContainer>
    );
  }

  if (!user) {
    // Le useEffect a déclenché le redirect, on n'affiche rien le temps qu'il
    // ait lieu (évite un flash de contenu).
    return null;
  }

  const country = findCountry(passport.origin.country);
  const matchingScholarships = passport.origin.country
    ? scholarshipsForPassport(passport).filter((m) => m.isMatch).slice(0, 3)
    : [];

  return (
    <PageContainer className="max-w-3xl py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      {/* En-tête user */}
      <header className="rounded-xl bg-white border border-black/5 p-5 flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0"
          style={{ background: "#ee7768" }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-medium tracking-tight">Bonjour {user.name}</h1>
          <div className="text-sm text-[#1a1d24]/60 inline-flex items-center gap-1">
            <Mail size={12} /> {user.email}
          </div>
        </div>
        <button
          onClick={() => void logout()}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-black/10 hover:border-[#7e2929]/40"
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </header>

      {/* 1. Mon passeport */}
      <Section id="passport" icon={<IdCard size={16} />} title="Mon passeport">
        {!isComplete ? (
          <div className="text-center py-6">
            <p className="text-sm text-[#1a1d24]/60 mb-4">
              Tu n'as pas encore de passeport. C'est ton point de départ — d'où tu viens, où tu en
              es, ce que tu veux. AkJol te montrera les chemins possibles à partir de là.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white"
              style={{ background: "#ee7768" }}
            >
              Construire mon passeport
            </Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Pays d'origine">
                <span className="text-2xl mr-2">{country?.flag}</span>
                {country?.name ?? passport.origin.country}
              </Field>
              <Field label="Diplôme actuel">
                <div className="font-medium">{passport.currentDiploma?.label}</div>
                <div className="text-xs text-[#1a1d24]/60 mt-0.5">
                  {passport.currentDiploma?.status === "in_progress" ? "En cours" : "Obtenu"}
                  {passport.currentDiploma?.yearExpected
                    ? ` · ${passport.currentDiploma.yearExpected}`
                    : ""}
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
                    <li>
                      Budget ≤ {passport.constraints.maxBudgetPerYear.toLocaleString("fr-FR")} €/an
                    </li>
                  ) : null}
                  {passport.constraints.maxDurationYears ? (
                    <li>Durée ≤ {passport.constraints.maxDurationYears} ans</li>
                  ) : null}
                  {passport.constraints.workStudyPreferred ? <li>Préfère l'alternance</li> : null}
                  {passport.constraints.needsScholarship ? <li>Bourse nécessaire</li> : null}
                  {!passport.constraints.maxBudgetPerYear &&
                  !passport.constraints.maxDurationYears &&
                  !passport.constraints.workStudyPreferred &&
                  !passport.constraints.needsScholarship ? (
                    <li className="italic text-[#1a1d24]/50">Aucune contrainte renseignée</li>
                  ) : null}
                </ul>
              </Field>
              {passport.aspiration.domains.length ? (
                <Field label="Domaines visés">
                  <div className="flex flex-wrap gap-1.5">
                    {passport.aspiration.domains.map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-full bg-[#ee776815] text-[#a8463a] text-[12px]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </Field>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border border-black/10 hover:border-[#ee7768] transition"
              >
                <Pencil size={14} /> Modifier mon profil
              </Link>
              <button
                onClick={() => {
                  if (confirm("Réinitialiser ton passeport ? Cette action est irréversible."))
                    resetPassport();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border border-[#d96565]/30 text-[#7e2929] hover:bg-[#d9656510] transition"
              >
                <Trash2 size={14} /> Réinitialiser le passeport
              </button>
            </div>

            {matchingScholarships.length > 0 ? (
              <div className="rounded-xl bg-[#fafff5] border border-[#a3cf91]/40 p-4 mt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium inline-flex items-center gap-2">
                    <Sparkles size={14} className="text-[#3a6f2c]" /> Bourses pour toi
                  </h3>
                  <Link
                    href="/bourses"
                    className="text-[12px] text-[#3a6f2c] hover:underline font-medium"
                  >
                    Voir les {scholarshipsForPassport(passport).filter((m) => m.isMatch).length}{" "}
                    bourses →
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
          </>
        )}
      </Section>

      {/* 2. Mon plan */}
      <Section id="plan" icon={<CheckCircle2 size={16} />} title="Mon plan">
        <div className="text-sm text-[#1a1d24]/70 mb-3">
          <strong className="text-[#1a1d24]">{planItems.length}</strong> candidature
          {planItems.length > 1 ? "s" : ""} dans ton plan ·{" "}
          <strong className="text-[#1a1d24]">{savedPlan.length}</strong> programme
          {savedPlan.length > 1 ? "s" : ""} sauvegardé{savedPlan.length > 1 ? "s" : ""}.
        </div>
        <PlanTimeline />
      </Section>

      {/* 3. Mes documents */}
      <Section id="documents" icon={<Bookmark size={16} />} title="Mes documents">
        <div className="text-sm text-[#1a1d24]/70 mb-3">
          <strong className="text-[#1a1d24]">{Object.keys(documentsMetas).length}</strong> document
          {Object.keys(documentsMetas).length > 1 ? "s" : ""} suivi
          {Object.keys(documentsMetas).length > 1 ? "s" : ""}.
        </div>
        <DocumentsChecklist />
      </Section>

      {/* 4. Mes parcours */}
      <Section id="parcours" icon={<Sparkles size={16} />} title="Mes parcours sauvegardés">
        <ParcoursList />
      </Section>

      {/* 5. Informations de compte */}
      <Section id="info" icon={<LogIn size={16} />} title="Informations de compte">
        <dl className="space-y-2 text-sm">
          <Row label="Nom">{user.name}</Row>
          <Row label="Email">{user.email}</Row>
          <Row label="Rôle">{user.role ?? "student"}</Row>
          <Row label="Compte créé">
            {user.since
              ? new Date(user.since * 1000).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </Row>
        </dl>
      </Section>

      {/* 6. Confidentialité */}
      <Section id="privacy" icon={<Shield size={16} />} title="Confidentialité">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={exportData}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-black/10 hover:border-[#ee7768]"
          >
            <Download size={14} /> Télécharger mes données (JSON)
          </button>
          <button
            onClick={deleteAccount}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-[#d96565]/30 text-[#7e2929] hover:bg-[#d9656510]"
          >
            <Trash2 size={14} /> Supprimer mes données
          </button>
        </div>
        <p className="text-[11px] text-[#1a1d24]/50">
          RGPD — tu peux récupérer ou effacer toutes tes données à tout moment. Voir aussi notre{" "}
          <Link href="/privacy" className="underline hover:text-[#1a1d24]">
            politique de confidentialité
          </Link>
          .
        </p>
        <div className="mt-4">
          <SyncBadge sync={sync} />
        </div>
      </Section>
    </PageContainer>
  );
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl bg-white border border-black/5 p-5 mb-5 scroll-mt-20">
      <h2 className="text-base font-medium text-[#1a1d24] mb-4 inline-flex items-center gap-2">
        <span className="text-[#ee7768]">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#fafaf7] border border-black/5 p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/50 font-medium mb-1">
        {label}
      </div>
      <div className="text-[#1a1d24]">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-[#1a1d24]/50 w-32 shrink-0">{label}</dt>
      <dd className="text-[#1a1d24]">{children}</dd>
    </div>
  );
}

function ParcoursList() {
  const parcours = useParcoursStore((s) => s.parcours);
  const remove = useParcoursStore((s) => s.deleteParcours);

  if (parcours.length === 0) {
    return (
      <div className="text-center py-6">
        <Bookmark size={20} className="mx-auto text-[#1a1d24]/40 mb-2" />
        <h3 className="font-medium text-[#1a1d24]">Aucun parcours sauvegardé</h3>
        <p className="text-sm text-[#1a1d24]/60 mt-1">
          Sur{" "}
          <Link href="/explore" className="text-[#ee7768] hover:underline">
            /explore
          </Link>
          , empile des étapes via « Continuer depuis ici » puis sauve la trajectoire dans « Mes
          parcours ».
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
          className="block rounded-xl bg-[#fafaf7] border border-black/5 hover:border-[#ee7768]/40 transition p-3 group"
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

function SyncBadge({ sync }: { sync: ReturnType<typeof useSync> }) {
  const { status, lastSyncedAt, error } = sync;
  const stamp = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  if (status === "synced") {
    return (
      <div className="rounded-xl bg-[#a3cf9120] border border-[#a3cf91]/40 p-3 text-[12px] text-[#3a6f2c] flex items-center gap-2">
        <CheckCircle2 size={14} />
        <span>
          <strong>Synchronisé avec ton compte.</strong> Dernière sync à {stamp}.
        </span>
      </div>
    );
  }
  if (status === "pulling" || status === "pushing") {
    return (
      <div className="rounded-xl bg-[#fcf6e8] border border-[#e6c068]/30 p-3 text-[12px] text-[#8a5314] flex items-center gap-2">
        <RefreshCw size={14} className="animate-spin" />
        <span>{status === "pulling" ? "Chargement de tes données…" : "Sauvegarde en cours…"}</span>
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div className="rounded-xl bg-[#fcf6e8] border border-[#e6c068]/30 p-3 text-[12px] text-[#8a5314] flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>
          <strong>Mode local uniquement.</strong> La DB serveur est indisponible — tes données
          restent sur cet appareil.
        </span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="rounded-xl bg-[#d9656520] border border-[#d96565]/40 p-3 text-[12px] text-[#7e2929] flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>
          <strong>Sync en échec.</strong> {error ?? "Erreur inconnue."}
        </span>
      </div>
    );
  }
  return null;
}
