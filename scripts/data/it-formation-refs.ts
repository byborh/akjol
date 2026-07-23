/**
 * Dictionnaire de référence des formations informatique (Bac+2/3).
 *
 * Idée clé : les débouchés, diplômes acceptés, domaines et poursuites d'études
 * dépendent du *type de diplôme*, pas de l'établissement. Un BUT Informatique a
 * les mêmes débouchés partout. On écrit donc la connaissance UNE fois par type,
 * et enrich-rules.ts l'applique à toutes les fiches brutes correspondantes —
 * gratuit, instantané, cohérent, sans LLM.
 *
 * Données issues des référentiels publics (ONISEP / France Travail / programmes
 * nationaux). À compléter/affiner librement : ajoute une entrée pour tout type
 * qui ressort en "non reconnu" lors d'un run.
 *
 * `test` s'applique au libellé en MAJUSCULES SANS ACCENTS (voir normalize()).
 * L'ordre compte : du plus spécifique au plus générique.
 */
export type FormationRef = {
  /** Identifiant lisible (logs). */
  key: string;
  /** Nom court pour les titres (ex: "BTS SIO"). */
  short: string;
  /** Libellé propre affiché (ex: "BTS Services informatiques aux organisations (SIO)"). */
  label: string;
  /** Code formation interne (BTS, BUT, LICENCE…). */
  code: string;
  /** ProgramLevel AkJol. */
  level: string;
  /** Match sur le libellé normalisé (MAJUSCULES, sans accents). */
  test: RegExp;
  /** Durée en années (corrige l'inférence : BTS = 2, BUT = 3…). */
  durationYears: number;
  domains: string[];
  outcomesJobs: string[];
  acceptedDiplomas: string[];
  /** Codes ProgramLevel de poursuite. */
  outcomesNextLevels: string[];
  recommendsInternshipWeeks: number;
  description: string;
};

export const IT_FORMATION_REFS: FormationRef[] = [
  {
    key: "BUT_MMI",
    short: "BUT MMI",
    label: "BUT Métiers du multimédia et de l'internet (MMI)",
    code: "BUT",
    level: "bachelor",
    test: /MMI|MULTIMEDIA|METIERS DU MULTIMEDIA|MULTIMEDIA ET DE L INTERNET/,
    durationYears: 3,
    domains: ["Développement web", "Communication numérique", "Audiovisuel", "UX / Design"],
    outcomesJobs: [
      "Développeur web",
      "Webdesigner",
      "Intégrateur web",
      "Chef de projet digital",
      "Community manager",
      "Référenceur SEO",
    ],
    acceptedDiplomas: ["Bac général", "Bac STMG", "Bac STI2D", "Bac STD2A", "Bac pro"],
    outcomesNextLevels: ["licence_pro", "bachelor", "master"],
    recommendsInternshipWeeks: 22,
    description:
      "Le BUT Métiers du multimédia et de l'internet (MMI) forme en 3 ans des profils polyvalents à la croisée du développement web, de la communication numérique et de la création audiovisuelle.",
  },
  {
    key: "BUT_RT",
    short: "BUT R&T",
    label: "BUT Réseaux et télécommunications (R&T)",
    code: "BUT",
    level: "bachelor",
    test: /(BUT|DUT|B\.?U\.?T).*(RESEAUX ET TELECOM|RESEAUX & TELECOM|\bR&T\b|\bRT\b)/,
    durationYears: 3,
    domains: ["Réseaux", "Télécoms", "Systèmes", "Cybersécurité"],
    outcomesJobs: [
      "Administrateur réseaux",
      "Technicien télécoms",
      "Technicien systèmes et réseaux",
      "Technicien sécurité réseaux",
    ],
    acceptedDiplomas: ["Bac général (spé sciences)", "Bac STI2D", "Bac pro SN"],
    outcomesNextLevels: ["licence_pro", "master", "ecole_inge"],
    recommendsInternshipWeeks: 22,
    description:
      "Le BUT Réseaux et télécommunications (R&T) forme en 3 ans des spécialistes de la conception, du déploiement et de l'administration des réseaux informatiques et télécoms.",
  },
  {
    key: "BTS_SIO",
    short: "BTS SIO",
    label: "BTS Services informatiques aux organisations (SIO)",
    code: "BTS",
    level: "bachelor",
    test: /BTS.*SIO|SERVICES INFORMATIQUES AUX ORGANISATIONS|\bSISR\b|\bSLAM\b/,
    durationYears: 2,
    domains: ["Réseaux", "Systèmes", "Développement", "Cybersécurité"],
    outcomesJobs: [
      "Technicien support",
      "Administrateur systèmes et réseaux",
      "Développeur d'applications",
      "Technicien d'infrastructure",
    ],
    acceptedDiplomas: ["Bac général", "Bac STI2D", "Bac STMG", "Bac pro SN", "Bac pro MELEC"],
    outcomesNextLevels: ["licence_pro", "bachelor"],
    recommendsInternshipWeeks: 8,
    description:
      "Le BTS Services informatiques aux organisations (SIO) forme en 2 ans des techniciens IT, en option SISR (solutions d'infrastructure, systèmes et réseaux) ou SLAM (solutions logicielles et applications métiers).",
  },
  {
    key: "BTS_SNIR",
    short: "BTS SNIR",
    label: "BTS Systèmes numériques – Informatique et réseaux (SNIR)",
    code: "BTS",
    level: "bachelor",
    test: /\bSNIR\b|SYSTEMES NUMERIQUES.*INFORMATIQUE ET RESEAUX/,
    durationYears: 2,
    domains: ["Réseaux", "Systèmes embarqués", "Télécoms"],
    outcomesJobs: [
      "Technicien réseaux",
      "Technicien systèmes embarqués",
      "Technicien d'installation",
    ],
    acceptedDiplomas: ["Bac général (spé sciences)", "Bac STI2D", "Bac pro SN"],
    outcomesNextLevels: ["licence_pro", "bachelor"],
    recommendsInternshipWeeks: 6,
    description:
      "Le BTS Systèmes numériques option Informatique et réseaux (SNIR) forme en 2 ans des techniciens des réseaux informatiques et des systèmes embarqués communicants.",
  },
  {
    key: "BTS_CIEL",
    short: "BTS CIEL",
    label: "BTS Cybersécurité, informatique et réseaux, électronique (CIEL)",
    code: "BTS",
    level: "bachelor",
    test: /\bCIEL\b|CYBERSECURITE.*INFORMATIQUE ET RESEAUX/,
    durationYears: 2,
    domains: ["Cybersécurité", "Réseaux", "Électronique", "IoT"],
    outcomesJobs: [
      "Technicien cybersécurité",
      "Technicien réseaux",
      "Technicien systèmes électroniques",
      "Technicien IoT",
    ],
    acceptedDiplomas: ["Bac général", "Bac STI2D", "Bac pro CIEL", "Bac pro SN", "Bac pro MELEC"],
    outcomesNextLevels: ["licence_pro", "bachelor"],
    recommendsInternshipWeeks: 6,
    description:
      "Le BTS Cybersécurité, informatique et réseaux, électronique (CIEL) forme en 2 ans des techniciens des réseaux, de la cybersécurité et des systèmes électroniques communicants.",
  },
  {
    key: "BUT_INFO",
    short: "BUT Informatique",
    label: "BUT Informatique",
    code: "BUT",
    level: "bachelor",
    test: /(BUT|DUT|B\.?U\.?T|D\.?U\.?T).*INFORMATIQUE/,
    durationYears: 3,
    domains: ["Développement logiciel", "Bases de données", "Réseaux", "Systèmes"],
    outcomesJobs: [
      "Développeur",
      "Concepteur d'applications",
      "Administrateur de bases de données",
      "Analyste programmeur",
      "Chef de projet junior",
    ],
    acceptedDiplomas: ["Bac général (spé Maths, NSI, Physique)", "Bac STI2D", "Bac STMG (SIG)"],
    outcomesNextLevels: ["master", "ecole_inge"],
    recommendsInternshipWeeks: 22,
    description:
      "Le BUT Informatique forme en 3 ans des concepteurs et développeurs d'applications. Parcours possibles : développement, déploiement d'applications, administration de systèmes et réseaux, science des données.",
  },
  {
    key: "LICENCE_PRO_INFO",
    short: "Licence pro info",
    label: "Licence professionnelle informatique",
    code: "LICENCE_PRO",
    level: "licence_pro",
    test: /LICENCE PRO.*(INFORMATIQUE|NUMERIQUE|RESEAUX|DEVELOPPEMENT|DONNEES|WEB|CYBER)|LICENCE PRO METIERS DE L INFORMATIQUE/,
    durationYears: 1,
    domains: ["Développement", "Administration systèmes", "Données", "Cybersécurité"],
    outcomesJobs: [
      "Développeur",
      "Administrateur systèmes et réseaux",
      "Data analyst junior",
      "Chargé de cybersécurité",
    ],
    acceptedDiplomas: ["BTS SIO", "BUT Informatique (2 ans validées)", "L2 scientifique"],
    outcomesNextLevels: ["master"],
    recommendsInternshipWeeks: 14,
    description:
      "La licence professionnelle informatique se prépare en 1 an après un Bac+2 et vise une insertion directe dans un métier spécialisé (développement, administration, données ou cybersécurité).",
  },
  {
    key: "LICENCE_INFO",
    short: "Licence Informatique",
    label: "Licence Informatique",
    code: "LICENCE",
    level: "licence",
    test: /LICENCE.*INFORMATIQUE|\bLICENCE\b.*(NUMERIQUE|MATHS.*INFO)/,
    durationYears: 3,
    domains: ["Algorithmique", "Programmation", "Bases de données", "Réseaux"],
    outcomesJobs: [
      "Développeur",
      "Analyste programmeur",
      "Ingénieur d'études (après master)",
    ],
    acceptedDiplomas: ["Bac général (spé Maths, NSI)"],
    outcomesNextLevels: ["master", "ecole_inge"],
    recommendsInternshipWeeks: 8,
    description:
      "La licence Informatique forme en 3 ans aux fondamentaux théoriques et pratiques de l'informatique (algorithmique, programmation, bases de données, réseaux). Elle prépare surtout à une poursuite en master ou école d'ingénieurs.",
  },
  {
    key: "BACHELOR_INFO",
    short: "Bachelor informatique",
    label: "Bachelor informatique",
    code: "BACHELOR",
    level: "bachelor",
    test: /BACHELOR.*(INFORMATIQUE|NUMERIQUE|DEVELOPPEMENT|\bDATA\b|WEB|CYBER)/,
    durationYears: 3,
    domains: ["Développement", "Gestion de projet", "Numérique"],
    outcomesJobs: [
      "Développeur",
      "Chef de projet web",
      "Consultant junior",
      "Administrateur systèmes",
    ],
    acceptedDiplomas: ["Bac général", "Bac technologique"],
    outcomesNextLevels: ["master"],
    recommendsInternshipWeeks: 12,
    description:
      "Le bachelor informatique forme en 3 ans, dans un cadre souvent professionnalisant, des profils opérationnels en développement, gestion de projet numérique ou administration.",
  },
];

/** MAJUSCULES + suppression des accents, pour un matching robuste. */
export function normalizeLabel(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

/** Renvoie la 1ʳᵉ référence dont le test matche le libellé, sinon null. */
export function matchRef(label: string): FormationRef | null {
  const L = normalizeLabel(label);
  for (const ref of IT_FORMATION_REFS) {
    if (ref.test.test(L)) return ref;
  }
  return null;
}
