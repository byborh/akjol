import { sqliteTable, integer, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Catalogue : niveaux d'études, formations concrètes, métiers et leurs liens.
 * Le canvas (projects + canvasData) sera ajouté quand on implémentera l'éditeur.
 */

export const etudes = sqliteTable("etudes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  niveau: text("niveau").notNull(),
  duree: integer("duree"),
  type: text("type").notNull(),
  description: text("description"),
});

export const metiers = sqliteTable("metiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  secteur: text("secteur"),
  description: text("description"),
  salaireMin: integer("salaire_min"),
  salaireMax: integer("salaire_max"),
});

export const formations = sqliteTable("formations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  etudeId: integer("etude_id")
    .notNull()
    .references(() => etudes.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  etablissement: text("etablissement"),
  ville: text("ville"),
  voie: text("voie"),
});

export const etudeMetierLinks = sqliteTable("etude_metier_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  etudeId: integer("etude_id")
    .notNull()
    .references(() => etudes.id, { onDelete: "cascade" }),
  metierId: integer("metier_id")
    .notNull()
    .references(() => metiers.id, { onDelete: "cascade" }),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  canvasData: text("canvas_data"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * programs : table cible de l'ingestion (ONISEP, Mon Master, UCAS, Common App…).
 * Miroir riche du type Program front (apps/akjol_front/src/types.ts) +
 * colonnes de provenance (source, sourceUrl, sourceId, lastIngestedAt) et
 * un contentHash pour la détection de diff entre runs.
 *
 * Les champs structurés (langue, accepted diplomas, documents, etc.) sont
 * stockés en JSON text — SQLite n'a pas de type natif, et cela suffit pour
 * un read côté API. Si on bascule Postgres plus tard, ce sont des jsonb.
 */
export const programs = sqliteTable(
  "programs",
  {
    id: text("id").primaryKey(),

    // Provenance
    source: text("source").notNull(), // "onisep" | "mon_master" | "ucas" | "common_app" | "manual"
    sourceId: text("source_id").notNull(), // identifiant stable côté source
    sourceUrl: text("source_url"),
    lastIngestedAt: integer("last_ingested_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    contentHash: text("content_hash").notNull(),
    deprecated: integer("deprecated", { mode: "boolean" }).notNull().default(false),
    deprecatedAt: integer("deprecated_at", { mode: "timestamp" }),

    // Identité programme
    countryRef: text("country_ref").notNull(), // ISO2
    formationCode: text("formation_code").notNull(),
    formationLabel: text("formation_label").notNull(),
    title: text("title").notNull(),
    level: text("level").notNull(), // ProgramLevel
    durationYears: integer("duration_years").notNull(),
    description: text("description").notNull().default(""),

    // École (dénormalisé — on n'a pas (encore) de table schools)
    schoolName: text("school_name").notNull(),
    schoolCity: text("school_city").notNull(),
    schoolType: text("school_type"),
    schoolWebsiteUrl: text("school_website_url"),

    // Langue / coût / admission
    languageCode: text("language_code").notNull(),
    languageMinLevel: text("language_min_level").notNull(), // CEFR
    costPerYear: integer("cost_per_year").notNull().default(0),
    admissionPlatform: text("admission_platform").notNull(),
    applicationOpens: text("application_opens"),
    applicationCloses: text("application_closes"),
    applicationFee: integer("application_fee"),
    workStudy: integer("work_study", { mode: "boolean" }).notNull().default(false),

    // Diplôme délivré
    resultingDiplomaCode: text("resulting_diploma_code").notNull(),
    resultingDiplomaLabel: text("resulting_diploma_label").notNull(),
    minGrade: text("min_grade"), // JSON {value, scaleMax}

    // Champs JSON (arrays / objets)
    acceptedDiplomas: text("accepted_diplomas").notNull().default("[]"),
    domains: text("domains").notNull().default("[]"),
    outcomesJobs: text("outcomes_jobs").notNull().default("[]"),
    outcomesNextLevels: text("outcomes_next_levels").notNull().default("[]"),
    internationallyRecognizedIn: text("internationally_recognized_in").notNull().default("[]"),
    documents: text("documents").notNull().default("[]"),
    optionalSteps: text("optional_steps"),
    recommendsCertificate: text("recommends_certificate"),
    recommendsInternshipWeeks: integer("recommends_internship_weeks"),
  },
  (t) => ({
    bySourceUnique: uniqueIndex("programs_source_sourceid_unique").on(t.source, t.sourceId),
    byCountry: index("programs_country_idx").on(t.countryRef),
    byLevel: index("programs_level_idx").on(t.level),
    bySource: index("programs_source_idx").on(t.source),
  }),
);

/**
 * users : 1 ligne par utilisateur connecté.
 *
 * Auth (Phase 1 doc) : `provider` indique comment l'user s'est connecté ("password"
 * ou "google"). `passwordHash` est le hash bcrypt (cost=10), null si l'user vient
 * de Google. `googleId` est le sub OIDC, unique, null si l'user vient de
 * password. `emailVerified` est mis à true automatiquement pour Google (OIDC
 * garantit l'email), false par défaut pour password.
 *
 * `role` sert au gating /admin (cf. Phase 3 doc).
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // nanoid 12 chars
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    role: text("role").notNull().default("student"), // "student" | "curator" | "admin"
    provider: text("provider").notNull().default("password"), // "password" | "google"
    passwordHash: text("password_hash"),
    googleId: text("google_id").unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    avatarUrl: text("avatar_url"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    byEmail: index("users_email_idx").on(t.email),
    byGoogleId: index("users_google_id_idx").on(t.googleId),
  }),
);

/**
 * user_passports : un blob JSON par user. Le passeport est atomique
 * (édité tout entier via /onboarding), JSON suffit, pas de colonnes éclatées.
 * `updatedAt` sert au lastWriteWins de la sync.
 */
export const userPassports = sqliteTable("user_passports", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passportJson: text("passport_json").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** user_plans : items[] du plan-store, sérialisé. */
export const userPlans = sqliteTable("user_plans", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  planJson: text("plan_json").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** user_parcours : parcours[] du parcours-store. */
export const userParcours = sqliteTable("user_parcours", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  parcoursJson: text("parcours_json").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** user_documents : metas du documents-store. */
export const userDocuments = sqliteTable("user_documents", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  documentsJson: text("documents_json").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * jobs : miroir du type Job front (apps/akjol_front/src/data/jobs.ts).
 * Champs structurés (salary, regions, tasks, requiresDiplomas, matchKeywords)
 * en JSON text — même logique que programs.
 */
export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    riskAutomation: integer("risk_automation_x100").notNull().default(0), // 0..100
    domains: text("domains").notNull().default("[]"),
    salary: text("salary").notNull().default("[]"),
    regionsTopHiring: text("regions_top_hiring").notNull().default("[]"),
    dailyTasks: text("daily_tasks").notNull().default("[]"),
    requiresDiplomas: text("requires_diplomas").notNull().default("[]"),
    matchKeywords: text("match_keywords").notNull().default("[]"),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    byCode: index("jobs_code_idx").on(t.code),
  }),
);

/**
 * equivalence_edges : graphe des équivalences entre diplômes, édité par les
 * curators sur /admin/graph. Source de vérité pour le moteur feasibility —
 * lu par tout user, écrit uniquement par role=curator|admin.
 *
 * `from` / `to` sont des codes diplôme (cf. data/diplomas.ts), pas des FK
 * vers une table — le référentiel des codes reste front-side pour l'instant.
 */
export const equivalenceEdges = sqliteTable(
  "equivalence_edges",
  {
    id: text("id").primaryKey(),
    from: text("from_code").notNull(),
    to: text("to_code").notNull(),
    kind: text("kind").notNull(), // "equivalent" | "acceptedAs" | "requiresBridge" | "notRecognized"
    weight: integer("weight_x100").notNull().default(100), // 0..100, mappé 0..1 côté front
    note: text("note"),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => ({
    byFrom: index("equivalence_edges_from_idx").on(t.from),
    byTo: index("equivalence_edges_to_idx").on(t.to),
  }),
);

/**
 * equivalence_revisions : log append-only des modifications du graphe.
 * Permet le revert UI dans /admin/graph (History panel).
 * `snapshotJson` contient l'état de l'arête AVANT l'action (pour create :
 * null ; pour update : ancienne version ; pour delete : version supprimée).
 */
export const equivalenceRevisions = sqliteTable(
  "equivalence_revisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    edgeId: text("edge_id").notNull(),
    action: text("action").notNull(), // "create" | "update" | "delete"
    snapshotJson: text("snapshot_json"),
    at: integer("at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    by: text("by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => ({
    byEdge: index("equivalence_revisions_edge_idx").on(t.edgeId),
    byAt: index("equivalence_revisions_at_idx").on(t.at),
  }),
);

/**
 * ingestion_runs : journal des exécutions du pipeline d'ingestion.
 * Permet de comparer un run au précédent (diff detection) et d'auditer.
 */
export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  status: text("status").notNull().default("running"), // running | success | failed
  inserted: integer("inserted").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  unchanged: integer("unchanged").notNull().default(0),
  deprecated: integer("deprecated").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  notes: text("notes"),
});

export type Etude = typeof etudes.$inferSelect;
export type Metier = typeof metiers.$inferSelect;
export type Formation = typeof formations.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProgramRow = typeof programs.$inferSelect;
export type ProgramInsert = typeof programs.$inferInsert;
export type JobRow = typeof jobs.$inferSelect;
export type JobInsert = typeof jobs.$inferInsert;
export type IngestionRun = typeof ingestionRuns.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type UserPassport = typeof userPassports.$inferSelect;
export type UserPlan = typeof userPlans.$inferSelect;
export type UserParcours = typeof userParcours.$inferSelect;
export type UserDocuments = typeof userDocuments.$inferSelect;
export type EquivalenceEdgeRow = typeof equivalenceEdges.$inferSelect;
export type EquivalenceEdgeInsert = typeof equivalenceEdges.$inferInsert;
export type EquivalenceRevisionRow = typeof equivalenceRevisions.$inferSelect;
export type EquivalenceRevisionInsert = typeof equivalenceRevisions.$inferInsert;
