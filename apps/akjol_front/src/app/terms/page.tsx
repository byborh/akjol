import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";

export const metadata = {
  title: "Conditions d'utilisation — AkJol",
  description: "Règles d'utilisation d'AkJol, limites de responsabilité, propriété intellectuelle.",
};

export default function TermsPage() {
  return (
    <PageContainer className="max-w-3xl py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/70 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <h1 className="text-3xl font-medium tracking-tight">Conditions d'utilisation</h1>
      <p className="text-[#1a1d24]/75 mt-2">
        Statut MVP — service en développement, fourni en l'état. Dernière mise à jour&nbsp;:
        2026-05-13.
      </p>

      <Section title="1. Objet">
        <p>
          AkJol est un service d'aide à l'orientation et à la planification de candidatures
          d'études supérieures. Il fournit des informations agrégées issues de sources publiques
          (ONISEP, MESR, Parcoursup, UCAS…) et un moteur de calcul de faisabilité.
        </p>
      </Section>

      <Section title="2. Pas un conseil officiel">
        <p>
          AkJol est un outil d'information. <strong>Les résultats affichés (probabilités, statuts,
          recommandations) ne valent pas conseil d'orientation officiel</strong>. Vérifie toujours
          les informations critiques (dates de candidature, prérequis, frais, visa) auprès des
          sources officielles avant d'agir. Les écoles et plateformes (Parcoursup, Mon Master,
          UCAS…) restent la seule autorité sur leurs propres conditions d'admission.
        </p>
      </Section>

      <Section title="3. Compte">
        <p>
          La création de compte est facultative — AkJol fonctionne en mode anonyme (localStorage)
          si tu ne te connectes pas. En te connectant, tu déclares fournir une adresse email
          valide t'appartenant. Tu es responsable de la confidentialité de l'accès à ta boîte mail.
        </p>
      </Section>

      <Section title="4. Données">
        <p>
          Voir <Link href="/privacy" className="underline">Confidentialité</Link>. Tu restes
          propriétaire des données que tu saisis. AkJol s'engage à ne jamais les revendre ni les
          partager à des fins commerciales.
        </p>
      </Section>

      <Section title="5. Disponibilité">
        <p>
          AkJol est fourni «&nbsp;en l'état&nbsp;», sans garantie de disponibilité ou
          d'exactitude. Des interruptions de service peuvent survenir (maintenance, montée en
          charge). La donnée ingérée depuis des sources tierces peut être obsolète.
        </p>
      </Section>

      <Section title="6. Limite de responsabilité">
        <p>
          AkJol ne peut être tenu responsable des décisions d'orientation prises sur la base des
          informations affichées, ni des conséquences d'une candidature retardée, rejetée ou mal
          renseignée. Vérifie tes deadlines et tes documents auprès des plateformes officielles.
        </p>
      </Section>

      <Section title="7. Propriété intellectuelle">
        <p>
          Le code source d'AkJol est open-source (licence à préciser au passage en production).
          Les données ingérées (ONISEP, INSEE…) sont diffusées sous Licence Ouverte / Etalab 2.0.
          Les marques (logos d'écoles, drapeaux pays) restent la propriété de leurs détenteurs.
        </p>
      </Section>

      <Section title="8. Utilisation acceptable">
        <ul className="list-disc pl-5 space-y-1">
          <li>Ne pas scraper massivement l'API (rate-limit serveur).</li>
          <li>Ne pas saisir de fausses informations à des fins frauduleuses (ex. demande de bourse).</li>
          <li>Ne pas tenter de contourner les protections d'authentification.</li>
          <li>Respecter les autres utilisateurs (témoignages, contributions futures).</li>
        </ul>
      </Section>

      <Section title="9. Droit applicable">
        <p>
          Les présentes conditions sont régies par le droit français. Tout litige relèvera des
          tribunaux compétents du ressort du siège social de l'éditeur. Pour les utilisateurs
          consommateurs, les règles protectrices du Code de la consommation s'appliquent.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Question, signalement, demande de retrait&nbsp;:{" "}
          <a className="underline" href="mailto:hello@akjol.app">hello@akjol.app</a>.
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
