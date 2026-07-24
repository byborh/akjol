/**
 * SEED ONLY pour la donnée (`JOBS`).
 *
 * Source unique des métiers : utilisée par `jobsForProgram()` (liens
 * formation → métier), comme fond de l'API `/api/jobs`, et poussée en DB par
 * `pnpm seed:jobs`. Les `matchKeywords` sont calibrés pour relier chaque
 * débouché de formation (`program.outcomesJobs`) au bon métier.
 *
 * Données : libellés + codes ROME (référentiel France Travail), salaires médians
 * FR indicatifs (marché 2024), risque d'automatisation estimé. Éditable en Admin.
 */
import type { ProgramLevel } from "../types";

export type Job = {
  id: string;
  code: string;
  label: string;
  domains: string[];
  salary: { country: string; median: number; currency: "EUR" | "GBP" | "USD" | "MYR" }[];
  regionsTopHiring: string[];
  dailyTasks: string[];
  riskAutomation: number;
  requiresDiplomas: ProgramLevel[];
  matchKeywords: string[];
};

export const JOBS: Job[] = [
  // ─────────────── Numérique / informatique ───────────────
  {
    id: "developpeur",
    code: "M1805",
    label: "Développeur / Concepteur d'applications",
    domains: ["Tech"],
    salary: [
      { country: "FR", median: 40000, currency: "EUR" },
      { country: "GB", median: 50000, currency: "GBP" },
    ],
    regionsTopHiring: ["Paris", "Lyon", "Nantes", "Toulouse"],
    dailyTasks: ["Développement de fonctionnalités", "Revue de code", "Tests", "Correction de bugs"],
    riskAutomation: 0.3,
    requiresDiplomas: ["bachelor", "licence", "licence_pro", "master", "ecole_inge"],
    matchKeywords: [
      "développeur",
      "developer",
      "développeur logiciel",
      "développeur d'applications",
      "analyste programmeur",
      "concepteur d'applications",
    ],
  },
  {
    id: "administrateur-systemes-reseaux",
    code: "M1810",
    label: "Administrateur systèmes et réseaux",
    domains: ["Tech"],
    salary: [{ country: "FR", median: 38000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Lille", "Rennes"],
    dailyTasks: ["Gestion des serveurs", "Supervision du réseau", "Sauvegardes", "Support N2/N3"],
    riskAutomation: 0.4,
    requiresDiplomas: ["bachelor", "licence_pro", "ecole_inge"],
    matchKeywords: [
      "administrateur systèmes et réseaux",
      "systèmes et réseaux",
      "administrateur réseaux",
      "technicien d'infrastructure",
      "infrastructure",
    ],
  },
  {
    id: "technicien-support",
    code: "I1401",
    label: "Technicien support informatique",
    domains: ["Tech"],
    salary: [{ country: "FR", median: 28000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lille", "Lyon", "Bordeaux"],
    dailyTasks: ["Assistance utilisateurs", "Diagnostic de pannes", "Gestion du parc", "Tickets"],
    riskAutomation: 0.55,
    requiresDiplomas: ["bachelor", "licence_pro"],
    matchKeywords: ["technicien support", "support informatique", "helpdesk"],
  },
  {
    id: "administrateur-bdd",
    code: "M1810",
    label: "Administrateur de bases de données (DBA)",
    domains: ["Tech"],
    salary: [{ country: "FR", median: 45000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Toulouse"],
    dailyTasks: ["Modélisation de données", "Optimisation SQL", "Sauvegarde/restauration", "Sécurité des données"],
    riskAutomation: 0.35,
    requiresDiplomas: ["bachelor", "licence_pro", "master"],
    matchKeywords: ["administrateur de bases de données", "bases de données", "dba"],
  },
  {
    id: "data-analyst",
    code: "M1806",
    label: "Data analyst",
    domains: ["Tech", "Sciences"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Lille"],
    dailyTasks: ["Analyse de données", "Tableaux de bord", "Requêtes SQL", "Restitution métier"],
    riskAutomation: 0.35,
    requiresDiplomas: ["bachelor", "licence_pro", "master"],
    matchKeywords: ["data analyst", "analyste de données"],
  },
  {
    id: "chef-projet-informatique",
    code: "M1806",
    label: "Chef de projet informatique",
    domains: ["Tech", "Affaires"],
    salary: [{ country: "FR", median: 48000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Nantes"],
    dailyTasks: ["Pilotage de projet", "Coordination d'équipe", "Suivi budgétaire", "Relation client"],
    riskAutomation: 0.15,
    requiresDiplomas: ["bachelor", "master", "ecole_inge"],
    matchKeywords: ["chef de projet"],
  },
  {
    id: "ingenieur-cybersecurite",
    code: "M1802",
    label: "Ingénieur cybersécurité",
    domains: ["Tech"],
    salary: [
      { country: "FR", median: 50000, currency: "EUR" },
      { country: "GB", median: 58000, currency: "GBP" },
    ],
    regionsTopHiring: ["Paris", "Toulouse", "Rennes", "Lyon"],
    dailyTasks: ["Audits de sécurité", "Réponse à incident", "Analyse de vulnérabilités", "Durcissement systèmes"],
    riskAutomation: 0.1,
    requiresDiplomas: ["licence_pro", "master", "ecole_inge"],
    matchKeywords: ["cybersécurité", "cyber", "sécurité informatique"],
  },
  {
    id: "ingenieur-systemes-embarques",
    code: "H1206",
    label: "Ingénieur systèmes embarqués",
    domains: ["Tech", "Industrie"],
    salary: [{ country: "FR", median: 43000, currency: "EUR" }],
    regionsTopHiring: ["Toulouse", "Paris", "Grenoble", "Rennes"],
    dailyTasks: ["Développement embarqué", "Tests matériels", "Intégration capteurs", "Optimisation temps réel"],
    riskAutomation: 0.2,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["systèmes embarqués", "embarqué"],
  },
  {
    id: "ingenieur-reseaux",
    code: "M1810",
    label: "Ingénieur réseaux et télécoms",
    domains: ["Tech"],
    salary: [{ country: "FR", median: 45000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Lille"],
    dailyTasks: ["Architecture réseau", "Déploiement d'infrastructures", "Sécurisation", "Supervision"],
    riskAutomation: 0.3,
    requiresDiplomas: ["licence_pro", "master", "ecole_inge"],
    matchKeywords: ["ingénieur réseaux", "réseaux et télécoms"],
  },
  {
    id: "data-scientist",
    code: "M1805",
    label: "Data scientist / Ingénieur IA",
    domains: ["Tech", "Sciences"],
    salary: [
      { country: "FR", median: 50000, currency: "EUR" },
      { country: "US", median: 130000, currency: "USD" },
    ],
    regionsTopHiring: ["Paris", "Lyon", "Grenoble"],
    dailyTasks: ["Modèles de machine learning", "Feature engineering", "Analyse de données", "Mise en production de modèles"],
    riskAutomation: 0.12,
    requiresDiplomas: ["master", "ecole_inge", "doctorat"],
    matchKeywords: ["ia / data", "data scientist", "intelligence artificielle", "machine learning"],
  },
  {
    id: "technicien-reseaux-telecoms",
    code: "I1307",
    label: "Technicien réseaux et télécoms",
    domains: ["Tech"],
    salary: [{ country: "FR", median: 29000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lille", "Lyon"],
    dailyTasks: ["Installation d'équipements", "Câblage et raccordement", "Diagnostic de pannes", "Maintenance réseau"],
    riskAutomation: 0.5,
    requiresDiplomas: ["bachelor", "licence_pro"],
    matchKeywords: [
      "technicien réseaux",
      "technicien télécoms",
      "technicien d'installation",
      "technicien sécurité réseaux",
      "télécoms",
    ],
  },
  {
    id: "technicien-electronique",
    code: "I1305",
    label: "Technicien systèmes électroniques et IoT",
    domains: ["Tech", "Industrie"],
    salary: [{ country: "FR", median: 30000, currency: "EUR" }],
    regionsTopHiring: ["Toulouse", "Rennes", "Grenoble"],
    dailyTasks: ["Assemblage de cartes électroniques", "Tests et mesures", "Maintenance de systèmes", "Objets connectés"],
    riskAutomation: 0.45,
    requiresDiplomas: ["bachelor", "licence_pro"],
    matchKeywords: ["technicien systèmes électroniques", "technicien iot", "systèmes électroniques", "iot"],
  },
  {
    id: "webdesigner",
    code: "E1205",
    label: "Webdesigner / Intégrateur web",
    domains: ["Tech", "Arts"],
    salary: [{ country: "FR", median: 32000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Nantes", "Bordeaux"],
    dailyTasks: ["Maquettes graphiques", "Intégration HTML/CSS", "Responsive design", "Optimisation UX"],
    riskAutomation: 0.35,
    requiresDiplomas: ["bachelor", "licence_pro"],
    matchKeywords: ["webdesigner", "intégrateur web", "web design"],
  },
  {
    id: "community-manager",
    code: "E1101",
    label: "Community manager",
    domains: ["Affaires"],
    salary: [{ country: "FR", median: 30000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Lille"],
    dailyTasks: ["Animation des réseaux sociaux", "Création de contenu", "Modération", "Reporting d'audience"],
    riskAutomation: 0.35,
    requiresDiplomas: ["bachelor", "licence_pro", "master"],
    matchKeywords: ["community manager"],
  },
  {
    id: "referenceur-seo",
    code: "E1101",
    label: "Référenceur SEO / SEA",
    domains: ["Affaires"],
    salary: [{ country: "FR", median: 33000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Bordeaux"],
    dailyTasks: ["Optimisation du référencement", "Analyse d'audience", "Stratégie de mots-clés", "Campagnes SEA"],
    riskAutomation: 0.35,
    requiresDiplomas: ["bachelor", "licence_pro", "master"],
    matchKeywords: ["référenceur", "seo"],
  },
  // ─────────────── Ingénierie généraliste / affaires ───────────────
  {
    id: "ingenieur-generaliste",
    code: "H1206",
    label: "Ingénieur généraliste",
    domains: ["Industrie", "Tech"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Lille", "Toulouse"],
    dailyTasks: ["Conception technique", "Gestion de projet", "R&D", "Coordination d'équipe"],
    riskAutomation: 0.15,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["ingénieur généraliste", "généraliste", "ingénieur d'études"],
  },
  {
    id: "ingenieur-affaires",
    code: "H1102",
    label: "Ingénieur d'affaires",
    domains: ["Affaires"],
    salary: [{ country: "FR", median: 45000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon"],
    dailyTasks: ["Développement commercial", "Réponse aux appels d'offres", "Négociation", "Suivi de comptes"],
    riskAutomation: 0.12,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["ingénieur d'affaires"],
  },
  {
    id: "ingenieur-btp",
    code: "F1106",
    label: "Ingénieur BTP / génie civil",
    domains: ["Industrie"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Bordeaux"],
    dailyTasks: ["Études techniques", "Suivi de chantier", "Coordination des corps de métier", "Contrôle qualité"],
    riskAutomation: 0.2,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["ingénieur btp", "btp", "génie civil"],
  },
  {
    id: "consultant",
    code: "M1806",
    label: "Consultant",
    domains: ["Affaires"],
    salary: [{ country: "FR", median: 45000, currency: "EUR" }],
    regionsTopHiring: ["Paris"],
    dailyTasks: ["Mission client", "Analyse et diagnostic", "Recommandations", "Restitution"],
    riskAutomation: 0.15,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["consultant"],
  },
  // ─────────────── Agronomie / agroalimentaire / environnement (ISA) ───────────────
  {
    id: "ingenieur-agronome",
    code: "A1303",
    label: "Ingénieur agronome",
    domains: ["Sciences", "Industrie"],
    salary: [{ country: "FR", median: 36000, currency: "EUR" }],
    regionsTopHiring: ["Hauts-de-France", "Bretagne", "Nouvelle-Aquitaine"],
    dailyTasks: ["Conseil aux exploitations", "Expérimentations agronomiques", "Suivi de cultures", "R&D"],
    riskAutomation: 0.15,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["agronome", "agronomie"],
  },
  {
    id: "ingenieur-agroalimentaire",
    code: "H1206",
    label: "Ingénieur agroalimentaire",
    domains: ["Industrie", "Sciences"],
    salary: [{ country: "FR", median: 38000, currency: "EUR" }],
    regionsTopHiring: ["Bretagne", "Hauts-de-France", "Pays de la Loire"],
    dailyTasks: ["R&D produits", "Sécurité alimentaire", "Optimisation des procédés", "Contrôle qualité"],
    riskAutomation: 0.25,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["agroalimentaire"],
  },
  {
    id: "charge-projet-environnement",
    code: "A1204",
    label: "Chargé de projet environnement",
    domains: ["Sciences"],
    salary: [{ country: "FR", median: 34000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Nantes"],
    dailyTasks: ["Études d'impact", "Suivi réglementaire", "Gestion de projet environnemental", "Reporting"],
    riskAutomation: 0.15,
    requiresDiplomas: ["bachelor", "master", "ecole_inge"],
    matchKeywords: ["environnement"],
  },
  {
    id: "ingenieur-qualite",
    code: "H1502",
    label: "Ingénieur qualité",
    domains: ["Industrie"],
    salary: [{ country: "FR", median: 40000, currency: "EUR" }],
    regionsTopHiring: ["Lyon", "Paris", "Toulouse"],
    dailyTasks: ["Systèmes qualité", "Audits", "Amélioration continue", "Conformité normes"],
    riskAutomation: 0.3,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["ingénieur qualité", "qualité"],
  },
  {
    id: "conseiller-agricole",
    code: "A1301",
    label: "Conseiller agricole",
    domains: ["Sciences"],
    salary: [{ country: "FR", median: 32000, currency: "EUR" }],
    regionsTopHiring: ["Bretagne", "Nouvelle-Aquitaine", "Grand Est"],
    dailyTasks: ["Conseil technique aux agriculteurs", "Diagnostic d'exploitation", "Accompagnement de projets", "Veille réglementaire"],
    riskAutomation: 0.2,
    requiresDiplomas: ["bachelor", "licence_pro", "ecole_inge"],
    matchKeywords: ["conseiller agricole", "agricole"],
  },
];

export function findJob(id: string): Job | undefined {
  return JOBS.find((j) => j.id === id);
}

export function searchJobs(query: string): Job[] {
  const q = query.trim().toLowerCase();
  if (!q) return JOBS;
  return JOBS.filter(
    (j) =>
      j.label.toLowerCase().includes(q) ||
      j.matchKeywords.some((k) => k.toLowerCase().includes(q)) ||
      j.domains.some((d) => d.toLowerCase().includes(q)),
  );
}

export function jobsForProgram(outcomesJobs: string[]): Job[] {
  return JOBS.filter((j) =>
    outcomesJobs.some((label) => {
      const lc = label.toLowerCase();
      return (
        j.label.toLowerCase().includes(lc) ||
        lc.includes(j.label.toLowerCase()) ||
        j.matchKeywords.some((k) => lc.includes(k))
      );
    }),
  );
}
