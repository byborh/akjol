"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Compass, Globe2, Shield } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { usePassportStore } from "../store/passport-store";
import { useParcoursStore } from "../store/parcours-store";
import { useMounted } from "../hooks/useMounted";

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingInner />
    </Suspense>
  );
}

function LandingInner() {
  const mounted = useMounted();
  const isComplete = usePassportStore((s) => s.isComplete());
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
        setImported("Token invalide ou corrompu.");
        router.replace("/", { scroll: false });
      }
    }
  }, [params, importFromToken, router]);

  return (
    <PageContainer className="pt-12">
      {imported ? (
        <div className="mb-6 rounded-xl bg-[#a3cf9120] border border-[#a3cf91]/40 px-4 py-3 text-sm text-[#3a6f2c]">
          {imported}
        </div>
      ) : null}
      <section className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ee7768]/10 text-[#a8463a] text-xs font-medium mb-6">
          <Compass size={13} /> Preview — France · UK · Allemagne · Malaisie · États-Unis
        </div>
        <h1
          className="text-[2.6rem] sm:text-5xl leading-[1.05] font-medium text-[#1a1d24] tracking-tight"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Dis-moi où tu en es.<br />
          Je te montre <span style={{ color: "#ee7768" }}>toutes les vies possibles</span>.
        </h1>
        <p className="text-lg text-[#1a1d24]/70 mt-5 leading-relaxed">
          AkJol n'est pas un catalogue. C'est un <em>routeur d'études</em> : tu entres ton point de départ, l'app calcule
          les trajectoires accessibles dans le monde, leurs conditions, leurs probabilités et exactement comment postuler.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href={showExploreCTA ? "/explore" : "/onboarding"}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
            style={{ background: "#ee7768" }}
          >
            {showExploreCTA ? "Voir mes possibilités" : "Construire mon passeport"} <ArrowRight size={16} />
          </Link>
          <Link
            href="/passport"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-[#1a1d24] border border-black/10 hover:border-[#ee7768] transition"
          >
            Mon profil
          </Link>
          <Link
            href="/methodologie"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-[#1a1d24]/70 hover:text-[#ee7768] transition"
            title="Comment AkJol calcule ses probabilités, sources, biais"
          >
            <BookOpen size={15} /> Comment on calcule
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 mt-16">
        <FeatureCard
          icon={<Globe2 size={18} />}
          title="Routeur, pas catalogue"
          body="Une question (ton point de départ) → toutes les routes possibles, avec leurs conditions explicites."
        />
        <FeatureCard
          icon={<Shield size={18} />}
          title="Honnête sur les zones grises"
          body="Chaque probabilité est affichée avec son intervalle de confiance et la taille d'échantillon."
        />
        <FeatureCard
          icon={<Compass size={18} />}
          title="Conditions vs suppositions"
          body="On distingue ce qui est vérifiable de ce qu'AkJol est forcé de supposer. Aucune promesse cachée."
        />
      </section>

      <section className="mt-16">
        <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/40 font-medium mb-3">
          Cas tests inclus dans cette preview
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <article className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="text-[#1a1d24] font-medium inline-flex items-center gap-2">
              <span>🇫🇷</span> Léa — France, BTS SIO 2A
            </div>
            <p className="text-sm text-[#1a1d24]/70 mt-2 leading-relaxed">
              Veut savoir ce qu'elle peut faire après son BTS. AkJol lui montre Licence pro réseau,
              école d'ingé via ATS, master via L3, bachelor en alternance — avec conditions et
              probabilités.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 mt-3 text-[#ee7768] hover:underline text-sm font-medium"
            >
              Tester en tant que Léa <ArrowRight size={14} />
            </Link>
          </article>
          <article className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="text-[#1a1d24] font-medium inline-flex items-center gap-2">
              <span>🇲🇾</span> Lana — Malaisie, STPM en cours
            </div>
            <p className="text-sm text-[#1a1d24]/70 mt-2 leading-relaxed">
              Veut faire médecine ou ingé à l'international. AkJol calcule les corridors FR/UK/SG,
              les visa, le coût total et les bourses qui réduisent la facture (Eiffel, Chevening,
              Erasmus Mundus).
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 mt-3 text-[#ee7768] hover:underline text-sm font-medium"
            >
              Tester en tant que Lana <ArrowRight size={14} />
            </Link>
          </article>
        </div>
      </section>
    </PageContainer>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#ee7768]/10 text-[#ee7768] mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-[#1a1d24]">{title}</h3>
      <p className="text-sm text-[#1a1d24]/70 mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
