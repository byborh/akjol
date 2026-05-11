"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LogOut, LogIn, Download, Trash2, Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { useAuthStore } from "../../store/auth-store";
import { usePassportStore } from "../../store/passport-store";
import { usePlanStore } from "../../store/plan-store";
import { useParcoursStore } from "../../store/parcours-store";
import { useDocumentsStore } from "../../store/documents-store";
import { useSync } from "../../hooks/useSync";

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const fetched = useAuthStore((s) => s.fetched);
  const refresh = useAuthStore((s) => s.refresh);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const passport = usePassportStore((s) => s.passport);
  const savedPlan = usePassportStore((s) => s.savedPlan);
  const resetPassport = usePassportStore((s) => s.reset);
  const planItems = usePlanStore((s) => s.items);
  const parcours = useParcoursStore((s) => s.parcours);
  const documentsMetas = useDocumentsStore((s) => s.metas);
  const sync = useSync();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await login(email.trim(), name.trim() || undefined);
    setBusy(false);
    if (!r.ok) setErr(r.error ?? "Connexion impossible");
  }

  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            user,
            passport,
            savedPlan,
            planItems,
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
    const c1 = confirm("Confirmer la suppression de toutes tes données (compte + passeport + plan + parcours + documents) ?");
    if (!c1) return;
    const c2 = confirm("Vraiment ? Cette action est irréversible.");
    if (!c2) return;
    const c3 = prompt("Tape 'SUPPRIMER' pour confirmer définitivement.");
    if (c3 !== "SUPPRIMER") return;

    // Si compte serveur : DELETE /api/account purge la DB en cascade.
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

    // Wipe local quel que soit le succès serveur (RGPD côté navigateur).
    resetPassport();
    localStorage.removeItem("akjol-plan-v1");
    localStorage.removeItem("akjol-parcours-v1");
    localStorage.removeItem("akjol-documents-v1");
    localStorage.removeItem("akjol-equivalences");
    if (user) void logout();
    alert("Toutes tes données sont effacées (DB + local).");
  }

  return (
    <PageContainer className="max-w-2xl py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <h1 className="text-3xl font-medium tracking-tight">Mon compte</h1>
      <p className="text-sm text-[#1a1d24]/70 mt-1">
        Session signée par cookie. Ton passeport reste stocké localement sur cet appareil
        (la sync cross-device arrivera plus tard).
      </p>

      {!fetched ? (
        <p className="text-sm text-[#1a1d24]/50 mt-6">Chargement…</p>
      ) : user ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-white border border-black/5 p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg"
              style={{ background: "#ee7768" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-[#1a1d24]/60 inline-flex items-center gap-1">
                <Mail size={12} /> {user.email}
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-black/10 hover:border-[#7e2929]/40"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>

          <div className="rounded-xl bg-white border border-black/5 p-5">
            <h2 className="text-sm font-medium mb-2">Tes données</h2>
            <ul className="text-[12px] space-y-0.5 text-[#1a1d24]/70">
              <li>
                Passeport :{" "}
                {passport.currentDiploma ? (
                  <span className="text-[#1a1d24]">{passport.currentDiploma.label}</span>
                ) : (
                  <span className="italic">non rempli</span>
                )}
              </li>
              <li>
                Programmes sauvegardés :{" "}
                <span className="text-[#1a1d24]">{savedPlan.length}</span>
              </li>
              <li>
                Candidatures dans le plan :{" "}
                <span className="text-[#1a1d24]">{planItems.length}</span>
              </li>
              <li>
                Parcours sauvegardés : <span className="text-[#1a1d24]">{parcours.length}</span>
              </li>
              <li>
                Documents suivis :{" "}
                <span className="text-[#1a1d24]">{Object.keys(documentsMetas).length}</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-3">
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
            <p className="mt-2 text-[11px] text-[#1a1d24]/50">
              RGPD — tu peux récupérer ou effacer toutes tes données à tout moment.
            </p>
          </div>

          <SyncBadge sync={sync} />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <form
            onSubmit={onSubmit}
            className="rounded-xl bg-white border border-black/5 p-5 space-y-3"
          >
            <h2 className="text-sm font-medium inline-flex items-center gap-2">
              <LogIn size={14} /> Se connecter
            </h2>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#1a1d24]/50 mb-1">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.fr"
                className="w-full text-sm rounded-md border border-black/10 px-3 py-2 outline-none focus:border-[#ee7768]"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#1a1d24]/50 mb-1">
                Prénom (optionnel)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Léa"
                className="w-full text-sm rounded-md border border-black/10 px-3 py-2 outline-none focus:border-[#ee7768]"
              />
            </div>
            {err ? <p className="text-[12px] text-[#7e2929]">{err}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white"
              style={{ background: "#ee7768", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "Connexion…" : "Continuer"}
            </button>
            <p className="text-[11px] text-[#1a1d24]/50">
              Auth démo (sans mot de passe). En production, magic-link email + Google.
            </p>
          </form>
        </div>
      )}
    </PageContainer>
  );
}

function SyncBadge({ sync }: { sync: ReturnType<typeof useSync> }) {
  const { status, lastSyncedAt, error } = sync;
  const stamp = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  if (status === "synced") {
    return (
      <div className="rounded-xl bg-[#a3cf9120] border border-[#a3cf91]/40 p-4 text-[12px] text-[#3a6f2c] flex items-center gap-2">
        <CheckCircle2 size={14} />
        <span>
          <strong>Synchronisé avec ton compte.</strong> Dernière sync à {stamp}. Tu peux te connecter
          depuis un autre appareil, tes données te suivent.
        </span>
      </div>
    );
  }
  if (status === "pulling" || status === "pushing") {
    return (
      <div className="rounded-xl bg-[#fcf6e8] border border-[#e6c068]/30 p-4 text-[12px] text-[#8a5314] flex items-center gap-2">
        <RefreshCw size={14} className="animate-spin" />
        <span>
          {status === "pulling" ? "Chargement de tes données…" : "Sauvegarde en cours…"}
        </span>
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div className="rounded-xl bg-[#fcf6e8] border border-[#e6c068]/30 p-4 text-[12px] text-[#8a5314] flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>
          <strong>Mode local uniquement.</strong> La DB serveur est indisponible — tes données
          restent sur cet appareil. La sync reprendra dès que la connexion DB revient (rien à
          faire de ton côté).
        </span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="rounded-xl bg-[#d9656520] border border-[#d96565]/40 p-4 text-[12px] text-[#7e2929] flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>
          <strong>Sync en échec.</strong> {error ?? "Erreur inconnue."} Tes données locales sont
          intactes — la prochaine modification re-tentera la sync.
        </span>
      </div>
    );
  }
  return null;
}
