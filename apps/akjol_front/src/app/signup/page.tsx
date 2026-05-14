"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { useAuthStore } from "../../store/auth-store";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const signup = useAuthStore((s) => s.signup);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const next = params.get("next") || "/onboarding";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await signup(email.trim().toLowerCase(), password, name.trim() || undefined);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    // Nouvelle inscription : on envoie d'office sur /onboarding pour
    // construire le passeport. `next` reste honoré seulement si quelqu'un
    // l'a explicitement passé (rare ; cas de redirect post-login).
    router.replace(r.requiresOnboarding ? "/onboarding" : next);
  }

  function googleSignIn() {
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  }

  return (
    <PageContainer className="max-w-md py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <h1 className="text-3xl font-medium tracking-tight">Créer un compte</h1>
      <p className="text-sm text-[#1a1d24]/70 mt-1">
        Tu as déjà un compte ?{" "}
        <Link href="/login" className="text-[#ee7768] hover:underline">
          Connecte-toi.
        </Link>
      </p>

      <button
        onClick={googleSignIn}
        className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-medium hover:border-[#ee7768] transition"
      >
        <GoogleIcon /> S'inscrire avec Google
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-[11px] uppercase tracking-wider text-[#1a1d24]/40">ou</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#1a1d24]/50 mb-1">
            Prénom (optionnel)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Léa"
            autoComplete="given-name"
            className="w-full text-sm rounded-md border border-black/10 px-3 py-2 outline-none focus:border-[#ee7768]"
          />
        </div>
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
            autoComplete="email"
            className="w-full text-sm rounded-md border border-black/10 px-3 py-2 outline-none focus:border-[#ee7768]"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#1a1d24]/50 mb-1">
            Mot de passe
          </label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            autoComplete="new-password"
            minLength={8}
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
          <UserPlus size={14} />
          {busy ? "Création…" : "Créer mon compte"}
        </button>
        <p className="text-[11px] text-[#1a1d24]/50 leading-relaxed">
          En créant un compte, tu acceptes nos{" "}
          <Link href="/terms" className="underline hover:text-[#1a1d24]">
            CGU
          </Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="underline hover:text-[#1a1d24]">
            politique de confidentialité
          </Link>
          . Tes données restent locales par défaut.
        </p>
      </form>
    </PageContainer>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
