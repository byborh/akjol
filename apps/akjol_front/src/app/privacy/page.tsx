import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";

export const metadata = {
  title: "Confidentialité — AkJol",
  description:
    "Quelles données AkJol collecte, comment elles sont stockées, et comment exercer tes droits RGPD.",
};

export default function PrivacyPage() {
  return (
    <PageContainer className="max-w-3xl py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/70 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <h1 className="text-3xl font-medium tracking-tight">Confidentialité</h1>
      <p className="text-[#1a1d24]/75 mt-2">
        Cette page décrit, en clair, quelles données AkJol collecte, pourquoi, combien de temps,
        et comment exercer tes droits RGPD. Dernière mise à jour&nbsp;: 2026-05-13.
      </p>

      <Section title="1. Qui édite AkJol">
        <p>
          AkJol est un service en cours de développement (statut MVP) — projet open-source visant
          à aider les étudiants à construire une trajectoire d'études. Pour toute question RGPD,
          contact&nbsp;: <a className="underline" href="mailto:privacy@akjol.app">privacy@akjol.app</a>.
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>Deux catégories, et seulement deux&nbsp;:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>
            <strong>Données de compte</strong> (si tu te connectes)&nbsp;: email, prénom (facultatif),
            date de création, dernière connexion. Stockés en base SQLite côté serveur.
          </li>
          <li>
            <strong>Données d'usage</strong> que tu produis volontairement&nbsp;: passeport (origine,
            diplômes en cours, contraintes), plan de candidature, parcours sauvegardés, documents
            cochés. Stockés en local sur ton appareil (localStorage) + en base si tu es connecté·e
            (synchronisation entre tes devices).
          </li>
        </ul>
        <p className="mt-3 text-[#1a1d24]/75">
          AkJol <strong>ne collecte pas</strong>&nbsp;: ton nom complet, ton adresse postale, ton
          numéro de téléphone, ta photo, tes notes scolaires précises, ton historique de navigation
          hors AkJol, ni aucune donnée biométrique.
        </p>
      </Section>

      <Section title="3. Cookies et traceurs">
        <p>
          AkJol utilise <strong>un seul cookie technique</strong>&nbsp;: <code>akjol_session</code>,
          signé HMAC, HttpOnly, durée 30 jours, qui sert à reconnaître ton compte si tu te
          connectes. Pas de cookie publicitaire, pas de Google Analytics, pas de tracker tiers.
        </p>
        <p className="mt-2">
          Mesure d'audience anonyme via Plausible (auto-hébergé, sans cookie, sans empreinte
          d'appareil) — voir <Link href="/data" className="underline">page Données</Link> pour les
          détails et l'opt-out.
        </p>
      </Section>

      <Section title="4. Base légale">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Compte + sync</strong>&nbsp;: exécution du service que tu demandes
            (art. 6.1.b RGPD).
          </li>
          <li>
            <strong>Cookies techniques</strong>&nbsp;: intérêt légitime, exemption de consentement
            (recommandation CNIL).
          </li>
          <li>
            <strong>Mesure d'audience anonyme</strong>&nbsp;: exemption de consentement CNIL (pas
            d'identifiant utilisateur, pas de croisement tiers).
          </li>
        </ul>
      </Section>

      <Section title="5. Durée de conservation">
        <ul className="list-disc pl-5 space-y-1">
          <li>Compte&nbsp;: tant qu'il est actif. Suppression à la demande, ou après 3 ans sans connexion.</li>
          <li>Données de plan / passeport&nbsp;: identique au compte.</li>
          <li>Logs serveur (IP, user-agent, status HTTP)&nbsp;: 90 jours max, agrégés ensuite.</li>
          <li>Cookie session&nbsp;: 30 jours, rotation à chaque login.</li>
        </ul>
      </Section>

      <Section title="6. Tes droits">
        <p>Tu peux à tout moment, depuis <Link href="/account" className="underline">/account</Link>&nbsp;:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Accès</strong>&nbsp;: «&nbsp;Exporter mes données&nbsp;» (JSON complet).</li>
          <li><strong>Rectification</strong>&nbsp;: modifier ton passeport, ton plan, etc.</li>
          <li>
            <strong>Effacement</strong>&nbsp;: «&nbsp;Supprimer mon compte&nbsp;» (suppression
            immédiate, sans confirmation différée — fais-le seulement si tu es sûr·e).
          </li>
          <li><strong>Portabilité</strong>&nbsp;: format JSON standard, ré-importable ailleurs.</li>
          <li>
            <strong>Opposition</strong> à la mesure d'audience anonyme&nbsp;:{" "}
            <Link href="/data" className="underline">page Données</Link>.
          </li>
        </ul>
        <p className="mt-3">
          Tu peux aussi déposer une plainte auprès de la CNIL si tu estimes que tes droits ne sont
          pas respectés&nbsp;: <a className="underline" href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>.
        </p>
      </Section>

      <Section title="7. Sécurité">
        <p>
          Mots de passe&nbsp;: il n'y en a pas. AkJol n'utilise que des cookies signés
          (HMAC-SHA256). Aucune donnée sensible (santé, handicap, opinion politique) n'est
          collectée. Les bases sont sauvegardées chaque nuit, chiffrées au repos.
        </p>
      </Section>

      <Section title="8. Sous-traitants">
        <p>
          AkJol héberge ses serveurs en Europe (région eu-west). Aucun sous-traitant hors UE pour
          le stockage des données utilisateur. Les services de polices (Google Fonts) sont
          self-hosted via <code>next/font</code> (pas de requête vers Google).
        </p>
      </Section>

      <Section title="9. Modifications">
        <p>
          Toute évolution matérielle de cette politique sera notifiée 30 jours avant prise d'effet
          sur la page d'accueil et par email aux comptes actifs.
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
