/**
 * Seed 40 métiers Tech FR pour la verticale MVP.
 *
 * Sources :
 *   - Codes ROME : France Travail (Pôle Emploi) — référentiel officiel.
 *   - Salaires médians juniors France 2026 : estimations conservatives basées
 *     sur les baromètres LinkedIn / WTTJ / Numeum 2024-2025 (à ré-itérer avec
 *     des sources primaires citées plus tard).
 *   - Régions top hiring : observations 2024-2025 (concentrations IDF, AURA,
 *     Hauts-de-France, Occitanie, PACA, Nouvelle-Aquitaine, Bretagne).
 *   - risk_automation : 0-100 — estimation prospective d'exposition à
 *     l'automatisation IA à 5 ans. À considérer comme "intuition d'expert"
 *     et marquer comme tel côté UI (jamais un chiffre orphelin).
 *
 * Idempotent : INSERT OR REPLACE par id. Tu peux relancer sans crainte.
 *
 * Usage : pnpm seed:jobs-tech
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { sql } from "drizzle-orm";
import { createDb, jobs, type JobInsert } from "@akjol/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AKJOL_DB ?? resolve(__dirname, "../data/akjol.db");

type Salary = { country: string; median: number; currency: string };

/** Helper pour ne pas répéter `JSON.stringify` partout. */
function J<T>(v: T): string {
  return JSON.stringify(v);
}

const TECH_JOBS: Array<{
  id: string;
  code: string;
  label: string;
  riskAutomation: number; // 0..100
  domains: string[];
  salary: Salary[];
  regionsTopHiring: string[];
  dailyTasks: string[];
  requiresDiplomas: string[];
  matchKeywords: string[];
}> = [
  // ─────────── DÉVELOPPEMENT (10) ───────────
  {
    id: "dev-frontend",
    code: "M1805-FRONTEND",
    label: "Développeur frontend",
    riskAutomation: 35,
    domains: ["Tech", "Web"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie"],
    dailyTasks: ["Implémenter des interfaces React/Vue", "Intégrer des designs Figma", "Optimiser la performance perçue", "Coder les tests unitaires"],
    requiresDiplomas: ["BTS_SIO_SLAM", "DUT_INFO", "LICENCE_INFO", "BAC_GENERAL"],
    matchKeywords: ["react", "vue", "front", "html", "css", "javascript", "typescript", "ui"],
  },
  {
    id: "dev-backend",
    code: "M1805-BACKEND",
    label: "Développeur backend",
    riskAutomation: 30,
    domains: ["Tech", "Web", "API"],
    salary: [{ country: "FR", median: 45000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France"],
    dailyTasks: ["Concevoir des APIs REST/GraphQL", "Modéliser des bases de données", "Optimiser des requêtes SQL", "Implémenter de l'authentification"],
    requiresDiplomas: ["BTS_SIO_SLAM", "DUT_INFO", "LICENCE_INFO"],
    matchKeywords: ["node", "python", "java", "go", "rust", "api", "rest", "graphql", "sql"],
  },
  {
    id: "dev-fullstack",
    code: "M1805-FULLSTACK",
    label: "Développeur fullstack",
    riskAutomation: 32,
    domains: ["Tech", "Web"],
    salary: [{ country: "FR", median: 44000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie", "Nouvelle-Aquitaine"],
    dailyTasks: ["Coder front et back sur les mêmes features", "Concevoir le schéma data", "Déployer en CI/CD", "Faire de la review code"],
    requiresDiplomas: ["BTS_SIO_SLAM", "DUT_INFO", "LICENCE_INFO", "DIPL_INGE"],
    matchKeywords: ["fullstack", "full-stack", "next", "node", "react"],
  },
  {
    id: "dev-mobile-ios",
    code: "M1805-IOS",
    label: "Développeur mobile iOS",
    riskAutomation: 28,
    domains: ["Tech", "Mobile"],
    salary: [{ country: "FR", median: 46000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "PACA"],
    dailyTasks: ["Coder en Swift/SwiftUI", "Publier sur l'App Store", "Optimiser le binaire", "Implémenter Core Data / SwiftData"],
    requiresDiplomas: ["DUT_INFO", "LICENCE_INFO", "DIPL_INGE"],
    matchKeywords: ["ios", "swift", "swiftui", "apple", "iphone", "xcode"],
  },
  {
    id: "dev-mobile-android",
    code: "M1805-ANDROID",
    label: "Développeur mobile Android",
    riskAutomation: 28,
    domains: ["Tech", "Mobile"],
    salary: [{ country: "FR", median: 44000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France"],
    dailyTasks: ["Coder en Kotlin", "Gérer Jetpack Compose", "Publier sur Play Store", "Tester sur multi-devices"],
    requiresDiplomas: ["DUT_INFO", "LICENCE_INFO", "DIPL_INGE"],
    matchKeywords: ["android", "kotlin", "jetpack", "compose", "google"],
  },
  {
    id: "dev-mobile-cross",
    code: "M1805-MOBILE-CROSS",
    label: "Développeur mobile cross-platform",
    riskAutomation: 32,
    domains: ["Tech", "Mobile"],
    salary: [{ country: "FR", median: 43000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie"],
    dailyTasks: ["Coder en React Native / Flutter", "Partager du code iOS+Android", "Gérer les builds Fastlane", "Optimiser le bundle"],
    requiresDiplomas: ["DUT_INFO", "LICENCE_INFO"],
    matchKeywords: ["react native", "flutter", "expo", "dart", "cross-platform"],
  },
  {
    id: "dev-game",
    code: "M1805-GAMEDEV",
    label: "Développeur jeux vidéo",
    riskAutomation: 25,
    domains: ["Tech", "Gaming"],
    salary: [{ country: "FR", median: 38000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Occitanie", "Hauts-de-France"],
    dailyTasks: ["Coder en C# Unity / C++ Unreal", "Implémenter du gameplay", "Optimiser les perfs GPU", "Collaborer avec game designers"],
    requiresDiplomas: ["DUT_INFO", "LICENCE_INFO", "DIPL_INGE"],
    matchKeywords: ["unity", "unreal", "gamedev", "c++", "c#", "godot", "shader"],
  },
  {
    id: "dev-embedded",
    code: "M1805-EMBEDDED",
    label: "Développeur embarqué",
    riskAutomation: 20,
    domains: ["Tech", "Hardware", "IoT"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Auvergne-Rhône-Alpes", "Occitanie", "Île-de-France", "Bretagne"],
    dailyTasks: ["Coder en C / C++ / Rust", "Programmer des microcontrôleurs", "Debug en temps réel", "Optimiser la consommation mémoire"],
    requiresDiplomas: ["DIPL_INGE", "LICENCE_INFO", "BTS_SN"],
    matchKeywords: ["embedded", "embarqué", "stm32", "arduino", "rtos", "iot", "microcontroller"],
  },
  {
    id: "dev-web3",
    code: "M1805-WEB3",
    label: "Développeur Web3 / Blockchain",
    riskAutomation: 30,
    domains: ["Tech", "Blockchain"],
    salary: [{ country: "FR", median: 52000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Écrire des smart contracts Solidity / Rust", "Auditer du code on-chain", "Intégrer wallets", "Gérer la gas optimization"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO", "LICENCE_INFO"],
    matchKeywords: ["blockchain", "ethereum", "solidity", "web3", "crypto", "smart contract", "solana", "rust"],
  },
  {
    id: "dev-lowcode",
    code: "M1805-LOWCODE",
    label: "Développeur low-code / no-code",
    riskAutomation: 60,
    domains: ["Tech", "Automation"],
    salary: [{ country: "FR", median: 38000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Configurer des workflows Zapier / Make", "Construire des apps Bubble / Retool", "Intégrer des APIs", "Former les utilisateurs métier"],
    requiresDiplomas: ["BTS_SIO_SLAM", "DUT_INFO", "BAC_GENERAL"],
    matchKeywords: ["nocode", "low-code", "bubble", "retool", "airtable", "zapier", "make"],
  },

  // ─────────── DATA (6) ───────────
  {
    id: "data-engineer",
    code: "M1801-DATA-ENG",
    label: "Data Engineer",
    riskAutomation: 25,
    domains: ["Tech", "Data"],
    salary: [{ country: "FR", median: 48000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie"],
    dailyTasks: ["Construire des pipelines ETL", "Gérer Airflow / dbt / Spark", "Modéliser des data warehouses", "Optimiser les coûts cloud"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO", "LICENCE_INFO"],
    matchKeywords: ["data", "etl", "airflow", "dbt", "spark", "bigquery", "snowflake", "pipeline"],
  },
  {
    id: "data-scientist",
    code: "M1801-DATA-SCI",
    label: "Data Scientist",
    riskAutomation: 35,
    domains: ["Tech", "Data", "ML"],
    salary: [{ country: "FR", median: 50000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine"],
    dailyTasks: ["Analyser des datasets", "Construire des modèles ML", "Présenter des insights aux métiers", "A/B tester des hypothèses"],
    requiresDiplomas: ["MASTER_INFO", "DIPL_INGE", "MASTER_MATHS"],
    matchKeywords: ["data science", "machine learning", "python", "pandas", "sklearn", "pytorch", "statistiques"],
  },
  {
    id: "data-analyst",
    code: "M1801-DATA-ANL",
    label: "Data Analyst",
    riskAutomation: 45,
    domains: ["Tech", "Data", "BI"],
    salary: [{ country: "FR", median: 38000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France"],
    dailyTasks: ["Construire des dashboards Tableau / PowerBI", "Écrire du SQL avancé", "Présenter des KPIs", "Identifier des opportunités business"],
    requiresDiplomas: ["LICENCE_INFO", "DUT_STID", "MASTER_INFO"],
    matchKeywords: ["analyst", "sql", "tableau", "power bi", "dashboard", "kpi", "looker"],
  },
  {
    id: "ml-engineer",
    code: "M1801-ML",
    label: "Machine Learning Engineer",
    riskAutomation: 25,
    domains: ["Tech", "Data", "ML"],
    salary: [{ country: "FR", median: 55000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Industrialiser des modèles ML", "Gérer Kubeflow / SageMaker", "Optimiser l'inférence", "Monitorer la dérive des modèles"],
    requiresDiplomas: ["MASTER_INFO", "DIPL_INGE"],
    matchKeywords: ["ml", "machine learning", "pytorch", "tensorflow", "mlops", "kubeflow"],
  },
  {
    id: "mlops-engineer",
    code: "M1801-MLOPS",
    label: "MLOps Engineer",
    riskAutomation: 22,
    domains: ["Tech", "Data", "Infra"],
    salary: [{ country: "FR", median: 55000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Déployer des modèles en prod", "Construire des pipelines training/serving", "Gérer le data versioning", "Implémenter du model monitoring"],
    requiresDiplomas: ["MASTER_INFO", "DIPL_INGE"],
    matchKeywords: ["mlops", "kubeflow", "mlflow", "feature store", "model serving"],
  },
  {
    id: "bi-engineer",
    code: "M1801-BI",
    label: "Business Intelligence Engineer",
    riskAutomation: 40,
    domains: ["Tech", "Data", "BI"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France"],
    dailyTasks: ["Modéliser un data warehouse", "Construire des cubes OLAP", "Gérer les SLAs de reporting", "Architecturer Looker/Metabase"],
    requiresDiplomas: ["LICENCE_INFO", "MASTER_INFO", "DUT_STID"],
    matchKeywords: ["bi", "business intelligence", "warehouse", "dimensional modeling", "olap"],
  },

  // ─────────── DEVOPS / INFRA (6) ───────────
  {
    id: "devops",
    code: "M1810-DEVOPS",
    label: "Ingénieur DevOps",
    riskAutomation: 25,
    domains: ["Tech", "Infra", "Cloud"],
    salary: [{ country: "FR", median: 48000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie"],
    dailyTasks: ["Maintenir des pipelines CI/CD", "Gérer Docker / Kubernetes", "Automatiser via Terraform / Ansible", "Surveiller la prod"],
    requiresDiplomas: ["BTS_SIO_SISR", "DUT_INFO", "LICENCE_INFO", "DIPL_INGE"],
    matchKeywords: ["devops", "kubernetes", "docker", "terraform", "ansible", "ci/cd", "gitlab"],
  },
  {
    id: "sre",
    code: "M1810-SRE",
    label: "Site Reliability Engineer (SRE)",
    riskAutomation: 22,
    domains: ["Tech", "Infra", "Cloud"],
    salary: [{ country: "FR", median: 55000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Gérer les SLOs / error budgets", "Conduire des post-mortems", "Automatiser la réponse incident", "Optimiser la dispo prod"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO"],
    matchKeywords: ["sre", "reliability", "observability", "slo", "incident", "prometheus", "grafana"],
  },
  {
    id: "admin-sys",
    code: "M1810-ADMIN-SYS",
    label: "Administrateur systèmes & réseaux",
    riskAutomation: 38,
    domains: ["Tech", "Infra"],
    salary: [{ country: "FR", median: 35000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France", "Bretagne"],
    dailyTasks: ["Maintenir des serveurs Linux/Windows", "Configurer le réseau (VLAN, firewall)", "Sauvegarder et restaurer", "Support N3 sysadmin"],
    requiresDiplomas: ["BTS_SIO_SISR", "DUT_INFO", "LICENCE_INFO"],
    matchKeywords: ["sysadmin", "linux", "windows server", "active directory", "réseau", "firewall"],
  },
  {
    id: "cloud-engineer",
    code: "M1810-CLOUD",
    label: "Cloud Engineer",
    riskAutomation: 25,
    domains: ["Tech", "Cloud", "Infra"],
    salary: [{ country: "FR", median: 50000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Architecturer du multi-cloud AWS/GCP/Azure", "Optimiser les coûts FinOps", "Automatiser via IaC", "Migrer des workloads"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO", "LICENCE_INFO"],
    matchKeywords: ["aws", "gcp", "azure", "cloud", "finops", "lambda", "ec2"],
  },
  {
    id: "platform-engineer",
    code: "M1810-PLATFORM",
    label: "Platform Engineer",
    riskAutomation: 25,
    domains: ["Tech", "Infra", "Cloud"],
    salary: [{ country: "FR", median: 52000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Construire une plateforme dev interne (IDP)", "Maintenir les outils des autres devs", "Gérer Backstage / ArgoCD", "Industrialiser les self-service"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO"],
    matchKeywords: ["platform engineering", "backstage", "internal developer platform", "argocd", "tooling"],
  },
  {
    id: "architect-cloud",
    code: "M1803-ARCH-CLOUD",
    label: "Architecte cloud",
    riskAutomation: 18,
    domains: ["Tech", "Cloud", "Architecture"],
    salary: [{ country: "FR", median: 75000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Définir l'architecture cible cloud", "Auditer la sécurité", "Faire du capacity planning", "Évangéliser les bonnes pratiques"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO"],
    matchKeywords: ["architecte", "cloud", "well-architected", "design pattern", "saa"],
  },

  // ─────────── CYBERSÉCURITÉ (5) ───────────
  {
    id: "cyber-soc",
    code: "M1802-SOC",
    label: "Analyste cybersécurité (SOC)",
    riskAutomation: 35,
    domains: ["Tech", "Cyber"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "PACA"],
    dailyTasks: ["Surveiller les alertes SIEM", "Investiguer des incidents", "Trier les faux positifs", "Coordonner avec les CSIRT"],
    requiresDiplomas: ["BTS_SIO_SISR", "DUT_INFO", "LICENCE_INFO", "MASTER_CYBER"],
    matchKeywords: ["soc", "siem", "incident response", "cybersécurité", "splunk", "edr"],
  },
  {
    id: "cyber-pentest",
    code: "M1802-PENTEST",
    label: "Pentester / Ethical Hacker",
    riskAutomation: 20,
    domains: ["Tech", "Cyber"],
    salary: [{ country: "FR", median: 50000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Conduire des audits intrusifs", "Exploiter des vulnérabilités", "Rédiger des rapports", "Présenter aux clients"],
    requiresDiplomas: ["MASTER_CYBER", "DIPL_INGE", "LICENCE_INFO"],
    matchKeywords: ["pentest", "ethical hacking", "red team", "burp", "metasploit", "ctf"],
  },
  {
    id: "cyber-grc",
    code: "M1802-GRC",
    label: "Expert GRC (Gouvernance/Risque/Conformité)",
    riskAutomation: 30,
    domains: ["Tech", "Cyber", "Compliance"],
    salary: [{ country: "FR", median: 50000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Mettre en conformité ISO 27001 / NIS2", "Conduire des analyses de risque", "Auditer les fournisseurs", "Former les équipes"],
    requiresDiplomas: ["MASTER_CYBER", "DIPL_INGE", "MASTER_DROIT"],
    matchKeywords: ["grc", "iso 27001", "rgpd", "compliance", "audit", "risk"],
  },
  {
    id: "cyber-appsec",
    code: "M1802-APPSEC",
    label: "Ingénieur sécurité applicative",
    riskAutomation: 25,
    domains: ["Tech", "Cyber", "Dev"],
    salary: [{ country: "FR", median: 52000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Auditer du code source (SAST)", "Concevoir des architectures sécurisées", "Modéliser les menaces (STRIDE)", "Former les devs"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_CYBER"],
    matchKeywords: ["appsec", "sast", "dast", "secure coding", "owasp", "threat modeling"],
  },
  {
    id: "cyber-crypto",
    code: "M1802-CRYPTO",
    label: "Cryptographe / Crypto-engineer",
    riskAutomation: 15,
    domains: ["Tech", "Cyber", "Maths"],
    salary: [{ country: "FR", median: 60000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Concevoir des protocoles cryptographiques", "Auditer des implémentations", "Évaluer la résistance post-quantique", "Publier du research"],
    requiresDiplomas: ["MASTER_INFO", "DIPL_INGE", "DOCTORAT_INFO"],
    matchKeywords: ["cryptographie", "post-quantum", "tls", "pki", "zero-knowledge"],
  },

  // ─────────── PRODUIT / DESIGN (5) ───────────
  {
    id: "product-manager",
    code: "M1402-PM",
    label: "Product Manager Tech",
    riskAutomation: 25,
    domains: ["Tech", "Produit"],
    salary: [{ country: "FR", median: 55000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Définir la roadmap produit", "Prioriser le backlog", "Interviewer les utilisateurs", "Aligner les stakeholders"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO", "MASTER_BUSINESS"],
    matchKeywords: ["product manager", "pm", "produit", "roadmap", "backlog", "user research"],
  },
  {
    id: "product-owner",
    code: "M1402-PO",
    label: "Product Owner",
    riskAutomation: 35,
    domains: ["Tech", "Produit", "Agile"],
    salary: [{ country: "FR", median: 45000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France"],
    dailyTasks: ["Rédiger des user stories", "Animer le daily/sprint planning", "Affiner le backlog avec l'équipe", "Recetter les features"],
    requiresDiplomas: ["LICENCE_INFO", "MASTER_INFO", "MASTER_BUSINESS"],
    matchKeywords: ["product owner", "po", "agile", "scrum", "user stories", "sprint"],
  },
  {
    id: "ux-designer",
    code: "E1104-UX",
    label: "UX Designer",
    riskAutomation: 20,
    domains: ["Tech", "Design", "UX"],
    salary: [{ country: "FR", median: 42000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie"],
    dailyTasks: ["Conduire des user interviews", "Construire des wireframes / prototypes Figma", "Faire de l'A/B testing", "Évaluer l'accessibilité"],
    requiresDiplomas: ["LICENCE_DESIGN", "MASTER_DESIGN", "DIPL_INGE"],
    matchKeywords: ["ux", "user experience", "research", "figma", "wireframe", "accessibilité"],
  },
  {
    id: "ui-designer",
    code: "E1104-UI",
    label: "UI Designer",
    riskAutomation: 35,
    domains: ["Tech", "Design", "UI"],
    salary: [{ country: "FR", median: 40000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Designer des interfaces sur Figma", "Maintenir un design system", "Collaborer avec les devs front", "Faire des animations / motion"],
    requiresDiplomas: ["LICENCE_DESIGN", "MASTER_DESIGN"],
    matchKeywords: ["ui", "design", "figma", "design system", "interface"],
  },
  {
    id: "product-designer",
    code: "E1104-PROD-DES",
    label: "Product Designer",
    riskAutomation: 22,
    domains: ["Tech", "Design", "Produit"],
    salary: [{ country: "FR", median: 48000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Couvrir UX + UI bout en bout", "Participer aux discoveries produit", "Maintenir la cohérence cross-feature", "Pousser des prototypes interactifs"],
    requiresDiplomas: ["LICENCE_DESIGN", "MASTER_DESIGN", "DIPL_INGE"],
    matchKeywords: ["product designer", "ux/ui", "figma", "prototype", "design system"],
  },

  // ─────────── ARCHITECTURE / LEAD (3) ───────────
  {
    id: "tech-lead",
    code: "M1803-LEAD",
    label: "Tech Lead",
    riskAutomation: 15,
    domains: ["Tech", "Management"],
    salary: [{ country: "FR", median: 65000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Occitanie"],
    dailyTasks: ["Encadrer techniquement une équipe de 3-8 devs", "Faire des reviews architecturales", "Mentorer les juniors", "Décider des choix techniques"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO"],
    matchKeywords: ["tech lead", "lead developer", "mentorat", "code review"],
  },
  {
    id: "architect-soft",
    code: "M1803-ARCH",
    label: "Architecte logiciel",
    riskAutomation: 15,
    domains: ["Tech", "Architecture"],
    salary: [{ country: "FR", median: 75000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Designer des architectures systèmes complexes", "Auditer les choix techniques", "Rédiger des ADR", "Évangéliser DDD / Event Sourcing"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO"],
    matchKeywords: ["architect", "ddd", "event sourcing", "microservices", "system design"],
  },
  {
    id: "cto",
    code: "M1803-CTO",
    label: "CTO / VP Engineering",
    riskAutomation: 10,
    domains: ["Tech", "Management", "Stratégie"],
    salary: [{ country: "FR", median: 110000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Définir la stratégie technique de l'entreprise", "Recruter le top engineering", "Gérer les budgets infra", "Aligner avec les fondateurs"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO"],
    matchKeywords: ["cto", "vp engineering", "stratégie tech", "engineering management"],
  },

  // ─────────── QA / TEST (2) ───────────
  {
    id: "qa-engineer",
    code: "M1805-QA",
    label: "QA Engineer",
    riskAutomation: 50,
    domains: ["Tech", "QA"],
    salary: [{ country: "FR", median: 38000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France"],
    dailyTasks: ["Concevoir des plans de tests", "Tester manuellement les régressions", "Automatiser les tests E2E (Cypress, Playwright)", "Rapporter les bugs"],
    requiresDiplomas: ["BTS_SIO_SLAM", "DUT_INFO", "LICENCE_INFO"],
    matchKeywords: ["qa", "test", "cypress", "playwright", "selenium", "automation"],
  },
  {
    id: "sdet",
    code: "M1805-SDET",
    label: "SDET (Software Engineer in Test)",
    riskAutomation: 35,
    domains: ["Tech", "QA", "Dev"],
    salary: [{ country: "FR", median: 48000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Coder des frameworks de test", "Intégrer les tests dans la CI/CD", "Faire du performance testing", "Auditer la couverture"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO", "LICENCE_INFO"],
    matchKeywords: ["sdet", "test automation", "performance testing", "load test"],
  },

  // ─────────── SUPPORT / AUTRES (3) ───────────
  {
    id: "tech-support",
    code: "M1810-SUPPORT",
    label: "Technicien support IT",
    riskAutomation: 55,
    domains: ["Tech", "Support"],
    salary: [{ country: "FR", median: 28000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France", "PACA"],
    dailyTasks: ["Résoudre des tickets utilisateurs N1/N2", "Configurer postes Windows/Mac", "Gérer les imprimantes et VPN", "Documenter les procédures"],
    requiresDiplomas: ["BTS_SIO_SISR", "DUT_INFO", "BAC_PRO_SN"],
    matchKeywords: ["support", "helpdesk", "support technique", "incident", "itil"],
  },
  {
    id: "dba",
    code: "M1810-DBA",
    label: "Administrateur base de données (DBA)",
    riskAutomation: 35,
    domains: ["Tech", "Data", "Infra"],
    salary: [{ country: "FR", median: 48000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Optimiser les requêtes lentes", "Gérer la haute dispo (replication, failover)", "Maintenir Postgres / Oracle / SQL Server", "Sauvegarder et restaurer"],
    requiresDiplomas: ["LICENCE_INFO", "DIPL_INGE", "BTS_SIO_SISR"],
    matchKeywords: ["dba", "postgres", "oracle", "mysql", "performance tuning", "replication"],
  },
  {
    id: "tech-consultant",
    code: "M1402-CONSULTANT",
    label: "Consultant tech / Avant-vente",
    riskAutomation: 30,
    domains: ["Tech", "Conseil"],
    salary: [{ country: "FR", median: 50000, currency: "EUR" }],
    regionsTopHiring: ["Île-de-France", "Auvergne-Rhône-Alpes"],
    dailyTasks: ["Auditer des systèmes clients", "Rédiger des recommandations", "Conduire des ateliers", "Pitcher des solutions"],
    requiresDiplomas: ["DIPL_INGE", "MASTER_INFO", "MASTER_BUSINESS"],
    matchKeywords: ["consultant", "conseil", "audit", "avant-vente", "pre-sales"],
  },
];

async function main() {
  if (TECH_JOBS.length !== 40) {
    throw new Error(`Expected 40 jobs, got ${TECH_JOBS.length}`);
  }
  const db = createDb(DB_PATH);

  const rows: JobInsert[] = TECH_JOBS.map((j) => ({
    id: j.id,
    code: j.code,
    label: j.label,
    riskAutomation: j.riskAutomation,
    domains: J(j.domains),
    salary: J(j.salary),
    regionsTopHiring: J(j.regionsTopHiring),
    dailyTasks: J(j.dailyTasks),
    requiresDiplomas: J(j.requiresDiplomas),
    matchKeywords: J(j.matchKeywords),
  }));

  // Upsert : remplace si l'id existe déjà, insère sinon. Idempotent.
  console.log(`Seeding ${rows.length} Tech jobs…`);
  await db
    .insert(jobs)
    .values(rows)
    .onConflictDoUpdate({
      target: jobs.id,
      set: {
        code: sql`excluded.code`,
        label: sql`excluded.label`,
        riskAutomation: sql`excluded.risk_automation_x100`,
        domains: sql`excluded.domains`,
        salary: sql`excluded.salary`,
        regionsTopHiring: sql`excluded.regions_top_hiring`,
        dailyTasks: sql`excluded.daily_tasks`,
        requiresDiplomas: sql`excluded.requires_diplomas`,
        matchKeywords: sql`excluded.match_keywords`,
        updatedAt: sql`(unixepoch())`,
      },
    });

  console.log(`OK — ${rows.length} jobs upserted (cible : 40).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
