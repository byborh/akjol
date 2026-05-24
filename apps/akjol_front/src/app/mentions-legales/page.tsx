import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";

export const metadata = {
  title: "Mentions légales — AkJol",
  description:
    "Identité de l'éditeur, hébergeur et contact pour le service AkJol, conformément à la loi LCEN.",
};

// NOTE éditeur : les champs marqués « À COMPLÉTER » dépendent de la création
// de la SASU (RCS, SIREN, capital social, siège). Tant que la structure
// juridique n'est pas immatriculée, la page reste accessible en MVP solo
// avec le statut « personne physique » — il faudra basculer dès que la
// SASU est immatriculée. cf. launch-checklist.md §1.4 et §1.5.

export default function MentionsLegalesPage() {
  return (
    <PageContainer className="max-w-3xl py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/70 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Retour
      </Link>

      <h1 className="text-3xl font-medium tracking-tight">Mentions légales</h1>
      <p className="text-[#1a1d24]/75 mt-2">
        Conformément aux articles 6-III et 19 de la loi pour la confiance dans l'économie numérique
        (LCEN). Dernière mise à jour&nbsp;: 2026-05-24.
      </p>

      <Section title="1. Éditeur du site">
        <p>
          Le site AkJol (akjol.app, akjol.fr et sous-domaines) est édité par&nbsp;:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>Raison sociale</strong>&nbsp;: <em>À COMPLÉTER (SASU AkJol — en cours d'immatriculation)</em>
          </li>
          <li>
            <strong>Forme juridique</strong>&nbsp;: <em>À COMPLÉTER (SASU au capital social de … €)</em>
          </li>
          <li>
            <strong>Siège social</strong>&nbsp;: <em>À COMPLÉTER (adresse postale)</em>
          </li>
          <li>
            <strong>RCS</strong>&nbsp;: <em>À COMPLÉTER (ville + numéro)</em>
          </li>
          <li>
            <strong>SIREN</strong>&nbsp;: <em>À COMPLÉTER</em>
          </li>
          <li>
            <strong>N° TVA intracommunautaire</strong>&nbsp;: <em>À COMPLÉTER si applicable</em>
          </li>
          <li>
            <strong>Directeur de la publication</strong>&nbsp;: <em>À COMPLÉTER (nom du président)</em>
          </li>
          <li>
            <strong>Email de contact</strong>&nbsp;:{" "}
            <a className="underline" href="mailto:contact@akjol.app">
              contact@akjol.app
            </a>
          </li>
        </ul>
      </Section>

      <Section title="2. Hébergeur">
        <p>Le site est hébergé par&nbsp;:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>Vercel Inc.</strong>
          </li>
          <li>
            <strong>Adresse</strong>&nbsp;: 440 N Wolfe Road, Sunnyvale, CA 94085, États-Unis
          </li>
          <li>
            <strong>Site</strong>&nbsp;:{" "}
            <a
              className="underline"
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com
            </a>
          </li>
          <li>
            <strong>Téléphone</strong>&nbsp;: +1 (650) 449-9229
          </li>
        </ul>
        <p className="mt-3 text-sm text-[#1a1d24]/70">
          La base de données est hébergée par Neon Inc. (Wilmington, DE 19808, États-Unis). Les
          transferts hors UE sont encadrés par les Clauses Contractuelles Types (SCCs) de la
          Commission européenne.
        </p>
      </Section>

      <Section title="3. Propriété intellectuelle">
        <p>
          Le code source d'AkJol (frontend, moteur de faisabilité, structure de données) est la
          propriété exclusive de l'éditeur. Les données d'orientation agrégées proviennent de
          sources publiques (ONISEP, MESR, Parcoursup, UCAS, Onisep open-data) et restent la
          propriété de leurs émetteurs respectifs — AkJol se contente d'en organiser la
          présentation. Toute reproduction, même partielle, du code ou des bases curées sans
          autorisation écrite préalable est interdite.
        </p>
      </Section>

      <Section title="4. Données personnelles">
        <p>
          Le traitement des données personnelles est détaillé dans notre{" "}
          <Link href="/privacy" className="underline">
            politique de confidentialité
          </Link>
          . Pour exercer tes droits (accès, rectification, effacement, portabilité, opposition),
          écris à{" "}
          <a className="underline" href="mailto:contact@akjol.app">
            contact@akjol.app
          </a>
          .
        </p>
      </Section>

      <Section title="5. Cookies & traceurs">
        <p>
          AkJol utilise un nombre minimal de traceurs&nbsp;: cookie de session (authentification),
          cookie de préférence linguistique, et analytics sans empreinte (Plausible, désactivable
          via{" "}
          <code className="text-xs">localStorage.akjol_analytics_optout</code> ou via le header DNT
          du navigateur). Aucune publicité comportementale, aucun cookie tiers de tracking.
        </p>
      </Section>

      <Section title="6. CNIL">
        <p>
          Tu peux à tout moment introduire une réclamation auprès de la Commission Nationale de
          l'Informatique et des Libertés (CNIL)&nbsp;:{" "}
          <a
            className="underline"
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            cnil.fr
          </a>
          .
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          Question, signalement, demande de retrait&nbsp;:{" "}
          <a className="underline" href="mailto:contact@akjol.app">
            contact@akjol.app
          </a>
          .
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
