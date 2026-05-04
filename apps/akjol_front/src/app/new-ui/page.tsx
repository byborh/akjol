"use client";

import Link from "next/link";
import { ArrowRight, Compass, Globe2, Shield } from "lucide-react";
import { PageContainer } from "../../new-ui/components/PageContainer";
import { usePassportStore } from "../../new-ui/store/passport-store";

export default function LandingPage() {
  const isComplete = usePassportStore((s) => s.isComplete());
  return (
    <PageContainer className="pt-12">
      <section className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ee7768]/10 text-[#a8463a] text-xs font-medium mb-6">
          <Compass size={13} /> Phase 0 — passeport + cas Léa (FR)
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
          {isComplete ? (
            <Link
              href="/new-ui/explore"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
              style={{ background: "#ee7768" }}
            >
              Voir mes possibilités <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href="/new-ui/onboarding"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-white"
              style={{ background: "#ee7768" }}
            >
              Construire mon passeport <ArrowRight size={16} />
            </Link>
          )}
          <Link
            href="/new-ui/passport"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium text-[#1a1d24] border border-black/10 hover:border-[#ee7768] transition"
          >
            Mon profil
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

      <section className="mt-16 rounded-2xl border border-black/5 bg-white p-6">
        <div className="text-[11px] uppercase tracking-wider text-[#1a1d24]/40 font-medium mb-2">
          Cas test inclus dans cette preview
        </div>
        <div className="text-[#1a1d24] font-medium">
          Léa — France, BTS SIO 2A (en cours)
        </div>
        <p className="text-sm text-[#1a1d24]/70 mt-1">
          Léa veut savoir ce qu'elle peut faire après son BTS. AkJol lui montre Licence pro réseau, école d'ingé via
          ATS, master via L3, et bachelor en alternance — chacun avec conditions, suppositions et procédure.
        </p>
        <Link
          href="/new-ui/onboarding"
          className="inline-flex items-center gap-1 mt-4 text-[#ee7768] hover:underline text-sm font-medium"
        >
          Tester en tant que Léa <ArrowRight size={14} />
        </Link>
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
