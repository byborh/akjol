import type { ISO2, Passport, ProgramLevel } from "../types";

/**
 * Type d'éligibilité — comment la bourse classe les candidats.
 * - merit       : critères académiques (mention, classement)
 * - social      : critères de revenus familiaux
 * - mobility    : prime sortir de son pays d'origine
 * - research    : doctorat / projet de recherche
 * - mixed       : combinaison
 */
export type ScholarshipFunding = "merit" | "social" | "mobility" | "research" | "mixed";

/**
 * Unité de montant. Pour chaque bourse on stocke ce qu'elle annonce
 * réellement, sans normaliser, pour rester sourcable.
 */
export type AmountUnit = "per_month" | "per_year" | "lump_sum" | "tuition_full";

export type Scholarship = {
  id: string;
  name: string;
  shortName?: string;
  organism: string;
  /** Pays/instance qui finance. */
  fundedBy: ISO2 | "EU" | "INTL";
  fundingType: ScholarshipFunding;

  amountMin?: number;
  amountMax?: number;
  amountUnit: AmountUnit;
  amountNote?: string;

  durationMonthsMin?: number;
  durationMonthsMax?: number;

  /** Pays où la bourse s'utilise. [] = peu importe / partout dans le monde. */
  targetCountries: ISO2[];
  /** Pays d'origine acceptés. [] = pas de restriction. */
  eligibleOriginCountries: ISO2[];
  /** Niveaux d'études couverts. */
  eligibleLevels: ProgramLevel[];

  criteria: {
    needsSocial?: boolean;
    needsMerit?: boolean;
    internationalMobility?: boolean;
    requiresAgeMax?: number;
    requiresFrenchCitizenship?: boolean;
    note?: string;
  };

  /** Date d'ouverture/fermeture des candidatures (ISO ou "rolling"). */
  applicationOpens?: string;
  applicationCloses?: string;
  applicationUrl: string;

  description: string;
  sourceLabel: string;
  sourceDate: string; // "2026-01"
};

/**
 * Dataset curé manuellement à partir des sites officiels (jan 2026).
 * Les fourchettes de montants sont volontairement larges plutôt que
 * fausses-précises ; quand un montant varie selon le profil, on indique
 * la plage et un `amountNote`.
 */
export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: "crous-bcs",
    name: "Bourse sur critères sociaux (CROUS)",
    shortName: "CROUS BCS",
    organism: "CROUS / MESR",
    fundedBy: "FR",
    fundingType: "social",
    amountMin: 1454,
    amountMax: 6335,
    amountUnit: "per_year",
    amountNote: "8 échelons (0bis à 7), montant selon revenu fiscal de la famille, distance et nb enfants à charge.",
    durationMonthsMin: 10,
    durationMonthsMax: 10,
    targetCountries: ["FR"],
    eligibleOriginCountries: ["FR"],
    eligibleLevels: ["lycee", "licence", "licence_pro", "bachelor", "master", "ecole_inge"],
    criteria: {
      needsSocial: true,
      requiresAgeMax: 28,
      note: "Limite d'âge à la 1ère demande, repoussée à 35 ans pour les boursiers en cursus continu.",
    },
    applicationOpens: "2026-03-01",
    applicationCloses: "2026-05-31",
    applicationUrl: "https://www.messervices.etudiant.gouv.fr/",
    description:
      "Aide annuelle de l'État pour les étudiants français aux ressources modestes inscrits dans une formation reconnue. Cumulable avec d'autres aides (logement, mobilité).",
    sourceLabel: "etudiant.gouv.fr — barème 2025-2026",
    sourceDate: "2025-09",
  },
  {
    id: "erasmus-plus-mobilite",
    name: "Erasmus+ — Mobilité d'études",
    shortName: "Erasmus+",
    organism: "Commission européenne",
    fundedBy: "EU",
    fundingType: "mobility",
    amountMin: 270,
    amountMax: 600,
    amountUnit: "per_month",
    amountNote: "Forfait mensuel selon coût de la vie du pays d'accueil. Top-up de 250€/mois si boursier CROUS.",
    durationMonthsMin: 2,
    durationMonthsMax: 12,
    targetCountries: [],
    eligibleOriginCountries: [],
    eligibleLevels: ["licence", "licence_pro", "bachelor", "master", "ecole_inge", "doctorat"],
    criteria: {
      internationalMobility: true,
      note: "Étudiant inscrit dans un établissement participant au programme Erasmus+. La candidature passe par ton établissement, pas par toi directement.",
    },
    applicationOpens: "rolling",
    applicationUrl: "https://erasmus-plus.ec.europa.eu/",
    description:
      "Programme historique de l'UE pour la mobilité étudiante. Couvre tous les pays de l'UE + UK (post-Brexit via Turing) + ~30 pays partenaires.",
    sourceLabel: "agence Erasmus+ France",
    sourceDate: "2025-06",
  },
  {
    id: "ami-mobilite",
    name: "Aide à la mobilité internationale (AMI)",
    shortName: "AMI",
    organism: "MESR",
    fundedBy: "FR",
    fundingType: "social",
    amountMin: 400,
    amountMax: 400,
    amountUnit: "per_month",
    amountNote: "Cumulable avec Erasmus+. Réservée aux boursiers CROUS.",
    durationMonthsMin: 2,
    durationMonthsMax: 9,
    targetCountries: [],
    eligibleOriginCountries: ["FR"],
    eligibleLevels: ["licence", "licence_pro", "bachelor", "master", "ecole_inge"],
    criteria: {
      needsSocial: true,
      internationalMobility: true,
      note: "Réservée aux étudiants déjà boursiers sur critères sociaux qui partent à l'étranger pour études ou stage.",
    },
    applicationOpens: "rolling",
    applicationUrl: "https://www.enseignementsup-recherche.gouv.fr/",
    description:
      "Complément AMI pour les boursiers CROUS qui font une mobilité internationale. La demande se fait via ton établissement.",
    sourceLabel: "MESR — circulaire AMI 2025",
    sourceDate: "2025-04",
  },
  {
    id: "bourse-eiffel",
    name: "Bourse d'excellence Eiffel",
    shortName: "Eiffel",
    organism: "Campus France / MEAE",
    fundedBy: "FR",
    fundingType: "merit",
    amountMin: 1181,
    amountMax: 1700,
    amountUnit: "per_month",
    amountNote: "1181€/mois en master, 1700€/mois en doctorat. Frais de transport, sécurité sociale et activités culturelles inclus.",
    durationMonthsMin: 12,
    durationMonthsMax: 36,
    targetCountries: ["FR"],
    eligibleOriginCountries: [],
    eligibleLevels: ["master", "doctorat"],
    criteria: {
      needsMerit: true,
      requiresAgeMax: 25,
      note: "Limite d'âge 25 ans (master) / 30 ans (doctorat). Dossier déposé par l'établissement français, pas par le candidat.",
    },
    applicationOpens: "2025-10-15",
    applicationCloses: "2026-01-09",
    applicationUrl: "https://www.campusfrance.org/fr/eiffel",
    description:
      "Bourse d'excellence pour étudiants internationaux en master ou doctorat dans un établissement français. Très sélective (~600 lauréats/an).",
    sourceLabel: "Campus France — campagne 2026",
    sourceDate: "2025-11",
  },
  {
    id: "vallet",
    name: "Bourse Fondation Vallet",
    shortName: "Vallet",
    organism: "Fondation Vallet (FdF)",
    fundedBy: "FR",
    fundingType: "merit",
    amountMin: 5500,
    amountMax: 9000,
    amountUnit: "per_year",
    amountNote: "Montant variable selon l'âge et le niveau d'études (collégien, lycéen, étudiant).",
    durationMonthsMin: 12,
    durationMonthsMax: 12,
    targetCountries: ["FR", "BJ", "VN"],
    eligibleOriginCountries: ["FR", "BJ", "VN"],
    eligibleLevels: ["lycee", "licence", "licence_pro", "bachelor"],
    criteria: {
      needsMerit: true,
      needsSocial: true,
      note: "Mention TB au Bac fortement recommandée. Combine excellence et besoin financier.",
    },
    applicationOpens: "2026-02-01",
    applicationCloses: "2026-04-30",
    applicationUrl: "https://www.fondationvallet.org/",
    description:
      "Bourse de mérite pour élèves et étudiants français, béninois et vietnamiens. Renouvelable jusqu'à fin de cursus si bons résultats.",
    sourceLabel: "fondationvallet.org",
    sourceDate: "2025-09",
  },
  {
    id: "chevening",
    name: "Chevening Scholarship",
    shortName: "Chevening",
    organism: "Foreign, Commonwealth & Development Office (UK)",
    fundedBy: "GB",
    fundingType: "merit",
    amountUnit: "tuition_full",
    amountNote: "Frais de scolarité intégraux + indemnité mensuelle (~1200£/mois Londres, ~1000£ ailleurs) + voyage A/R + visa + arrivée.",
    durationMonthsMin: 12,
    durationMonthsMax: 12,
    targetCountries: ["GB"],
    eligibleOriginCountries: [],
    eligibleLevels: ["master"],
    criteria: {
      needsMerit: true,
      note: "Exigence : 2 ans d'expérience pro min. Lettre d'admission inconditionnelle d'une université UK requise au stade final. Pas pour citoyens UK.",
    },
    applicationOpens: "2025-08-01",
    applicationCloses: "2025-11-05",
    applicationUrl: "https://www.chevening.org/",
    description:
      "Programme du gouvernement britannique pour faire venir les futurs leaders étrangers étudier 1 an en master au UK. Très compétitif (~1500 lauréats sur 60k+ candidatures).",
    sourceLabel: "chevening.org",
    sourceDate: "2025-08",
  },
  {
    id: "fulbright-fr-us",
    name: "Bourse Fulbright (FR → US)",
    shortName: "Fulbright",
    organism: "Commission franco-américaine Fulbright",
    fundedBy: "INTL",
    fundingType: "research",
    amountMin: 18000,
    amountMax: 50000,
    amountUnit: "lump_sum",
    amountNote: "Subvention forfaitaire pour 1 année académique. Variable selon le coût de l'université d'accueil.",
    durationMonthsMin: 9,
    durationMonthsMax: 12,
    targetCountries: ["US"],
    eligibleOriginCountries: ["FR"],
    eligibleLevels: ["master", "doctorat"],
    criteria: {
      needsMerit: true,
      requiresFrenchCitizenship: true,
      note: "Master 1 minimum requis. Projet de recherche ou parcours académique défendu en entretien.",
    },
    applicationOpens: "2025-09-01",
    applicationCloses: "2026-02-01",
    applicationUrl: "https://fulbright-france.org/",
    description:
      "Bourse historique pour études et recherche aux États-Unis. Exigeante mais ouvre des portes (réseau Fulbright mondial).",
    sourceLabel: "fulbright-france.org",
    sourceDate: "2025-09",
  },
  {
    id: "daad-master",
    name: "DAAD — Master Studies in Germany",
    shortName: "DAAD Master",
    organism: "Deutscher Akademischer Austauschdienst",
    fundedBy: "DE",
    fundingType: "merit",
    amountMin: 934,
    amountMax: 934,
    amountUnit: "per_month",
    amountNote: "Plus assurance santé, allocation de voyage et éventuellement allocation de loyer/famille.",
    durationMonthsMin: 12,
    durationMonthsMax: 24,
    targetCountries: ["DE"],
    eligibleOriginCountries: [],
    eligibleLevels: ["master"],
    criteria: {
      needsMerit: true,
      note: "Pour étudiants étrangers titulaires d'un Bachelor. Dossier individuel via le portail DAAD.",
    },
    applicationOpens: "2025-08-15",
    applicationCloses: "2025-11-30",
    applicationUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    description:
      "Office allemand d'échanges universitaires. Finance des masters complets en Allemagne, dans toutes les disciplines.",
    sourceLabel: "daad.de",
    sourceDate: "2025-09",
  },
  {
    id: "iledefrance-mobilite",
    name: "Aide à la mobilité internationale Île-de-France",
    shortName: "Mobilité IDF",
    organism: "Région Île-de-France",
    fundedBy: "FR",
    fundingType: "social",
    amountMin: 250,
    amountMax: 450,
    amountUnit: "per_month",
    amountNote: "250€ ou 450€ selon échelon CROUS. Cumulable avec Erasmus+ et AMI.",
    durationMonthsMin: 2,
    durationMonthsMax: 9,
    targetCountries: [],
    eligibleOriginCountries: ["FR"],
    eligibleLevels: ["licence", "licence_pro", "bachelor", "master", "ecole_inge"],
    criteria: {
      needsSocial: true,
      internationalMobility: true,
      note: "Réservé aux étudiants inscrits dans un établissement IDF, en mobilité d'études ou stage à l'étranger.",
    },
    applicationOpens: "rolling",
    applicationUrl: "https://www.iledefrance.fr/aide-mobilite-internationale-des-etudiants",
    description:
      "Aide régionale francilienne pour cofinancer une mobilité d'études ou de stage à l'international. Critères CROUS appliqués.",
    sourceLabel: "iledefrance.fr",
    sourceDate: "2025-09",
  },
  {
    id: "erasmus-mundus",
    name: "Erasmus Mundus Joint Master (EMJM)",
    shortName: "EMJM",
    organism: "Commission européenne",
    fundedBy: "EU",
    fundingType: "merit",
    amountMin: 1400,
    amountMax: 1400,
    amountUnit: "per_month",
    amountNote: "Allocation mensuelle + frais de scolarité couverts + voyage. Bourse complète, ~1400€/mois.",
    durationMonthsMin: 12,
    durationMonthsMax: 24,
    targetCountries: [],
    eligibleOriginCountries: [],
    eligibleLevels: ["master"],
    criteria: {
      needsMerit: true,
      internationalMobility: true,
      note: "Master conjoint réparti sur 2 à 4 universités européennes. Très compétitif. La candidature se fait directement auprès du consortium du master visé.",
    },
    applicationOpens: "rolling",
    applicationUrl: "https://www.eacea.ec.europa.eu/scholarships/emjm-scholarships_en",
    description:
      "Master européen multi-pays financé intégralement. ~150 EMJM différents (data science, droit international, sciences marines, etc.).",
    sourceLabel: "EACEA — programme guide 2025",
    sourceDate: "2025-04",
  },
];

export function findScholarship(id: string): Scholarship | undefined {
  return SCHOLARSHIPS.find((s) => s.id === id);
}

export type ScholarshipMatch = {
  scholarship: Scholarship;
  isMatch: boolean;
  reasons: string[]; // pourquoi ça matche (ou pas)
};

/**
 * Détermine si une bourse est applicable au passeport, et explique pourquoi.
 * Approche conservatrice : on n'invente rien, et un "match" doit pouvoir être
 * justifié par les champs explicites du passeport.
 */
export function matchScholarship(s: Scholarship, passport: Passport): ScholarshipMatch {
  const reasons: string[] = [];
  let blocking = false;

  if (s.eligibleOriginCountries.length > 0 && !s.eligibleOriginCountries.includes(passport.origin.country)) {
    reasons.push(`Réservé aux pays : ${s.eligibleOriginCountries.join(", ")}`);
    blocking = true;
  }

  if (s.criteria.requiresFrenchCitizenship && passport.origin.country !== "FR") {
    reasons.push("Exige la nationalité française");
    blocking = true;
  }

  if (s.criteria.needsSocial && passport.constraints.needsScholarship === false) {
    reasons.push("Tu as déclaré ne pas avoir besoin de bourse — bourse sociale non pertinente");
    blocking = true;
  }

  if (!blocking) {
    if (s.criteria.needsSocial && passport.constraints.needsScholarship) {
      reasons.push("Tu as déclaré avoir besoin d'une bourse → critère social compatible");
    }
    if (s.fundingType === "mobility" && passport.origin.country) {
      reasons.push(`Mobilité depuis ${passport.origin.country}`);
    }
    if (s.eligibleOriginCountries.length === 0) {
      reasons.push("Ouvert à tous les pays");
    } else {
      reasons.push(`Pays d'origine éligible : ${passport.origin.country}`);
    }
  }

  return { scholarship: s, isMatch: !blocking, reasons };
}

export function scholarshipsForPassport(passport: Passport): ScholarshipMatch[] {
  return SCHOLARSHIPS.map((s) => matchScholarship(s, passport));
}

export function formatAmount(s: Scholarship): string {
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  if (s.amountUnit === "tuition_full") {
    return "Frais de scolarité intégraux";
  }
  const unit =
    s.amountUnit === "per_month" ? "/mois" :
    s.amountUnit === "per_year" ? "/an" :
    "";
  if (s.amountMin && s.amountMax) {
    if (s.amountMin === s.amountMax) return `${fmt(s.amountMin)} €${unit}`;
    return `${fmt(s.amountMin)} – ${fmt(s.amountMax)} €${unit}`;
  }
  if (s.amountMin) return `≥ ${fmt(s.amountMin)} €${unit}`;
  if (s.amountMax) return `≤ ${fmt(s.amountMax)} €${unit}`;
  return "Variable";
}
