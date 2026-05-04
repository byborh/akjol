import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
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

export type Etude = typeof etudes.$inferSelect;
export type Metier = typeof metiers.$inferSelect;
export type Formation = typeof formations.$inferSelect;
export type Project = typeof projects.$inferSelect;
