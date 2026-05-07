import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageContainer } from "../../components/PageContainer";

export const metadata = {
  title: "Méthodologie — AkJol",
  description:
    "Comment AkJol calcule ses probabilités, d'où viennent les chiffres, où sont les biais.",
};

export default function MethodologiePage() {
  return (
    <PageContainer className="max-w-3xl py-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-[#1a1d24]/60 hover:text-[#1a1d24] mb-6"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <h1 className="text-3xl font-medium tracking-tight">Comment AkJol calcule</h1>
      <p className="text-[#1a1d24]/70 mt-2">
        Engagement d'honnêteté épistémique — un site qui produit « 78% de chances » sans expliquer
        comment il les calcule est intrinsèquement non-fiable. Voici comment AkJol fonctionne.
      </p>

      <Section title="1. Comment on calcule la probabilité">
        <p>
          Chaque programme a un statut <strong>ouvert / avec une étape / fermé</strong> selon ton
          passeport. Le score (en %) part d'une base et s'ajuste avec des modificateurs explicites :
        </p>
        <pre className="mt-3 text-[12px] bg-[#1a1d24] text-white/90 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
{`base = 50%

si statut == "fermé"               → 5%
sinon si statut == "avec étape"   → 55%
sinon (ouvert) :
  base = 60%
  + 15% si moyenne ≥ minGrade requise
  +  5% si niveau de langue STRICTEMENT au-dessus du minimum
  +  5% si alternance proposée et tu la préfères
  +  5% si un domaine du programme matche tes aspirations

clamp à [2%, 97%]`}
        </pre>
        <p className="text-[12px] text-[#1a1d24]/60 mt-2">
          Modèle <strong>v1.5</strong> — ces coefficients sont délibérément simples. Pas de
          régression cachée, pas de réseau de neurones opaque.
        </p>
      </Section>

      <Section title="2. Sources des données">
        <ul className="space-y-1.5 list-disc pl-5">
          <li>
            <strong>Programmes & écoles FR</strong> — agrégation manuelle inspirée d'ONISEP /
            Mon Master / fiches école publiques. Mise à jour 2026-01.{" "}
            <Source href="https://www.onisep.fr">ONISEP</Source>{" "}
            <Source href="https://www.monmaster.gouv.fr">Mon Master</Source>
          </li>
          <li>
            <strong>Programmes UK / DE / US / SG</strong> — sites officiels universités + UCAS pour UK.{" "}
            <Source href="https://www.ucas.com">UCAS</Source>
          </li>
          <li>
            <strong>Diplômes & équivalences</strong> — base interne, éditable dans la console
            curator <code>/admin/graph</code>.
          </li>
          <li>
            <strong>Visas</strong> — France-Visas, GOV.UK Student Visa, Make-it-in-Germany, ICA
            Singapore, IRCC Canada. Date de revue marquée sur chaque corridor.
          </li>
          <li>
            <strong>Coût de la vie</strong> — agrégation Numbeo / Eurostudent. ~20 villes
            étudiantes principales.
          </li>
          <li>
            <strong>Salaires médians</strong> — INSEE DADS pour FR, ONS pour UK, BLS pour US, à
            jour 2024.{" "}
            <Source href="https://www.insee.fr/fr/statistiques/series/108125736">INSEE DADS</Source>
          </li>
          <li>
            <strong>Métiers</strong> — référentiel ROME (Pôle Emploi) + ESCO côté UE.
          </li>
        </ul>
      </Section>

      <Section title="3. Conditions vs Suppositions">
        <p>
          Chaque feasibility distingue trois listes :
        </p>
        <ul className="space-y-1.5 list-disc pl-5 mt-2">
          <li>
            <strong>Conditions remplies / non remplies</strong> — vérifiable maintenant : diplôme
            reconnu, niveau de langue déclaré, budget vs frais, etc. C'est <em>factuel</em>.
          </li>
          <li>
            <strong>Suppositions</strong> — ce qu'AkJol présume sans pouvoir vérifier (ex : « ton
            BTS sera validé en 2026 », « la sélection 2026-2027 ressemble à 2024-2025 »).
          </li>
          <li>
            <strong>À maximiser</strong> — actions concrètes qui font monter ta probabilité
            (certificat de langue, stage, lettre de motivation).
          </li>
        </ul>
      </Section>

      <Section title="4. Limites connues">
        <ul className="space-y-1.5 list-disc pl-5">
          <li>AkJol ne modélise pas la qualité subjective de la lettre de motivation.</li>
          <li>Pas de pondération du réseau personnel ou des contacts.</li>
          <li>Pas d'accommodations handicap dans le moteur — à venir.</li>
          <li>Le calcul des durées des trajectoires assume un parcours linéaire sans redoublement.</li>
          <li>
            Les conversions de devises utilisent des taux fixes (mis à jour manuellement). Pas de
            correction quotidienne du change.
          </li>
          <li>
            Les bourses ne sont pas encore intégrées au calcul de probabilité (uniquement au
            budget).
          </li>
        </ul>
      </Section>

      <Section title="5. Biais identifiés">
        <ul className="space-y-1.5 list-disc pl-5">
          <li>
            <strong>Sur-représentation FR.</strong> ~70% du dataset est français. Les corridors
            internationaux MY → FR/UK/DE/US/SG sont prioritaires en couverture.
          </li>
          <li>
            <strong>Écoles privées avec budget marketing</strong> apparaissent plus souvent — à
            réguler avec des critères plus stricts d'inclusion catalogue.
          </li>
          <li>
            <strong>Métiers Tech sur-représentés</strong> — les domaines Santé / Droit / Arts sont
            sous-couverts.
          </li>
          <li>
            <strong>Sample size limité</strong> sur la probabilité (basedOn) — affichée
            explicitement avec l'intervalle de confiance.
          </li>
        </ul>
      </Section>

      <Section title="6. Apprentissage continu">
        <p>
          À partir des votes 👍/👎 sur les recommandations, AkJol ajuste périodiquement les
          coefficients du moteur et publie les changements ci-dessous.
        </p>
        <ul className="space-y-1 list-disc pl-5 mt-2 text-[12px] text-[#1a1d24]/70">
          <li>
            <strong>v1.5</strong> — ajout du bonus +5% si domaine match les aspirations.
          </li>
          <li>
            <strong>v1.4</strong> — pénalité explicite si budget &gt; maxBudgetPerYear.
          </li>
          <li>
            <strong>v1.3</strong> — distinction « avec étape » vs « ouvert ».
          </li>
        </ul>
      </Section>

      <Section title="7. Comment contribuer / signaler">
        <p>
          AkJol est un projet ouvert. Si tu vois un programme manquant, une équivalence fausse, une
          source obsolète :
        </p>
        <ul className="space-y-1.5 list-disc pl-5 mt-2">
          <li>
            Ouvre une issue sur le dépôt GitHub (lien à venir).
          </li>
          <li>
            Si tu es curator validé, propose la modification dans{" "}
            <Link href="/admin/graph" className="text-[#ee7768] hover:underline">
              /admin/graph
            </Link>
            .
          </li>
        </ul>
      </Section>

      <p className="text-[12px] text-[#1a1d24]/50 mt-10">
        Dernière revue : 2026-05-07. Toute donnée affichée doit être interprétée comme une aide à
        la décision, jamais comme une promesse.
      </p>
    </PageContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-medium tracking-tight">{title}</h2>
      <div className="mt-3 text-[14px] leading-relaxed text-[#1a1d24]/85 space-y-2">{children}</div>
    </section>
  );
}

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[#ee7768] hover:underline"
    >
      {children}
      <ExternalLink size={11} />
    </a>
  );
}
