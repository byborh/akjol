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
  {
    id: "devops",
    code: "M1810-DEVOPS",
    label: "DevOps",
    domains: ["Tech"],
    salary: [
      { country: "FR", median: 48000, currency: "EUR" },
      { country: "GB", median: 55000, currency: "GBP" },
      { country: "US", median: 110000, currency: "USD" },
    ],
    regionsTopHiring: ["Paris", "Lyon", "Toulouse", "London"],
    dailyTasks: ["CI/CD pipelines", "Cloud infra (AWS/GCP)", "Monitoring", "Incidents production"],
    riskAutomation: 0.18,
    requiresDiplomas: ["licence_pro", "master", "ecole_inge", "bachelor"],
    matchKeywords: ["devops", "infra", "ci/cd", "réseau", "cloud", "site reliability"],
  },
  {
    id: "ingenieur-securite",
    code: "M1802-CYBER",
    label: "Ingénieur sécurité / Pentester",
    domains: ["Tech"],
    salary: [
      { country: "FR", median: 52000, currency: "EUR" },
      { country: "GB", median: 60000, currency: "GBP" },
    ],
    regionsTopHiring: ["Paris", "Toulouse", "Lyon"],
    dailyTasks: ["Audit code", "Pentest applicatif", "Réponse incidents", "Threat modeling"],
    riskAutomation: 0.15,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["sécurité", "cyber", "pentest", "ingénieur sécurité", "infosec"],
  },
  {
    id: "admin-reseau",
    code: "I1402-ADMIN",
    label: "Administrateur réseau",
    domains: ["Tech"],
    salary: [{ country: "FR", median: 36000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Lille"],
    dailyTasks: ["Gestion infra réseau", "Support N3", "Maintenance switchs/routeurs"],
    riskAutomation: 0.42,
    requiresDiplomas: ["licence_pro", "master"],
    matchKeywords: ["administrateur réseau", "admin réseau", "infrastructure", "réseau"],
  },
  {
    id: "data-engineer",
    code: "M1801-DATA",
    label: "Data Engineer",
    domains: ["Tech", "Sciences"],
    salary: [
      { country: "FR", median: 50000, currency: "EUR" },
      { country: "US", median: 130000, currency: "USD" },
    ],
    regionsTopHiring: ["Paris", "London", "Berlin"],
    dailyTasks: ["Pipelines data", "Modélisation Snowflake/BigQuery", "Orchestration Airflow"],
    riskAutomation: 0.22,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["data", "data engineer", "bigdata", "etl", "warehouse"],
  },
  {
    id: "medecin",
    code: "J1102-MED",
    label: "Médecin",
    domains: ["Santé"],
    salary: [
      { country: "FR", median: 75000, currency: "EUR" },
      { country: "GB", median: 80000, currency: "GBP" },
    ],
    regionsTopHiring: ["Paris", "Lyon", "Toulouse"],
    dailyTasks: ["Consultations", "Diagnostic", "Suivi patients", "Garde hospitalière"],
    riskAutomation: 0.05,
    requiresDiplomas: ["doctorat"],
    matchKeywords: ["médecin", "doctor", "médecine", "santé"],
  },
  {
    id: "ingenieur-bio",
    code: "H1206-BIO",
    label: "Ingénieur biomédical",
    domains: ["Santé", "Sciences"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon", "Strasbourg"],
    dailyTasks: ["Maintenance dispositifs médicaux", "R&D biomédical", "Validation conformité"],
    riskAutomation: 0.2,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["biomédical", "ingénieur bio"],
  },
  {
    id: "designer-ux",
    code: "E1104-UX",
    label: "UX/UI Designer",
    domains: ["Design"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "London", "Berlin"],
    dailyTasks: ["Recherche utilisateur", "Wireframes Figma", "Tests utilisabilité"],
    riskAutomation: 0.25,
    requiresDiplomas: ["bachelor", "master"],
    matchKeywords: ["ux", "ui", "design", "designer", "produit"],
  },
  {
    id: "chef-projet",
    code: "M1402-PM",
    label: "Chef de projet",
    domains: ["Management"],
    salary: [{ country: "FR", median: 48000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lyon"],
    dailyTasks: ["Planning", "Reporting", "Animation équipe", "Budget"],
    riskAutomation: 0.18,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["chef de projet", "pm", "project manager"],
  },
  {
    id: "developpeur",
    code: "M1805-DEV",
    label: "Développeur",
    domains: ["Tech"],
    salary: [
      { country: "FR", median: 42000, currency: "EUR" },
      { country: "GB", median: 50000, currency: "GBP" },
    ],
    regionsTopHiring: ["Paris", "Lyon", "Nantes", "London"],
    dailyTasks: ["Code feature", "Code review", "Tests", "Refactoring"],
    riskAutomation: 0.32,
    requiresDiplomas: ["bachelor", "licence_pro", "master", "ecole_inge"],
    matchKeywords: ["développeur", "developer", "software engineer", "dev"],
  },
  {
    id: "consultant",
    code: "M1402-CONS",
    label: "Consultant",
    domains: ["Conseil"],
    salary: [{ country: "FR", median: 50000, currency: "EUR" }],
    regionsTopHiring: ["Paris"],
    dailyTasks: ["Mission client", "Analyse", "Recommandations", "Présentations"],
    riskAutomation: 0.12,
    requiresDiplomas: ["master", "ecole_inge"],
    matchKeywords: ["consultant", "conseil"],
  },
  {
    id: "data-scientist",
    code: "M1803-DS",
    label: "Data Scientist",
    domains: ["Tech", "Sciences"],
    salary: [
      { country: "FR", median: 52000, currency: "EUR" },
      { country: "US", median: 140000, currency: "USD" },
    ],
    regionsTopHiring: ["Paris", "London", "Boston", "Berlin"],
    dailyTasks: ["Modèles ML", "Feature engineering", "Reporting impact"],
    riskAutomation: 0.18,
    requiresDiplomas: ["master", "ecole_inge", "doctorat"],
    matchKeywords: ["data scientist", "ml", "machine learning", "ia"],
  },
  {
    id: "technicien-telecoms",
    code: "I1401-TELECOM",
    label: "Technicien télécoms",
    domains: ["Tech"],
    salary: [{ country: "FR", median: 28000, currency: "EUR" }],
    regionsTopHiring: ["Paris", "Lille", "Lyon"],
    dailyTasks: ["Maintenance terrain", "Installation lignes", "Diagnostic"],
    riskAutomation: 0.5,
    requiresDiplomas: ["licence_pro", "bachelor"],
    matchKeywords: ["télécom", "telecom", "technicien"],
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
