"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, ShieldX } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";
import { ANALYTICS_OPTOUT_KEY } from "../../components/PlausibleScript";

export default function DataPage() {
  const [optedOut, setOptedOut] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setOptedOut(localStorage.getItem(ANALYTICS_OPTOUT_KEY) === "1");
    } catch {
      setOptedOut(false);
    }
  }, []);

  function toggle() {
    try {
      if (optedOut) {
        localStorage.removeItem(ANALYTICS_OPTOUT_KEY);
        setOptedOut(false);
      } else {
        localStorage.setItem(ANALYTICS_OPTOUT_KEY, "1");
        setOptedOut(true);
      }
    } catch {
      // ignore
    }
  }

  return (
    <PageContainer className="max-w-3xl py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/70 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <h1 className="text-3xl font-medium tracking-tight">Données et télémétrie</h1>
      <p className="text-[#1a1d24]/75 mt-2">
        AkJol collecte des statistiques d'usage anonymes pour comprendre où les utilisateurs
        décrochent et améliorer le produit. Voilà précisément ce qui est mesuré et comment t'y
        soustraire.
      </p>

      <Section title="Ce qui est mesuré">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Pages vues (URL + referrer) et durée approximative — agrégées, pas reliées à un
            utilisateur.
          </li>
          <li>
            Événements produit ponctuels&nbsp;: «&nbsp;onboarding step N validée&nbsp;», «&nbsp;programme
            ajouté au plan&nbsp;», «&nbsp;calculer&nbsp;», sans détail individuel.
          </li>
          <li>
            Pays approximatif (depuis l'IP, jamais stockée), navigateur, taille d'écran — pour
            tester nos pages sur les bons devices.
          </li>
        </ul>
      </Section>

      <Section title="Ce qui n'est PAS mesuré">
        <ul className="list-disc pl-5 space-y-1">
          <li>Ton email, ton compte, ton passeport — jamais envoyés à l'outil d'analytics.</li>
          <li>Aucune empreinte d'appareil (fingerprint), aucun ID stable.</li>
          <li>Aucun cookie posé par Plausible — c'est le whole point.</li>
          <li>Pas de revente, pas de croisement avec un autre service.</li>
        </ul>
      </Section>

      <Section title="Outil utilisé">
        <p>
          <a className="underline" href="https://plausible.io/data-policy" target="_blank" rel="noreferrer">
            Plausible Analytics
          </a>{" "}
          — open-source, respectueux du RGPD par construction. Auto-hébergé en Europe.
        </p>
      </Section>

      <Section title="Durée de conservation">
        <p>
          Les événements sont agrégés à la journée et conservés <strong>90 jours maximum</strong>.
          Au-delà, seuls les totaux mensuels sont gardés (impossibles à dé-anonymiser).
        </p>
      </Section>

      <Section title="Ton choix">
        <p className="mb-3">
          La mesure d'audience est exemptée de consentement par la CNIL parce qu'elle est anonyme.
          Tu peux quand même t'y opposer en un clic. Ce choix est stocké dans <code>localStorage</code>
          {" "}et appliqué immédiatement à ce navigateur.
        </p>

        <div className="rounded-lg border border-black/10 bg-white p-4 flex items-start gap-3">
          {optedOut ? (
            <ShieldX size={20} className="text-[#7e2929] shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck size={20} className="text-[#3a6f2c] shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-medium">
              {optedOut === null
                ? "Chargement…"
                : optedOut
                  ? "Tu es désinscrit·e de la mesure d'audience"
                  : "Mesure d'audience anonyme active"}
            </div>
            <p className="text-[12px] text-[#1a1d24]/65 mt-1">
              {optedOut
                ? "Aucune statistique n'est envoyée depuis ce navigateur."
                : "Statistiques agrégées envoyées de manière anonyme."}
            </p>
            <button
              type="button"
              onClick={toggle}
              disabled={optedOut === null}
              className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1a1d24] text-white hover:bg-[#1a1d24]/85 disabled:opacity-50"
            >
              {optedOut ? "Réactiver la mesure d'audience" : "Désactiver pour ce navigateur"}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-[#1a1d24]/55 mt-3">
          Tu peux aussi activer Do Not Track dans les réglages de ton navigateur, AkJol le
          respecte automatiquement.
        </p>
      </Section>
    </PageContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <div className="prose prose-sm text-[#1a1d24]/85 mt-2 leading-relaxed">{children}</div>
    </section>
  );
}
